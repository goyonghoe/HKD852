#!/usr/bin/env python3
"""
YouTube Shorts 영상 합성기 — Qwen3-TTS VoiceDesign 전용
PIL 자막 이미지 + moviepy 합성 방식
"""

import asyncio
import json
import os
import re
import ssl
import subprocess
import sys
import wave
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

try:
    from moviepy import ColorClip, AudioFileClip, ImageClip, VideoFileClip, VideoClip, CompositeVideoClip, vfx
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "moviepy", "-q"])
    from moviepy import ColorClip, AudioFileClip, ImageClip, VideoFileClip, VideoClip, CompositeVideoClip, vfx

from PIL import Image, ImageDraw, ImageFont
import numpy as np

from tts_engine import (
    Qwen3TTSEngine, Qwen3CustomVoiceEngine,
    QWEN3_VOICE_PRESETS, QWEN3_CLONE_PRESETS, QWEN3_DEFAULT_VOICE, _get_duration,
)
from subtitle_gen import split_sentences, calc_sentence_timings

# 디렉토리 설정
AGENT_DIR = Path(__file__).parent.parent
PIPELINE_DIR = AGENT_DIR / "pipeline"
TEMP_DIR = PIPELINE_DIR / "temp"
RENDERED_DIR = PIPELINE_DIR / "rendered"

for d in [TEMP_DIR, RENDERED_DIR]:
    d.mkdir(parents=True, exist_ok=True)


# ── Per-Scene TTS 아키텍처 (v3.0) ────────────────────────

INTER_SCENE_SILENCE = 0.15  # 씬 간 자연스러운 숨 쉬기 무음 (초)


@dataclass
class SceneAudioSegment:
    """씬별 통합 타이밍 데이터 — 단일 타이밍 소스 (Per-Scene TTS).

    audio_start/end: 결합 오디오 기준 정확한 오프셋 (산술 계산, 오차 0)
    whisper_words: 씬 내 Whisper 워드 (로컬 → 글로벌 시프트 완료)
    phrases: 자막용 구절 리스트
    phrase_timings: 구절별 (start, end) 리스트
    """
    scene_id: int
    scene_text: str
    audio_start: float          # 결합 WAV 기준 시작 시점
    audio_end: float            # 결합 WAV 기준 종료 시점
    wav_path: str = ""          # 개별 씬 WAV 경로
    whisper_words: list = field(default_factory=list)
    phrases: list = field(default_factory=list)
    phrase_timings: list = field(default_factory=list)
    image_path: str = ""

    @property
    def duration(self) -> float:
        return self.audio_end - self.audio_start


# ── VideoToolbox HW 인코딩 감지 ───────────────────────────
_HAS_VIDEOTOOLBOX = None  # 런타임 캐시


def _check_videotoolbox() -> bool:
    """Apple VideoToolbox h264_videotoolbox 인코더 사용 가능 여부."""
    global _HAS_VIDEOTOOLBOX
    if _HAS_VIDEOTOOLBOX is not None:
        return _HAS_VIDEOTOOLBOX
    try:
        r = subprocess.run(
            ["ffmpeg", "-hide_banner", "-encoders"],
            capture_output=True, text=True, timeout=5,
        )
        _HAS_VIDEOTOOLBOX = "h264_videotoolbox" in r.stdout
    except Exception:
        _HAS_VIDEOTOOLBOX = False
    return _HAS_VIDEOTOOLBOX


def _ffmpeg_mux(video_clip, audio_path: str, output_path: str, fps: int = 30):
    """moviepy CompositeVideoClip → FFmpeg 다이렉트 파이프로 최종 인코딩.

    VideoToolbox HW 인코더가 있으면 h264_videotoolbox,
    없으면 libx264 veryfast 소프트웨어 인코딩.
    """
    import tempfile

    width, height = int(video_clip.w), int(video_clip.h)
    duration = video_clip.duration

    # VideoToolbox 사용 여부 결정
    use_hw = _check_videotoolbox()
    if use_hw:
        codec_args = ["-c:v", "h264_videotoolbox",
                      "-b:v", "2M",  # 2Mbps (약 10-15MB for 60초)
                      "-profile:v", "high"]
        enc_label = "VideoToolbox HW"
    else:
        codec_args = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "23"]
        enc_label = "libx264 SW"
    print(f"      인코딩: {enc_label} ({width}x{height} @ {fps}fps)")

    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        # 비디오 입력: rawvideo pipe
        "-f", "rawvideo", "-vcodec", "rawvideo",
        "-s", f"{width}x{height}", "-pix_fmt", "rgb24",
        "-r", str(fps), "-i", "-",
        # 오디오 입력
        "-i", audio_path,
        # 인코딩 설정
        *codec_args,
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        "-shortest",
        output_path,
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)

    try:
        total_frames = int(duration * fps)
        for t_idx in range(total_frames):
            t = t_idx / fps
            frame = video_clip.get_frame(t)
            frame_bytes = frame.astype(np.uint8).tobytes()
            try:
                proc.stdin.write(frame_bytes)
            except BrokenPipeError:
                # -shortest 플래그로 인해 FFmpeg가 오디오 종료 후 파이프를 닫을 수 있음
                break
        try:
            proc.stdin.close()
        except BrokenPipeError:
            pass
        proc.wait(timeout=120)
        if proc.returncode != 0:
            err_msg = proc.stderr.read().decode(errors="replace")[:500] if proc.stderr else ""
            raise RuntimeError(f"FFmpeg 인코딩 실패 (rc={proc.returncode}): {err_msg}")
    except BrokenPipeError:
        # FFmpeg가 정상 종료한 경우 (오디오 기준 -shortest)
        try:
            proc.stdin.close()
        except Exception:
            pass
        proc.wait(timeout=120)
        if proc.returncode != 0:
            err_msg = proc.stderr.read().decode(errors="replace")[:500] if proc.stderr else ""
            raise RuntimeError(f"FFmpeg 인코딩 실패 (rc={proc.returncode}): {err_msg}")
    except Exception:
        try:
            proc.kill()
            proc.wait(timeout=5)
        except Exception:
            pass
        raise


# 영상 포맷 프리셋
FORMAT_PRESETS = {
    "dark-bg-text": {
        "bg_color": (15, 15, 25),
        "font_size": 52,
        "subtitle_y": 1350,
    },
    "gradient-bg": {
        "bg_color": (26, 0, 51),
        "font_size": 56,
        "subtitle_y": 900,
    },
    "list-countdown": {
        "bg_color": (13, 17, 23),
        "font_size": 48,
        "subtitle_y": 1300,
    },
}

# 폰트 경로 (macOS)
FONT_PATHS = {
    "en": "/System/Library/Fonts/Supplemental/Arial.ttf",
    "en_fallback": "/System/Library/Fonts/Helvetica.ttc",
    "ko": "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    "ja": "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
}


def detect_language(text: str) -> str:
    for char in text:
        if "\uac00" <= char <= "\ud7af":
            return "ko"
        if "\u3040" <= char <= "\u30ff" or "\u4e00" <= char <= "\u9fff":
            return "ja"
    return "en"


_font_cache: dict = {}  # (language, size) → ImageFont 캐시


def get_font(language: str, size: int) -> ImageFont.FreeTypeFont:
    """언어에 맞는 Bold 폰트 로드 (캐시 적용)"""
    cache_key = (language, size)
    if cache_key in _font_cache:
        return _font_cache[cache_key]

    # .ttc 파일 내 Bold weight 인덱스
    BOLD_INDEX = {"ko": 6, "ja": 0, "en": 0}

    paths = [FONT_PATHS.get(language, ""), FONT_PATHS.get(f"{language}_fallback", "")]
    paths += list(FONT_PATHS.values())

    for path in paths:
        if path and os.path.exists(path):
            try:
                if path.endswith(".ttc"):
                    idx = BOLD_INDEX.get(language, 0)
                    font = ImageFont.truetype(path, size, index=idx)
                else:
                    font = ImageFont.truetype(path, size)
                _font_cache[cache_key] = font
                return font
            except Exception:
                continue
    return ImageFont.load_default()


def split_into_chunks(text: str, max_chars: int = 16) -> list[str]:
    """텍스트를 짧은 의미 덩어리로 분할 (자막용, 공백 기준)"""
    if len(text) <= max_chars:
        return [text]

    words = text.split()
    parts = []
    current = ""
    for word in words:
        if current and len(current + " " + word) > max_chars:
            parts.append(current.strip())
            current = word
        else:
            current = (current + " " + word).strip() if current else word
    if current.strip():
        parts.append(current.strip())
    return parts if parts else [text]


def _number_to_sino_korean(n: int) -> str:
    """아라비아 숫자 → 한국어 한자어 수사 (일이삼...)."""
    if n == 0:
        return "영"
    units = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"]
    bigs = ["", "십", "백", "천"]
    mans = ["", "만", "억", "조"]

    result = ""
    # 만 단위로 분할
    groups = []
    while n > 0:
        groups.append(n % 10000)
        n //= 10000

    for gi, g in enumerate(groups):
        if g == 0:
            continue
        part = ""
        for di in range(4):
            d = g % 10
            g //= 10
            if d == 0:
                continue
            prefix = units[d] if not (d == 1 and di > 0) else ""
            part = prefix + bigs[di] + part
        result = part + mans[gi] + result

    return result


def _number_to_native_korean(n: int) -> str:
    """아라비아 숫자 → 한국어 고유어 수사 (하나둘셋..., 관형형: 한두세...)."""
    native = {
        1: "한", 2: "두", 3: "세", 4: "네", 5: "다섯",
        6: "여섯", 7: "일곱", 8: "여덟", 9: "아홉", 10: "열",
        20: "스무", 30: "서른", 40: "마흔", 50: "쉰",
    }
    if n in native:
        return native[n]
    if 11 <= n <= 59:
        tens = (n // 10) * 10
        ones = n % 10
        t = native.get(tens, "")
        o = native.get(ones, "")
        return t + o
    # 60 이상은 한자어로 폴백
    return _number_to_sino_korean(n)


def _convert_korean_numbers(text: str) -> str:
    """한국어 텍스트 내 숫자를 한국식으로 변환.

    규칙:
    - 한자어 수사: 일/월/년/분/초/원/호/위/배/%, km, kg, kcal 등
    - 고유어 수사 (관형형): 개/명/마리/번/살/시/잔/병/장/권/대/벌/그루/채
    - 단위 없는 큰 숫자: 한자어 (100만→백만)
    - 소수점: 점 (3.14→삼점일사)
    """
    # 소수점 숫자 (3.14 → 삼점일사)
    def _decimal_to_kr(m):
        integer_part = int(m.group(1))
        decimal_part = m.group(2)
        kr_int = _number_to_sino_korean(integer_part)
        kr_dec = "".join(
            ["영", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"][int(d)]
            for d in decimal_part
        )
        return kr_int + "점" + kr_dec
    text = re.sub(r'(\d+)\.(\d+)', _decimal_to_kr, text)

    # 복합 숫자 (100만명→백만명, 10억원→십억원): 숫자+만/억/조 → 한자어로 합산
    def _compound_number(m):
        n = int(m.group(1))
        multiplier = m.group(2)
        suffix = m.group(3) or ""
        mult_map = {"만": 10000, "억": 100000000, "조": 1000000000000}
        total = n * mult_map[multiplier]
        return _number_to_sino_korean(total) + suffix
    text = re.sub(r'(\d+)(만|억|조)(\w*)', _compound_number, text)

    # 연령대: 10대→십대, 20대→이십대, 60대→육십대 (한자어, 고유어 아님)
    # 10~90의 10배수 + "대"만 매칭 → 고유어 카운터보다 먼저 처리
    def _age_group(m):
        n = int(m.group(1))
        return _number_to_sino_korean(n) + "대"
    text = re.sub(r'(?<!\d)([1-9]0)대', _age_group, text)

    # 고유어 수사 단위 (관형형): 1개→한 개, 3명→세 명
    native_counters = r'(개|명|마리|번|살|시|잔|병|장|권|대|벌|그루|채|가지|곳|줄)'
    def _native_counter(m):
        n = int(m.group(1))
        counter = m.group(2)
        if n > 59:
            return _number_to_sino_korean(n) + counter
        return _number_to_native_korean(n) + " " + counter
    text = re.sub(rf'(\d+)\s*{native_counters}', _native_counter, text)

    # 한자어 수사 단위: 3일→삼일, 100원→백원
    sino_counters = r'(일|월|년|분|초|원|호|위|배|퍼센트|프로|층|번째|세기|km|kg|kcal|cm|mm|m|g|ml|L|도)'
    def _sino_counter(m):
        n = int(m.group(1))
        counter = m.group(2)
        return _number_to_sino_korean(n) + counter
    text = re.sub(rf'(\d+)\s*{sino_counters}', _sino_counter, text)

    # 남은 독립 숫자 (단위 없음): 한자어로
    def _standalone_num(m):
        n = int(m.group(0))
        if n > 99999999:
            return m.group(0)  # 너무 큰 숫자는 그대로
        return _number_to_sino_korean(n)
    text = re.sub(r'(?<![.\d])\d+(?![.\d\w])', _standalone_num, text)

    return text


def preprocess_korean_for_tts(text: str) -> str:
    """한국어 텍스트 전처리: 숫자 변환 + 호흡 유도 + 감탄/강조 마커 + 문장 끝 여운.

    v3.2 인간화: TTS가 자연스러운 한국인 말투로 읽을 수 있도록 텍스트 레벨에서 유도.
    """
    # 1단계: 숫자 → 한국어
    result = _convert_korean_numbers(text)

    # 2단계: 호흡 유도 쉼표 — 접속사/부사 뒤
    breath_adverbs = [
        # 기존 접속사
        "만약에", "그래서", "결국", "하지만", "그러나", "그런데", "따라서", "물론", "사실",
        # 강조 부사
        "정말", "진짜", "완전히", "절대로", "심지어",
        # 대조 접속사
        "반면에", "오히려", "그 대신",
        # 시간 표현
        "그때", "바로 그 순간", "마침내",
    ]
    for adv in breath_adverbs:
        result = re.sub(rf'({re.escape(adv)})\s+(?!,)', rf'\1, ', result)
    for ending in [r'인데', r'는데', r'지만', r'니까']:
        result = re.sub(rf'(\w+{ending})\s+(?![,?.!])', rf'\1, ', result)

    # 3단계: 의문문 앞 미세 정지 — "...?" 유도
    result = re.sub(r'(?<!\.)(\?)', r'...?', result)

    # 4단계: 평서문 끝 여운 — 긴 문장 "다." → "다..."
    # 짧은 문장(<10자)은 이미 자연스러우므로 처리하지 않음
    def _add_trailing_pause(m):
        sentence = m.group(0)
        # 이미 "..." 가 있으면 건너뜀
        if "..." in sentence:
            return sentence
        # 10자 이상 문장만 처리
        if len(sentence) < 10:
            return sentence
        return sentence[:-1] + "..."
    result = re.sub(r'[^.!?…]{10,}다\.', _add_trailing_pause, result)

    # 정리: 중복 쉼표/말줄임 제거
    result = re.sub(r',\s*,', ',', result)
    result = re.sub(r'\.{4,}', '...', result)

    return result


def split_korean_phrases(text: str, max_chars: int = 16) -> list[str]:
    """한국어 텍스트를 의미 단위 구절로 분할 (자막용).

    핵심 원칙:
    1. 조사/연결어미 뒤에서 끊는다 (의미 경계)
    2. 서술어 단위는 끊지 않는다 (먹어도 된다면 = 하나)
    3. 부사+서술어는 붙인다 (겨우 60kcal = 하나)
    4. max_chars 초과 시에만 분할한다
    """
    sentences = split_sentences(text)
    phrases = []
    for sent in sentences:
        sent = sent.strip()
        if not sent:
            continue
        if len(sent) <= max_chars:
            phrases.append(sent)
            continue
        phrases.extend(_split_korean_semantic(sent, max_chars))
    return phrases


# 한국어 의미 경계 어미/조사 목록 (우선순위별)
# 절 경계 (높음): 연결어미 뒤에서 끊기
_KO_CLAUSE_ENDINGS = [
    "자마자", "인데", "는데", "지만", "어도", "아도", "니까",
    "으니", "면서", "거나", "다면", "더니", "므로", "래서",
    "어서", "아서", "려고", "고서", "다가", "건만",
]
# 구 경계 (중간): 격조사/부사격 뒤에서 끊기
_KO_PHRASE_ENDINGS = [
    "에서", "부터", "까지", "에게", "한테", "로서", "처럼",
    "보다", "만큼", "대로", "에는", "에도", "으로",
    "에", "을", "를", "은", "는", "이", "가", "의", "와", "과", "로", "도",
]


def _split_korean_semantic(text: str, max_chars: int) -> list[str]:
    """한국어 의미 청크 분할 — 스코어 기반 최적 분할.

    1단계: 숫자 내 쉼표 보존하며 쉼표 분할 (2,000 등)
    2단계: 초과 청크는 최적 분할점 탐색 (어미/조사 스코어링)
    """
    parts = _smart_comma_split(text)
    result = []
    for part in parts:
        part = part.strip()
        if part:
            result.extend(_split_to_fit(part, max_chars))
    return result


def _smart_comma_split(text: str) -> list[str]:
    """쉼표로 분할하되, 숫자 사이 쉼표(2,000)는 보존."""
    parts = []
    current = ""
    for i, ch in enumerate(text):
        if ch == ",":
            before_digit = i > 0 and text[i - 1].isdigit()
            after_digit = i + 1 < len(text) and text[i + 1].isdigit()
            if before_digit and after_digit:
                current += ch  # 숫자 내 쉼표 보존
            else:
                if current.strip():
                    parts.append(current.strip())
                current = ""
        else:
            current += ch
    if current.strip():
        parts.append(current.strip())
    return parts if parts else [text]


_KO_ALL_ENDINGS = set(_KO_CLAUSE_ENDINGS + _KO_PHRASE_ENDINGS)


def _has_known_ending(word: str) -> bool:
    """어절이 알려진 어미/조사로 끝나는지 확인."""
    for ending in _KO_ALL_ENDINGS:
        if word.endswith(ending):
            return True
    return False


def _split_to_fit(text: str, max_chars: int) -> list[str]:
    """최적 분할점을 스코어링하여 max_chars 이내로 분할.

    스코어: (양쪽_모두_적합, 어미_있음, 밸런스, 오른쪽_길이)
    - 양쪽 모두 max_chars 이하인 분할 우선
    - 어미/조사가 있는 자연 경계 우선
    - 밸런스 높을수록 좋음
    - 동점 시 오른쪽이 긴 쪽 선호 (짧은 꼬리 방지)
    """
    if len(text) <= max_chars:
        return [text]
    words = text.split()
    if len(words) <= 1:
        return [text]

    candidates = []
    for i in range(len(words) - 1):
        left = " ".join(words[: i + 1])
        right = " ".join(words[i + 1 :])
        if len(left) > max_chars:
            continue  # 왼쪽이 초과하면 건너뜀

        both_fit = len(right) <= max_chars
        has_ending = _has_known_ending(words[i])
        balance = min(len(left), len(right))
        score = (both_fit, has_ending, balance, len(right))
        candidates.append((score, left, right))

    if not candidates:
        return [text]

    candidates.sort(key=lambda x: x[0], reverse=True)
    _, left, right = candidates[0]

    if len(right) <= max_chars:
        return [left, right]
    return [left] + _split_to_fit(right, max_chars)



def _concat_wav_with_silence(
    wav_paths: list[str], silence_sec: float, output_path: str,
) -> tuple[float, list[tuple[float, float]]]:
    """WAV 파일들을 무음 간격으로 이어붙여 합성.

    Returns:
        (total_duration, segment_offsets)
        segment_offsets: [(start, end), ...] 각 WAV의 결합 오디오 기준 시작/끝 시점
    """
    all_samples = []
    segment_offsets = []
    sample_rate = n_channels = sample_width = None
    current_offset = 0.0

    for i, path in enumerate(wav_paths):
        with wave.open(path, "r") as wf:
            if sample_rate is None:
                sample_rate = wf.getframerate()
                n_channels = wf.getnchannels()
                sample_width = wf.getsampwidth()
            n_frames = wf.getnframes()
            frames = wf.readframes(n_frames)
            seg_duration = n_frames / wf.getframerate()

        all_samples.append(np.frombuffer(frames, dtype=np.int16))
        segment_offsets.append((current_offset, current_offset + seg_duration))
        current_offset += seg_duration

        if i < len(wav_paths) - 1:
            n_silence = int(silence_sec * sample_rate * n_channels)
            all_samples.append(np.zeros(n_silence, dtype=np.int16))
            current_offset += silence_sec

    combined = np.concatenate(all_samples)
    with wave.open(output_path, "w") as wf:
        wf.setnchannels(n_channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(combined.tobytes())

    total_duration = len(combined) / (sample_rate * n_channels)
    return total_duration, segment_offsets





def _normalize_for_match(text: str) -> str:
    """Whisper 매칭용 텍스트 정규화 — 숫자/특수문자/공백 제거."""
    t = text.lower()
    t = t.replace("kcal", "킬로칼로리").replace("%", "퍼센트")
    t = re.sub(r"[^가-힣a-z]", "", t)
    return t


def _align_phrases_to_whisper(
    phrases: list[str],
    whisper_words: list[dict],
    range_start: float,
    range_end: float,
) -> list[tuple[float, float]]:
    """구절을 Whisper 워드 타임스탬프에 직접 정렬 — 1단계 전역 매칭.

    이전 방식(문장 그룹핑 → 구절 정렬 2단계)의 누적 오차 문제를 근본 해결.
    문장 단위 그룹핑 없이, 전체 구절 시퀀스를 Whisper 워드 스트림에 직접 매핑.

    1단계: Whisper 문자열 스트림에서 각 구절의 시작점 순차 매칭 (3~5글자 키)
    2단계: 미매칭 구절은 전후 앵커 사이를 글자수 비례 보간
    3단계: 연속 타이밍 (각 구절 end = 다음 구절 start) + 최소 표시시간 보장
    """
    MIN_DISPLAY_SEC = 0.5
    n = len(phrases)
    if n == 0:
        return []

    if not whisper_words:
        return _charlen_distribute(phrases, range_start, range_end)

    # 1단계: Whisper 문자→시간 매핑 구축
    w_entries = []  # (char, time)
    for w in whisper_words:
        norm = _normalize_for_match(w["text"])
        if not norm:
            continue
        w_dur = max(w["end"] - w["start"], 0.001)
        for ci, ch in enumerate(norm):
            t = w["start"] + w_dur * (ci / len(norm))
            w_entries.append((ch, t))

    if not w_entries:
        return _charlen_distribute(phrases, range_start, range_end)

    # 2단계: 구절별 시작 시점 순차 매칭 (3~5글자 키 + 2글자 퍼지 폴백)
    phrase_anchors = []
    search_from = 0

    for phrase in phrases:
        norm_phrase = _normalize_for_match(phrase)
        if not norm_phrase or len(norm_phrase) < 2:
            phrase_anchors.append(None)
            continue

        # 검색 키: 3~5글자 (고유성 확보)
        key_len = min(5, len(norm_phrase))
        search_key = norm_phrase[:key_len]

        found = False
        for si in range(search_from, len(w_entries) - len(search_key) + 1):
            candidate = "".join(e[0] for e in w_entries[si:si + len(search_key)])
            if candidate == search_key:
                phrase_anchors.append(w_entries[si][1])
                search_from = si + 1
                found = True
                break

        # 퍼지 폴백: 2글자 프리픽스
        if not found and len(norm_phrase) >= 2:
            short_key = norm_phrase[:2]
            for si in range(search_from, len(w_entries) - 1):
                candidate = w_entries[si][0] + w_entries[si + 1][0]
                if candidate == short_key:
                    phrase_anchors.append(w_entries[si][1])
                    search_from = si + 1
                    found = True
                    break

        if not found:
            phrase_anchors.append(None)

    # 매칭 통계
    matched = sum(1 for a in phrase_anchors if a is not None)
    print(f"      구절 정렬: {matched}/{n} 직접 매칭, {n - matched} 보간")

    # 3단계: 미매칭 구절을 전후 앵커 사이에서 글자수 비례 보간
    timings = list(phrase_anchors)

    i = 0
    while i < n:
        if timings[i] is not None:
            i += 1
            continue
        group_start = i
        while i < n and timings[i] is None:
            i += 1
        group_end = i  # exclusive

        anchor_s = timings[group_start - 1] if group_start > 0 else range_start
        anchor_e = timings[group_end] if group_end < n else range_end

        group_chars = [max(len(_normalize_for_match(phrases[gi])), 1)
                       for gi in range(group_start, group_end)]
        total_c = sum(group_chars) or 1
        t = anchor_s
        span = anchor_e - anchor_s
        for gi, chars in enumerate(group_chars):
            timings[group_start + gi] = t
            t += span * (chars / total_c)

    # 4단계: start times → 연속 (start, end) 구간
    # 각 구절의 end = 다음 구절의 start (갭 제로)
    result = []
    for pi in range(n):
        p_start = timings[pi]
        p_end = timings[pi + 1] if pi < n - 1 else range_end
        result.append((max(p_start, range_start), min(p_end, range_end)))

    # 첫 구절은 0부터, 마지막 구절은 끝까지 (빈틈 없는 커버리지)
    if result:
        result[0] = (range_start, result[0][1])
        result[-1] = (result[-1][0], range_end)

    # 5단계: 최소 표시 시간 보장 (인접에서 재분배)
    for _pass in range(3):
        adjusted = False
        for pi in range(n):
            s, e = result[pi]
            dur = e - s
            if dur >= MIN_DISPLAY_SEC:
                continue
            need = MIN_DISPLAY_SEC - dur
            if pi < n - 1:
                ns, ne = result[pi + 1]
                borrow = min(need, max(ne - ns - MIN_DISPLAY_SEC, 0))
                if borrow > 0:
                    result[pi] = (s, e + borrow)
                    result[pi + 1] = (ns + borrow, ne)
                    need -= borrow
                    adjusted = True
            if need > 0.01 and pi > 0:
                ps, pe = result[pi - 1]
                borrow = min(need, max(pe - ps - MIN_DISPLAY_SEC, 0))
                if borrow > 0:
                    result[pi - 1] = (ps, pe - borrow)
                    result[pi] = (result[pi][0] - borrow, result[pi][1])
                    adjusted = True
        if not adjusted:
            break

    return result


def _charlen_distribute(
    phrases: list[str],
    start: float,
    end: float,
) -> list[tuple[float, float]]:
    """글자수 비례 구절 타이밍 분배 (fallback)."""
    dur = max(end - start, 0.1)
    p_chars = [len(p) for p in phrases]
    tc = sum(p_chars) or 1
    timings = []
    pt = start
    for chars in p_chars:
        pd = dur * (chars / tc)
        timings.append((pt, min(pt + pd, end)))
        pt += pd
    return timings


def _master_audio(input_path: str, output_path: str) -> str:
    """오디오 마스터링 체인 (ffmpeg).

    TTS 원본 → 유튜버 마이크 느낌의 따뜻한 보이스로 후처리.
    체인:
      1. 하이패스 80Hz (저주파 럼블 제거)
      2. EQ: 250Hz +2dB (따뜻함), 3kHz +1.5dB (명료도), 8kHz -1dB (치찰음 억제)
      3. 컴프레서 (볼륨 균일화, 자연스러운 다이나믹)
      4. 미세 리버브 (작은 방 느낌, 완전 무향실 느낌 제거)
      5. 라우드니스 노멀라이즈 (EBU R128, -16 LUFS — YouTube 최적)
    """
    # 단일 필터 체인 (콤마 연결)
    filter_chain = (
        "[0:a]"
        "highpass=f=80,"                                           # 1. 하이패스 80Hz
        "equalizer=f=250:t=q:w=1.5:g=2,"                          # 2a. 250Hz +2dB 따뜻함
        "equalizer=f=3000:t=q:w=2.0:g=1.5,"                       # 2b. 3kHz +1.5dB 존재감
        "equalizer=f=8000:t=q:w=1.5:g=-1,"                        # 2c. 8kHz -1dB 치찰음 완화
        "acompressor=threshold=-20dB:ratio=3:attack=10:release=100:makeup=2dB,"  # 3. 컴프레서
        "aecho=0.8:0.7:15|25:0.08|0.05,"                           # 4. 미세 리버브
        "loudnorm=I=-16:TP=-1.5:LRA=11"                           # 5. 라우드니스 -16 LUFS
        "[out]"
    )

    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-filter_complex", filter_chain,
        "-map", "[out]",
        "-ar", "24000",  # TTS 원본 샘플레이트 유지
        "-acodec", "pcm_s16le",
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"      [마스터링 경고] ffmpeg 오류, 원본 사용: {result.stderr[:200]}")
        import shutil
        shutil.copy2(input_path, output_path)
    return output_path



_whisper_model = None  # Whisper 싱글톤 캐시


def get_word_timestamps(audio_path: str) -> dict | None:
    """Whisper로 워드 레벨 + 세그먼트 레벨 타임스탬프 추출.
    반환: {"words": [...], "segments": [...]} 또는 None
    """
    global _whisper_model
    try:
        ssl._create_default_https_context = ssl._create_unverified_context
        import whisper
        if _whisper_model is None:
            _whisper_model = whisper.load_model("tiny")
        result = _whisper_model.transcribe(audio_path, word_timestamps=True, language="ko")
        words = []
        for seg in result.get("segments", []):
            for w in seg.get("words", []):
                words.append({
                    "text": w["word"].strip(),
                    "start": w["start"],
                    "end": w["end"],
                })
        if not words:
            return None
        segments = [
            {"text": s["text"].strip(), "start": s["start"], "end": s["end"]}
            for s in result.get("segments", [])
        ]
        return {"words": words, "segments": segments}
    except Exception as e:
        print(f"      [Whisper] 실패: {e}")
        return None


def _trim_wav_at_time(wav_path: str, end_sec: float):
    """WAV 파일을 지정 시간에서 자른다."""
    with wave.open(wav_path, "rb") as wf:
        sr = wf.getframerate()
        n_ch = wf.getnchannels()
        sw = wf.getsampwidth()
        raw = wf.readframes(wf.getnframes())
    data = np.frombuffer(raw, dtype=np.int16)
    keep = min(int(sr * end_sec), len(data))
    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(n_ch)
        wf.setsampwidth(sw)
        wf.setframerate(sr)
        wf.writeframes(data[:keep].tobytes())


def _detect_hallucination(original_text: str, whisper_words: list, wav_duration: float = 0.0) -> float | None:
    """TTS hallucination 감지 — 스크립트에 없는 소리를 생성한 경우 트림 시점 반환.

    두 가지 기준 중 하나라도 해당하면 hallucination:
      1) 글자수 비율: Whisper 전사 글자수 > 원본 * 1.15
      2) 시간 비율: 실제 오디오 길이 > 예상 길이 * 1.5 (한국어 ~3.5자/초)

    Returns:
        트림 시점(초) 또는 None (hallucination 없음)
    """
    if not whisper_words:
        return None

    strip_re = re.compile(r'[,.\s!?…·\-"\'()（）「」]')
    orig_clean = strip_re.sub("", original_text)

    if len(orig_clean) == 0:
        return None

    # 기준 1: 글자수 비율 (Whisper 전사 vs 원본)
    whisper_text = "".join(w["text"] for w in whisper_words)
    whisper_clean = strip_re.sub("", whisper_text)
    char_ratio = len(whisper_clean) / len(orig_clean)
    char_triggered = char_ratio > 1.15

    # 기준 2: 시간 비율 (실제 길이 vs 예상 길이)
    expected_dur = len(orig_clean) / 3.5 + 0.5  # 한국어 ~3.5자/초 + 여백
    dur_triggered = wav_duration > 0 and wav_duration > expected_dur * 1.5

    if not char_triggered and not dur_triggered:
        return None  # 정상 범위

    trigger = []
    if char_triggered:
        trigger.append(f"글자수 {char_ratio:.2f}x")
    if dur_triggered:
        trigger.append(f"시간 {wav_duration:.1f}s>예상{expected_dur:.1f}s")
    print(f"      ⚠ hallucination 감지: {', '.join(trigger)}")

    # 원본 텍스트에 해당하는 Whisper 워드 끝점 찾기
    matched_chars = 0
    target = len(orig_clean)
    trim_time = whisper_words[-1]["end"]

    for w in whisper_words:
        w_clean = strip_re.sub("", w["text"])
        matched_chars += len(w_clean)
        if matched_chars >= target * 0.85:
            trim_time = w["end"]
            break

    return trim_time


def _trim_wav_silence(wav_path: str, tail_threshold: float = 0.015, tail_pad_ms: int = 200):
    """WAV 파일의 후행 무음을 트리밍 (TTS가 생성하는 불필요한 꼬리 무음 제거).

    Args:
        tail_threshold: 무음 판정 진폭 임계값 (0~1, 16-bit 정규화)
        tail_pad_ms: 마지막 소리 이후 남길 여백 (ms)
    """
    with wave.open(wav_path, "rb") as wf:
        sr = wf.getframerate()
        n_ch = wf.getnchannels()
        sw = wf.getsampwidth()
        raw = wf.readframes(wf.getnframes())

    data = np.frombuffer(raw, dtype=np.int16)
    if len(data) == 0:
        return

    amplitude = np.abs(data).astype(np.float32) / 32768.0

    # 50ms 윈도우 롤링 평균으로 스무딩
    win = max(int(sr * 0.05), 1)
    if len(amplitude) > win:
        kernel = np.ones(win, dtype=np.float32) / win
        smooth = np.convolve(amplitude, kernel, mode="same")
    else:
        smooth = amplitude

    above = np.where(smooth > tail_threshold)[0]
    if len(above) == 0:
        return

    last_sound = above[-1]
    pad_frames = int(sr * tail_pad_ms / 1000)
    keep = min(last_sound + pad_frames, len(data))

    trimmed_ms = (len(data) - keep) / sr * 1000
    if trimmed_ms < 100:
        return  # 100ms 미만이면 트리밍 불필요

    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(n_ch)
        wf.setsampwidth(sw)
        wf.setframerate(sr)
        wf.writeframes(data[:keep].tobytes())


# CTA(구독 유도) 텍스트 패턴 — 자동 필터링 대상
_CTA_PATTERNS = [
    r"구독\s*(눌러|부탁|해줘|해주세요|하고)",
    r"좋아요\s*(눌러|부탁|와\s*구독|구독)",
    r"알림\s*(설정|까지|눌러)",
    r"구독\s*눌러[.!?]*$",
    r"^구독[.!?\s]*$",
]
_CTA_RE = re.compile("|".join(_CTA_PATTERNS))


def _filter_cta_scenes(scenes: list[dict]) -> list[dict]:
    """마지막 씬이 CTA(구독 유도) 전용이면 제거. 혼합이면 CTA 부분만 제거."""
    if not scenes:
        return scenes

    filtered = list(scenes)
    last = filtered[-1]
    text = last.get("text", "")

    # 마침표/문장 단위로 분리
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
    kept = [s for s in sentences if not _CTA_RE.search(s)]

    if not kept:
        # 마지막 씬 전체가 CTA → 제거
        filtered.pop()
        print(f"    [CTA 필터] 마지막 씬 제거: \"{text[:40]}\"")
    elif len(kept) < len(sentences):
        # CTA 부분만 제거
        filtered[-1] = {**last, "text": " ".join(kept)}
        removed = [s for s in sentences if _CTA_RE.search(s)]
        print(f"    [CTA 필터] CTA 문구 제거: {removed}")

    return filtered


def _generate_per_scene_audio(
    scenes: list[dict],
    engine,
    language: str,
    scene_images: list[str] | None,
    display_text: str | None,
    ts: str,
) -> tuple[list[SceneAudioSegment], str, float]:
    """씬별 TTS → 씬별 Whisper → concat → SceneAudioSegment 리스트.

    핵심: 각 씬에 대해 독립적으로 TTS + Whisper를 수행하고,
    WAV를 INTER_SCENE_SILENCE 간격으로 이어붙여 정확한 타이밍을 산출.

    Args:
        scenes: 스크립트 scenes 배열
        engine: Qwen3TTSEngine 인스턴스
        language: 언어 코드
        scene_images: 씬 이미지 경로 리스트
        display_text: 자막용 display_text (full_text 대체)
        ts: 타임스탬프 문자열 (파일명용)

    Returns:
        (segments, combined_audio_path, total_duration)
    """
    # CTA(구독 유도) 필터링
    scenes = _filter_cta_scenes(scenes)

    # 씬별 TTS 생성 + Whisper 분석
    # 음색 일관성: 모델 캐싱 + 고정 시드 + 낮은 temperature (엔진 내부)
    scene_wavs = []
    scene_whisper_data = []

    for i, scene in enumerate(scenes):
        scene_text = scene.get("text", "")
        if not scene_text:
            continue

        tts_text = preprocess_korean_for_tts(scene_text) if language == "ko" else scene_text
        wav_path = str(TEMP_DIR / f"scene_{ts}_{i:02d}.wav")

        print(f"    씬 {i+1}/{len(scenes)}: TTS 생성 중...")
        tts_result = engine.generate(tts_text, wav_path)

        # 후행 무음 트리밍 (TTS가 생성하는 불필요한 꼬리 무음 제거)
        orig_dur = tts_result["duration"]
        _trim_wav_silence(wav_path)
        trimmed_dur = _get_duration(wav_path)
        scene_dur = trimmed_dur

        # 씬별 Whisper 분석 (짧은 오디오 → 높은 정확도)
        whisper_data = get_word_timestamps(wav_path)
        words = whisper_data["words"] if whisper_data else []

        # TTS hallucination 감지 — 스크립트에 없는 소리를 생성한 경우 자동 트림
        hall_trim = _detect_hallucination(scene_text, words, wav_duration=scene_dur)
        hall_info = ""
        if hall_trim is not None:
            pre_dur = scene_dur
            _trim_wav_at_time(wav_path, hall_trim + 0.3)  # +300ms 여백
            scene_dur = _get_duration(wav_path)
            # Whisper 재분석
            whisper_data = get_word_timestamps(wav_path)
            words = whisper_data["words"] if whisper_data else []
            hall_info = f" [hallucination 제거: -{pre_dur - scene_dur:.1f}s]"

        trim_info = f" (trimmed {orig_dur - scene_dur:.1f}s)" if orig_dur - scene_dur > 0.1 else ""
        print(f"      → {scene_dur:.1f}s{trim_info}{hall_info}, Whisper {len(words)}개 워드")

        scene_wavs.append(wav_path)
        scene_whisper_data.append(words)

    if not scene_wavs:
        return [], "", 0.0

    # WAV concat (INTER_SCENE_SILENCE 간격)
    combined_path = str(TEMP_DIR / f"combined_{ts}.wav")
    total_duration, segment_offsets = _concat_wav_with_silence(
        scene_wavs, INTER_SCENE_SILENCE, combined_path,
    )

    print(f"    결합 오디오: {total_duration:.1f}s ({len(scene_wavs)}개 씬, "
          f"무음 {INTER_SCENE_SILENCE}s × {len(scene_wavs)-1})")

    # SceneAudioSegment 조립
    segments = []
    scene_idx = 0
    for i, scene in enumerate(scenes):
        scene_text = scene.get("text", "")
        if not scene_text:
            continue

        audio_start, audio_end = segment_offsets[scene_idx]
        local_words = scene_whisper_data[scene_idx]

        # 로컬 Whisper 워드 → 글로벌 오프셋 시프트
        global_words = [
            {"text": w["text"], "start": w["start"] + audio_start, "end": w["end"] + audio_start}
            for w in local_words
        ]

        # 자막 구절 분할
        if language == "ko":
            phrases = split_korean_phrases(scene_text, max_chars=16)
        else:
            phrases = split_into_chunks(scene_text, max_chars=16)

        # 구절을 씬 내 Whisper에 정렬
        phrase_timings = _align_phrases_to_whisper(
            phrases, global_words, audio_start, audio_end,
        )

        # 이미지 경로 매핑
        img_path = ""
        if scene_images and scene_idx < len(scene_images):
            img_path = scene_images[scene_idx]

        seg = SceneAudioSegment(
            scene_id=scene.get("id", i + 1),
            scene_text=scene_text,
            audio_start=audio_start,
            audio_end=audio_end,
            wav_path=scene_wavs[scene_idx],
            whisper_words=global_words,
            phrases=phrases,
            phrase_timings=phrase_timings,
            image_path=img_path,
        )
        segments.append(seg)
        scene_idx += 1

    # 씬별 타이밍 요약
    print(f"    Per-Scene 타이밍:")
    for seg in segments:
        n_words = len(seg.whisper_words)
        n_phrases = len(seg.phrases)
        text_preview = seg.scene_text[:30]
        print(f"      씬 {seg.scene_id}: {seg.audio_start:.2f}~{seg.audio_end:.2f}s "
              f"({seg.duration:.1f}s) W:{n_words} P:{n_phrases} | {text_preview}")

    return segments, combined_path, total_duration


def _generate_single_tts_audio(
    scenes: list[dict],
    engine,
    language: str,
    scene_images: list[str] | None,
    display_text: str | None,
    ts: str,
) -> tuple[list[SceneAudioSegment], str, float]:
    """단일 TTS로 전체 텍스트 생성 → Whisper → 씬별 경계 추출.

    음색 100% 일관성 보장: 전체 텍스트를 한 번에 생성하므로
    씬 간 목소리 변동이 원천적으로 불가능.

    씬 경계: Whisper 워드의 누적 문자 위치를 씬 텍스트 문자 범위에 매핑.

    Returns:
        (segments, combined_audio_path, total_duration)
    """
    # CTA 필터링
    scenes = _filter_cta_scenes(scenes)

    # 씬별 텍스트 전처리 + 원본 보존
    scene_texts_raw = [s.get("text", "") for s in scenes if s.get("text")]
    scene_texts_tts = []
    for text in scene_texts_raw:
        tts_text = preprocess_korean_for_tts(text) if language == "ko" else text
        scene_texts_tts.append(tts_text)

    # 전체 텍스트를 줄바꿈으로 연결 — 문장 종결 부호(. ? !) 뒤 자연스러운 호흡 간격 유도
    # 쉼표 연결은 TTS가 이어 읽기 신호로 해석해 마침표 후 쉼이 사라지는 문제 발생
    full_tts_text = "\n".join(scene_texts_tts)

    print(f"    단일 TTS 생성 중... (텍스트 길이: {len(full_tts_text)}자)")

    # 1. 단일 TTS 호출
    wav_path = str(TEMP_DIR / f"single_{ts}.wav")
    tts_result = engine.generate(full_tts_text, wav_path)
    orig_dur = tts_result["duration"]

    # 후행 무음 트리밍
    _trim_wav_silence(wav_path)
    total_dur = _get_duration(wav_path)
    trim_info = f" (trimmed {orig_dur - total_dur:.1f}s)" if orig_dur - total_dur > 0.1 else ""
    print(f"      → {total_dur:.1f}s{trim_info}")

    # 2. Whisper 분석 (전체)
    whisper_data = get_word_timestamps(wav_path)
    all_words = whisper_data["words"] if whisper_data else []
    print(f"      Whisper: {len(all_words)}개 워드")

    if not all_words:
        return [], "", 0.0

    # 3. Whisper hallucination 감지 (전체)
    full_text_for_check = "".join(scene_texts_raw)
    hall_trim = _detect_hallucination(full_text_for_check, all_words, wav_duration=total_dur)
    if hall_trim is not None:
        pre_dur = total_dur
        _trim_wav_at_time(wav_path, hall_trim + 0.3)
        total_dur = _get_duration(wav_path)
        whisper_data = get_word_timestamps(wav_path)
        all_words = whisper_data["words"] if whisper_data else []
        print(f"      ⚠ hallucination 제거: {pre_dur:.1f}→{total_dur:.1f}s")

    # 4. 누적 문자 매핑 — Whisper 워드를 씬별로 배분
    strip_re = re.compile(r'[,.\s!?…·\-"\'()（）「」~]')

    # 4a. 씬별 문자 경계 (원본 텍스트 기준)
    scene_char_ranges = []
    cumul = 0
    for text in scene_texts_raw:
        clean = strip_re.sub("", text)
        scene_char_ranges.append((cumul, cumul + len(clean)))
        cumul += len(clean)

    # 4b. Whisper 워드별 누적 문자 위치
    word_infos = []
    word_cumul = 0
    for w in all_words:
        clean = strip_re.sub("", w["text"])
        word_infos.append({
            "char_start": word_cumul,
            "char_end": word_cumul + len(clean),
            "start": w["start"],
            "end": w["end"],
            "text": w["text"],
        })
        word_cumul += len(clean)

    # 4c. 하이브리드 경계 탐지: 문자 비율 기대값 + Whisper 워드 gap
    #     1) 씬별 문자 비율로 예상 경계 시점 계산
    #     2) 각 예상 시점 ±2초 범위에서 가장 큰 워드 간 gap 선택
    #     3) 선택된 gap 위치에서 씬 분할

    total_chars_all = sum(ce - cs for cs, ce in scene_char_ranges)
    n_scenes = len(scene_char_ranges)

    # 예상 경계 시점 (N-1개)
    expected_boundaries = []
    cumul_chars = 0
    for s_idx in range(n_scenes - 1):
        cs, ce = scene_char_ranges[s_idx]
        cumul_chars += (ce - cs)
        expected_time = (cumul_chars / total_chars_all) * total_dur
        expected_boundaries.append(expected_time)

    # 워드 간 gap 계산
    word_gaps = []  # (word_idx_after_gap, gap_midpoint, gap_size)
    for k in range(1, len(word_infos)):
        gap = word_infos[k]["start"] - word_infos[k - 1]["end"]
        mid = (word_infos[k - 1]["end"] + word_infos[k]["start"]) / 2
        word_gaps.append((k, mid, gap))

    # 각 예상 경계에 대해 ±2초 범위에서 최적 gap 선택
    SEARCH_WINDOW = 2.0
    split_indices = []
    used_indices = set()

    for exp_t in expected_boundaries:
        best_idx = None
        best_score = -float("inf")
        for k, mid, gap in word_gaps:
            if k in used_indices:
                continue
            dist = abs(mid - exp_t)
            if dist > SEARCH_WINDOW:
                continue
            # 점수: gap 크기 보너스 - 거리 페널티
            score = gap * 5.0 - dist
            if score > best_score:
                best_score = score
                best_idx = k

        if best_idx is not None:
            split_indices.append(best_idx)
            used_indices.add(best_idx)
        else:
            # Fallback: 기대 시점에 가장 가까운 워드 경계
            closest = min(range(1, len(word_infos)),
                         key=lambda k: abs(word_infos[k]["start"] - exp_t))
            split_indices.append(closest)

    split_indices.sort()

    # 분할 인덱스 → 씬별 워드 그룹
    scene_word_groups = []
    prev = 0
    for si in split_indices:
        scene_word_groups.append(list(range(prev, si)))
        prev = si
    scene_word_groups.append(list(range(prev, len(word_infos))))

    # SceneAudioSegment 조립
    segments = []
    scene_idx = 0
    for i, scene in enumerate(scenes):
        scene_text = scene.get("text", "")
        if not scene_text:
            continue

        matched_words = [word_infos[wi] for wi in scene_word_groups[scene_idx]]

        if matched_words:
            audio_start = matched_words[0]["start"]
            audio_end = matched_words[-1]["end"]
        else:
            # Fallback: 균등 분할
            dur_per = total_dur / len(scene_texts_raw)
            audio_start = scene_idx * dur_per
            audio_end = (scene_idx + 1) * dur_per

        # Whisper 워드를 표준 형식으로 변환
        scene_words = [
            {"text": wi["text"], "start": wi["start"], "end": wi["end"]}
            for wi in matched_words
        ]

        # 자막 구절 분할
        if language == "ko":
            phrases = split_korean_phrases(scene_text, max_chars=16)
        else:
            phrases = split_into_chunks(scene_text, max_chars=16)

        # 구절 → Whisper 정렬
        phrase_timings = _align_phrases_to_whisper(
            phrases, scene_words, audio_start, audio_end,
        )

        # 이미지 경로
        img_path = ""
        if scene_images and scene_idx < len(scene_images):
            img_path = scene_images[scene_idx]

        seg = SceneAudioSegment(
            scene_id=scene.get("id", i + 1),
            scene_text=scene_text,
            audio_start=audio_start,
            audio_end=audio_end,
            wav_path=wav_path,
            whisper_words=scene_words,
            phrases=phrases,
            phrase_timings=phrase_timings,
            image_path=img_path,
        )
        segments.append(seg)
        scene_idx += 1

    # 타이밍 요약
    print(f"    Single-TTS 타이밍:")
    for seg in segments:
        n_words = len(seg.whisper_words)
        n_phrases = len(seg.phrases)
        text_preview = seg.scene_text[:30]
        print(f"      씬 {seg.scene_id}: {seg.audio_start:.2f}~{seg.audio_end:.2f}s "
              f"({seg.duration:.1f}s) W:{n_words} P:{n_phrases} | {text_preview}")

    return segments, wav_path, total_dur


def align_display_to_whisper(
    display_text: str,
    whisper_words: list[dict],
    max_chars: int = 16,
) -> list[tuple[str, float, float]]:
    """display_text 단어를 Whisper 타임스탬프에 매핑 → 자막 청크 생성"""
    display_words = display_text.split()
    n_disp = len(display_words)
    n_whis = len(whisper_words)
    if n_disp == 0 or n_whis == 0:
        return []

    # display 단어 → Whisper 단어 비례 매핑 (인덱스)
    def whisper_idx(disp_idx):
        return min(int(disp_idx * n_whis / n_disp), n_whis - 1)

    # 단어를 청크로 묶기
    chunks = []
    current_words = []
    current_text = ""
    chunk_start_didx = 0

    for i, word in enumerate(display_words):
        if current_text and len(current_text + " " + word) > max_chars:
            # 현재 청크 완료
            w_start = whisper_words[whisper_idx(chunk_start_didx)]["start"]
            w_end = whisper_words[whisper_idx(i - 1)]["end"]
            chunks.append((current_text.strip(), w_start, w_end))
            current_text = word
            chunk_start_didx = i
        else:
            current_text = (current_text + " " + word).strip() if current_text else word

    # 마지막 청크
    if current_text.strip():
        w_start = whisper_words[whisper_idx(chunk_start_didx)]["start"]
        w_end = whisper_words[-1]["end"]
        chunks.append((current_text.strip(), w_start, w_end))

    return chunks



def create_subtitle_image(
    text: str,
    canvas_width: int = 1080,
    font_size: int = 52,
    language: str = "en",
) -> np.ndarray:
    """자막 텍스트 → RGBA 이미지 (딤드 배경 + Bold 폰트 + 오버플로 방지)"""
    padding_x, padding_y = 36, 16
    margin = 40  # 좌우 안전 마진
    max_text_w = canvas_width - margin * 2 - padding_x * 2

    font = get_font(language, font_size)

    # 측정용 임시 캔버스
    tmp = Image.new("RGBA", (1, 1))
    td = ImageDraw.Draw(tmp)

    # 줄바꿈 처리 (오버플로 방지)
    display_text = text
    bbox = td.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]

    if text_w > max_text_w:
        mid = len(text) // 2
        best = -1
        for i in range(mid, min(mid + 8, len(text))):
            if text[i] == " ":
                best = i
                break
        if best == -1:
            for i in range(mid - 1, max(mid - 8, 0), -1):
                if text[i] == " ":
                    best = i
                    break
        if best > 0:
            display_text = text[:best].strip() + "\n" + text[best + 1:].strip()

    # 최종 크기 측정
    bbox = td.textbbox((0, 0), display_text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    # 폰트 축소 (여전히 오버플로 시)
    while text_w > max_text_w and font_size > 30:
        font_size -= 4
        font = get_font(language, font_size)
        bbox = td.textbbox((0, 0), display_text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]

    # 이미지 크기 결정
    img_h = text_h + padding_y * 2 + 16
    img_h = max(img_h, 72)
    img = Image.new("RGBA", (canvas_width, img_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 딤드 배경 (반투명 검정 라운드 사각형)
    bg_w = min(text_w + padding_x * 2, canvas_width - margin * 2)
    bg_h = text_h + padding_y * 2
    bg_x = (canvas_width - bg_w) // 2
    bg_y = (img_h - bg_h) // 2
    draw.rounded_rectangle(
        [bg_x, bg_y, bg_x + bg_w, bg_y + bg_h],
        radius=14,
        fill=(0, 0, 0, 170),
    )

    # 텍스트 위치 (중앙)
    x = (canvas_width - text_w) // 2
    y = (img_h - text_h) // 2

    # 얇은 외곽선
    for dx in range(-2, 3):
        for dy in range(-2, 3):
            if dx != 0 or dy != 0:
                draw.text((x + dx, y + dy), display_text, font=font, fill=(0, 0, 0, 180))

    # 메인 텍스트 (흰색)
    draw.text((x, y), display_text, font=font, fill=(255, 255, 255, 255))

    return np.array(img)


def _resize_image_for_shorts(image_path: str, target_size=(1080, 1920)) -> np.ndarray:
    """씬 이미지를 1080x1920에 맞게 리사이즈 (중앙 크롭 + 리사이즈)"""
    img = Image.open(image_path).convert("RGB")
    tw, th = target_size
    target_ratio = tw / th  # 0.5625

    iw, ih = img.size
    img_ratio = iw / ih

    if img_ratio > target_ratio:
        # 이미지가 더 넓음 → 높이 맞추고 좌우 크롭
        new_h = ih
        new_w = int(ih * target_ratio)
        left = (iw - new_w) // 2
        img = img.crop((left, 0, left + new_w, new_h))
    else:
        # 이미지가 더 좁음 → 너비 맞추고 상하 크롭
        new_w = iw
        new_h = int(iw / target_ratio)
        top = (ih - new_h) // 2
        img = img.crop((0, top, new_w, top + new_h))

    img = img.resize(target_size, Image.LANCZOS)
    return np.array(img)


# ── DepthFlow 2.5D 패럴랙스 ──────────────────────────────────────

# DepthFlow 애니메이션 프리셋 (씬별 다른 움직임)
DEPTHFLOW_PRESETS = [
    {"name": "orbital",    "intensity": 0.5},   # 궤도 회전 (hook 기본)
    {"name": "horizontal", "intensity": 0.4},   # 좌우 패닝
    {"name": "circle",     "intensity": 0.4},   # 원형 경로
    {"name": "vertical",   "intensity": 0.3},   # 상하 패닝
    {"name": "dolly",      "intensity": 0.3},   # 돌리 줌
    {"name": "zoom",       "intensity": 0.2},   # 줌 인/아웃
]

# 씬 전환 효과 설정
TRANSITION_DURATION = 0.4  # 전환 효과 지속시간 (초)

# 맥락 기반 전환 효과 키워드 매핑
_TRANSITION_KEYWORDS = {
    "zoom_in": ["갑자기", "폭발", "충격", "순간", "발견", "깨닫", "놀라", "점프", "뛰어"],
    "push_left": ["시작", "변화", "전환", "바뀌", "달라", "새로"],
    "push_up": ["높이", "올라", "상승", "건물", "하늘", "위로", "성장", "증가"],
    "push_down": ["떨어", "추락", "감소", "줄어", "내려", "가라앉", "무너"],
}


def _choose_transition(scene_text: str, prev_text: str) -> str:
    """씬 텍스트 맥락에 따라 전환 효과 선택.

    기본: crossfade (페이드 인/아웃)
    맥락 매칭 시: zoom_in, push_left, push_up, push_down
    """
    combined = scene_text + " " + prev_text
    for effect, keywords in _TRANSITION_KEYWORDS.items():
        for kw in keywords:
            if kw in combined:
                return effect
    return "crossfade"


def _assign_depthflow_presets(n_scenes: int) -> list[dict]:
    """씬 개수에 맞게 DepthFlow 프리셋 할당.

    규칙:
    - 첫 씬 (hook): orbital (시선 집중)
    - 중간 씬: 순환 (horizontal → circle → vertical → dolly → ...)
    - 마지막 씬 (cta): zoom (행동 유도 집중)
    """
    if n_scenes == 0:
        return []
    if n_scenes == 1:
        return [DEPTHFLOW_PRESETS[0]]

    body_cycle = DEPTHFLOW_PRESETS[1:5]  # horizontal, circle, vertical, dolly
    presets = [DEPTHFLOW_PRESETS[0]]  # 첫 씬: orbital

    for i in range(1, n_scenes - 1):
        presets.append(body_cycle[(i - 1) % len(body_cycle)])

    presets.append(DEPTHFLOW_PRESETS[5])  # 마지막: zoom
    return presets


def _render_depthflow_clips(
    scene_images: list[str],
    scene_durations: list[float],
    target_size: tuple = (1080, 1920),
    depthflow_override: dict = None,
) -> list[str]:
    """DepthFlow로 씬 이미지를 2.5D 패럴랙스 비디오로 렌더링.

    Args:
        depthflow_override: 무드별 프리셋 오버라이드 (예: {"name": "orbital", "intensity": 0.3})
                           None이면 기존 자동 할당 사용.

    Returns: 렌더링된 임시 MP4 파일 경로 리스트
    """
    import tempfile

    os.environ["BROKEN_TORCH"] = "0"
    from depthflow.scene import DepthScene

    tw, th = target_size
    if depthflow_override:
        # 무드 오버라이드: 전체 씬에 동일 프리셋 적용
        presets = [depthflow_override] * len(scene_images)
    else:
        presets = _assign_depthflow_presets(len(scene_images))
    rendered_paths = []

    # DepthScene 인스턴스 재사용 (OpenGL 컨텍스트 + 모델 1회 로드)
    scene = DepthScene(backend="headless")
    scene.ffmpeg.h264(preset="veryfast")

    for idx, (img_path, duration) in enumerate(zip(scene_images, scene_durations)):
        preset = presets[idx] if idx < len(presets) else DEPTHFLOW_PRESETS[0]

        # 이미지를 정확히 9:16으로 리사이즈 후 temp 저장
        img = Image.open(img_path).convert("RGB")
        iw, ih = img.size
        target_ratio = tw / th

        img_ratio = iw / ih
        if img_ratio > target_ratio:
            new_w = int(ih * target_ratio)
            left = (iw - new_w) // 2
            img = img.crop((left, 0, left + new_w, ih))
        else:
            new_h = int(iw / target_ratio)
            top = (ih - new_h) // 2
            img = img.crop((0, top, iw, top + new_h))

        img = img.resize((tw, th), Image.LANCZOS)

        temp_img = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        temp_img_path = temp_img.name
        temp_img.close()  # PIL이 올바르게 쓸 수 있도록 먼저 닫기
        img.save(temp_img_path)

        # DepthFlow 렌더링
        temp_out = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        temp_out_path = temp_out.name
        temp_out.close()
        try:
            scene.input(image=temp_img_path)
            scene.config.animation.clear()

            # 프리셋 적용
            getattr(scene, preset["name"])(intensity=preset["intensity"])

            scene.main(output=temp_out_path, fps=30, time=duration, width=tw, height=th)
            rendered_paths.append(temp_out_path)
            print(f"        씬 {idx+1}: DepthFlow [{preset['name']}] {duration:.1f}s → OK")
        except Exception as e:
            print(f"        씬 {idx+1}: DepthFlow 실패 ({e}) → 정적 폴백")
            rendered_paths.append(None)
        finally:
            os.unlink(temp_img_path)

    return rendered_paths


def _create_scene_bg_clips_v3(
    segments: list,
    total_duration: float,
    format_config: dict,
    depthflow_override: dict = None,
) -> list:
    """Per-Scene TTS 기반 배경 클립 생성 (v3.0).

    SceneAudioSegment의 정확한 audio_start/end를 사용하여
    이미지 전환과 음성/자막이 완벽하게 싱크.

    CrossFade 중간점 = 오디오 씬 경계 → 시각적 전환이 음성 전환과 동시 발생.
    """
    if not segments:
        return [ColorClip(size=(1080, 1920), color=format_config["bg_color"], duration=total_duration)]

    # 씬별 이미지/구간 수집
    scene_imgs = []
    scene_durations = []
    td = TRANSITION_DURATION
    half_td = td / 2

    for seg in segments:
        # 비주얼 확장: CrossFade 중간점이 오디오 경계에 오도록
        visual_start = seg.audio_start
        visual_end = seg.audio_end
        scene_imgs.append(seg.image_path)
        scene_durations.append(visual_end - visual_start + td)  # CrossFade 여유분

    # 이미지 없는 씬 필터링
    valid_imgs = [p for p in scene_imgs if p and os.path.exists(p)]
    if not valid_imgs:
        return [ColorClip(size=(1080, 1920), color=format_config["bg_color"], duration=total_duration)]

    # DepthFlow 렌더링
    print(f"      DepthFlow 렌더링 시작: {len(segments)}개 씬...")
    depthflow_durations = [seg.audio_end - seg.audio_start + td for seg in segments]
    depthflow_imgs = []
    for seg in segments:
        if seg.image_path and os.path.exists(seg.image_path):
            depthflow_imgs.append(seg.image_path)
        else:
            depthflow_imgs.append(valid_imgs[-1])  # fallback

    try:
        rendered_paths = _render_depthflow_clips(
            depthflow_imgs, depthflow_durations, depthflow_override=depthflow_override,
        )
    except Exception as e:
        print(f"      DepthFlow 실패 ({e}) → 정적 이미지 폴백")
        rendered_paths = [None] * len(segments)

    # 클립 생성
    bg_clips = []
    temp_files = []
    n = len(segments)

    for i, seg in enumerate(segments):
        # 비주얼 타이밍: CrossFade 중간점 = 오디오 경계
        visual_start = seg.audio_start - half_td if i > 0 else 0.0
        visual_end = seg.audio_end + half_td if i < n - 1 else total_duration
        visual_start = max(visual_start, 0.0)
        visual_end = min(visual_end, total_duration)

        video_path = rendered_paths[i] if i < len(rendered_paths) else None
        clip = None

        if video_path and os.path.exists(video_path):
            try:
                clip = VideoFileClip(video_path)
                clip = clip.with_start(visual_start)
                temp_files.append(video_path)
            except Exception as e:
                print(f"        씬 {i+1}: 비디오 로드 실패 ({e})")
                clip = None

        if clip is None:
            img_path = depthflow_imgs[i]
            try:
                img_array = _resize_image_for_shorts(img_path)
                clip = ImageClip(img_array, duration=visual_end - visual_start).with_start(visual_start)
            except Exception:
                clip = ColorClip(size=(1080, 1920), color=format_config["bg_color"])
                clip = clip.with_start(visual_start).with_end(visual_end)

        # 전환 효과
        if i > 0:
            prev_text = segments[i - 1].scene_text
            effect = _choose_transition(seg.scene_text, prev_text)
        else:
            effect = "fade_in"

        effects_list = []
        if i > 0:
            effects_list.append(vfx.CrossFadeIn(td))
        elif i == 0:
            effects_list.append(vfx.CrossFadeIn(td * 0.5))

        if i < n - 1:
            effects_list.append(vfx.CrossFadeOut(td))

        if effects_list:
            clip = clip.with_effects(effects_list)

        bg_clips.append(clip)
        presets = _assign_depthflow_presets(n)
        preset_name = presets[i]["name"] if i < len(presets) else "?"
        print(f"        씬 {i+1}: {visual_start:.2f}~{visual_end:.2f}s "
              f"(audio {seg.audio_start:.2f}~{seg.audio_end:.2f}s) [{preset_name}] 전환={effect}")

    print(f"      씬 {n}개 → 배경 {len(bg_clips)}개 클립 (DepthFlow 2.5D + fade 전환)")

    _create_scene_bg_clips_v3._temp_files = temp_files
    return bg_clips


def _create_scene_bg_clips(
    scene_images: list,
    timings: list,
    total_duration: float,
    format_config: dict,
    fade_duration: float = 0.3,
    depthflow_override: dict = None,
) -> list:
    """레거시: 씬 이미지를 DepthFlow 2.5D 패럴랙스 + 전환 효과로 배경 클립 생성."""

    n_images = len(scene_images)
    n_sentences = len(timings)

    if n_images == 0:
        return [ColorClip(size=(1080, 1920), color=format_config["bg_color"], duration=total_duration)]

    # 씬 구간 계산: 각 문장에 이미지 1:1 매핑
    segments = []
    for i, (sent, start, end) in enumerate(timings):
        img_idx = min(i, n_images - 1)
        segments.append((img_idx, start, end))

    # 마지막 문장 이후 남은 시간
    if timings and timings[-1][2] < total_duration:
        last_idx = min(n_sentences - 1, n_images - 1)
        segments.append((last_idx, timings[-1][2], total_duration))

    # 고유 이미지별 구간 병합 (같은 이미지 연속 시 하나의 클립으로)
    merged = []  # [(img_idx, start, end), ...]
    for img_idx, start, end in segments:
        if merged and merged[-1][0] == img_idx:
            merged[-1] = (img_idx, merged[-1][1], end)
        else:
            merged.append((img_idx, start, end))

    # 마지막 씬을 total_duration까지 연장
    if merged:
        merged[-1] = (merged[-1][0], merged[-1][1], total_duration)

    # DepthFlow 렌더링
    unique_imgs = []
    unique_durations = []
    for img_idx, start, end in merged:
        unique_imgs.append(scene_images[img_idx] if img_idx < n_images else scene_images[-1])
        unique_durations.append(end - start)

    print(f"      DepthFlow 렌더링 시작: {len(unique_imgs)}개 씬...")
    try:
        rendered_paths = _render_depthflow_clips(unique_imgs, unique_durations, depthflow_override=depthflow_override)
    except Exception as e:
        print(f"      DepthFlow 실패 ({e}) → 정적 이미지 폴백")
        rendered_paths = [None] * len(unique_imgs)

    scene_texts = []
    for img_idx, start, end in merged:
        texts_in_range = [t[0] for t in timings if t[1] >= start - 0.5 and t[2] <= end + 0.5]
        scene_texts.append(" ".join(texts_in_range) if texts_in_range else "")

    bg_clips = []
    temp_files = []
    td = TRANSITION_DURATION

    for seg_i, (img_idx, start, end) in enumerate(merged):
        video_path = rendered_paths[seg_i] if seg_i < len(rendered_paths) else None
        clip = None

        if video_path and os.path.exists(video_path):
            try:
                clip = VideoFileClip(video_path)
                clip = clip.with_start(start)
                temp_files.append(video_path)
            except Exception as e:
                print(f"        씬 {seg_i+1}: 비디오 로드 실패 ({e})")
                clip = None

        if clip is None:
            img_path = unique_imgs[seg_i] if seg_i < len(unique_imgs) else unique_imgs[-1]
            try:
                img_array = _resize_image_for_shorts(img_path)
                clip = ImageClip(img_array, duration=end - start).with_start(start)
            except Exception:
                clip = ColorClip(size=(1080, 1920), color=format_config["bg_color"])
                clip = clip.with_start(start).with_end(end)

        if seg_i > 0:
            cur_text = scene_texts[seg_i] if seg_i < len(scene_texts) else ""
            prev_text = scene_texts[seg_i - 1] if seg_i - 1 < len(scene_texts) else ""
            effect = _choose_transition(cur_text, prev_text)
        else:
            effect = "fade_in"

        effects_list = []
        if seg_i > 0:
            effects_list.append(vfx.CrossFadeIn(td))
        elif seg_i == 0:
            effects_list.append(vfx.CrossFadeIn(td * 0.5))

        if seg_i < len(merged) - 1:
            effects_list.append(vfx.CrossFadeOut(td))

        if effects_list:
            clip = clip.with_effects(effects_list)

        bg_clips.append(clip)
        preset_name = _assign_depthflow_presets(len(merged))[seg_i]["name"] if seg_i < len(merged) else "?"
        print(f"        씬 {seg_i+1}: {start:.1f}~{end:.1f}s [{preset_name}] 전환={effect}")

    print(f"      씬 이미지 {n_images}장 → 배경 {len(bg_clips)}개 클립 (DepthFlow 2.5D + fade 전환)")

    _create_scene_bg_clips._temp_files = temp_files
    return bg_clips


def render_from_script(script_path: str, output_path: str = None) -> dict:
    """스크립트 JSON에서 영상 렌더링 (Qwen3-TTS 전용)"""
    with open(script_path, "r", encoding="utf-8") as f:
        script = json.load(f)

    episode_id = script.get("episode_id", datetime.now().strftime("ep_%Y%m%d_%H%M%S"))
    full_text = script.get("full_text", "")
    if not full_text:
        parts = script.get("script", {})
        full_text = " ".join([
            parts.get("hook", ""),
            " ".join(parts.get("body", [])),
            parts.get("cta", ""),
        ])

    # 자막용 display_text (kcal 표기), TTS용 full_text (킬로칼로리 발음)
    display_text = script.get("display_text", full_text)

    render_config = script.get("render_config", {})
    fmt = render_config.get("format", "dark-bg-text")

    # scenes 배열에서 이미지 경로 수집
    scenes = script.get("scenes", [])
    image_dir = str(Path(script_path).parent.parent / "images")
    scene_images = []
    for scene in scenes:
        img_path = os.path.join(image_dir, f"{episode_id}_scene{scene['id']:02d}.png")
        if os.path.exists(img_path):
            scene_images.append(img_path)

    if output_path is None:
        ts = datetime.now().strftime("%Y%m%d-%H%M%S")
        output_path = str(RENDERED_DIR / f"{episode_id}_{ts}.mp4")

    return render_video(
        text=full_text,
        output_path=output_path,
        episode_id=episode_id,
        voice_preset=render_config.get("voice_preset", QWEN3_DEFAULT_VOICE),
        voice_instruct=render_config.get("voice_instruct"),
        speed=render_config.get("speed"),
        video_format=fmt,
        font_size=render_config.get("font_size", 52),
        scene_images=scene_images,
        display_text=display_text,
        scenes=scenes,
    )


def _run_sync_validation(all_subtitle_info, whisper_words):
    """자막-음성 싱크 자동 검증."""
    print("      [싱크 검증]")
    warnings = []
    display_fails = 0
    sync_ok = 0
    sync_warn = 0

    for idx, (phrase, p_start, p_end) in enumerate(all_subtitle_info):
        dur = p_end - p_start
        if dur < 0.4:
            warnings.append(f"FAIL 청크[{idx+1}] \"{phrase}\" 표시시간 {dur:.2f}s < 0.4s (안 보임)")
            display_fails += 1

        overlap_words = [w for w in whisper_words
                         if w["start"] < p_end and w["end"] > p_start]
        overlap_texts = [w["text"] for w in overlap_words]
        w_text = " ".join(overlap_texts) if overlap_texts else "(없음)"

        text_match = overlap_texts and any(
            phrase[:2] in w or w[:2] in phrase for w in overlap_texts
        )
        offset_ms = 0
        if overlap_words:
            offset_ms = abs(p_start - overlap_words[0]["start"]) * 1000

        if text_match and offset_ms <= 500:
            status = "OK"
            sync_ok += 1
        elif text_match and offset_ms <= 800:
            status = f"~{int(offset_ms)}ms"
            sync_ok += 1
        elif text_match:
            status = f"LATE {int(offset_ms)}ms"
            sync_warn += 1
            warnings.append(f"WARN 청크[{idx+1}] \"{phrase}\" 타이밍 오프셋 {int(offset_ms)}ms")
        else:
            status = "?"
            sync_warn += 1

        print(f"        [{idx+1}] {p_start:.2f}~{p_end:.2f}s \"{phrase}\" → W:\"{w_text}\" [{status}]")

    total = sync_ok + sync_warn
    sync_rate = (sync_ok / total * 100) if total else 0
    print(f"      [검증 결과] 싱크 {sync_ok}/{total} OK ({sync_rate:.0f}%)"
          f" | 표시시간 FAIL {display_fails}건")
    if warnings:
        for w in warnings:
            print(f"      ⚠ {w}")
    if display_fails > 0:
        print(f"      → FAIL: 자막 {display_fails}개가 0.4초 미만 (시청자에게 안 보임)")
    elif sync_rate >= 80:
        print("      → PASS: 싱크 품질 양호")
    else:
        print(f"      → WARN: 싱크 품질 미달 ({sync_rate:.0f}% < 80%)")


def _run_dead_section_qa(all_timings, duration):
    """Dead Section QA — 음성/자막 없는 구간이 2초 이상이면 경고."""
    DEAD_THRESHOLD_SEC = 2.0
    dead_sections = []
    if all_timings:
        if all_timings[0][0] > DEAD_THRESHOLD_SEC:
            dead_sections.append((0.0, all_timings[0][0]))
        for j in range(len(all_timings) - 1):
            gap_start = all_timings[j][1]
            gap_end = all_timings[j + 1][0]
            if gap_end - gap_start > DEAD_THRESHOLD_SEC:
                dead_sections.append((gap_start, gap_end))
        if duration - all_timings[-1][1] > DEAD_THRESHOLD_SEC:
            dead_sections.append((all_timings[-1][1], duration))

    if dead_sections:
        print(f"      [QA] DEAD SECTION 감지: {len(dead_sections)}건")
        for ds_start, ds_end in dead_sections:
            print(f"        {ds_start:.1f}~{ds_end:.1f}초 ({ds_end - ds_start:.1f}s 공백)")
    else:
        print(f"      [QA] Dead section 없음 — OK")


def render_video(
    text: str,
    output_path: str,
    episode_id: str = None,
    voice_preset: str = QWEN3_DEFAULT_VOICE,
    voice_instruct: str = None,
    speed: float = None,
    video_format: str = "dark-bg-text",
    font_size: int = 52,
    scene_images: list = None,
    display_text: str = None,
    depthflow_override: dict = None,
    scenes: list = None,
) -> dict:
    """텍스트 → 최종 MP4 영상 (Qwen3-TTS + PIL 자막 + moviepy 합성)

    v3.0: scenes 배열이 있으면 Per-Scene TTS 경로 사용 (근본 싱크 해결)
    scenes 없으면 레거시 단일 TTS 경로 사용
    """
    if episode_id is None:
        episode_id = datetime.now().strftime("ep_%Y%m%d_%H%M%S")

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    language = detect_language(text)
    format_config = FORMAT_PRESETS.get(video_format, FORMAT_PRESETS["dark-bg-text"])
    subtitle_y = format_config["subtitle_y"]

    lang_code = "ko" if language == "ko" else "auto"

    # CustomVoice (Voice Cloning) vs VoiceDesign 자동 감지
    if voice_preset in QWEN3_CLONE_PRESETS:
        desc = QWEN3_CLONE_PRESETS[voice_preset].get("desc", voice_preset)
        engine = Qwen3CustomVoiceEngine(preset=voice_preset, speed=speed, lang_code=lang_code)
        print(f"  [Voice Clone] 레퍼런스: {engine.ref_audio}")
    else:
        desc = QWEN3_VOICE_PRESETS.get(voice_preset, {}).get("desc", voice_preset)
        engine = Qwen3TTSEngine(preset=voice_preset, instruct=voice_instruct, speed=speed, lang_code=lang_code)

    # ══════════════════════════════════════════════════════════
    # v3.1 Single-TTS 경로 (scenes 배열이 있을 때)
    # 음색 100% 일관성: 전체 텍스트를 한 번에 TTS → 씬 경계 추출
    # ══════════════════════════════════════════════════════════
    if scenes:
        print(f"[1/4] Single-TTS 생성 중... (voice: {voice_preset} — {desc})")
        print(f"      {len(scenes)}개 씬, Single-TTS 아키텍처 v3.1")

        # 1. 단일 TTS + Whisper → 씬별 경계
        audio_segments, audio_path, duration = _generate_single_tts_audio(
            scenes=scenes,
            engine=engine,
            language=language,
            scene_images=scene_images,
            display_text=display_text,
            ts=ts,
        )

        if not audio_segments:
            return {"success": False, "episode_id": episode_id, "error": "Per-Scene TTS 실패"}

        # 2. 오디오 마스터링
        print(f"[2/4] 오디오 마스터링 중...")
        mastered_path = audio_path.replace(".wav", "_mastered.wav")
        _master_audio(audio_path, mastered_path)
        if os.path.exists(mastered_path):
            os.remove(audio_path)
            audio_path = mastered_path
            print("      마스터링 완료")

        # 3. 자막 클립 생성 — 씬별 정확한 타이밍 사용
        print(f"[3/4] 자막 생성 중...")
        subtitle_clips = []
        all_subtitle_info = []
        all_whisper_words = []
        all_phrase_timings = []
        chunk_count = 0

        for seg in audio_segments:
            all_whisper_words.extend(seg.whisper_words)
            for j, phrase in enumerate(seg.phrases):
                if j < len(seg.phrase_timings):
                    p_start, p_end = seg.phrase_timings[j]
                else:
                    continue
                all_subtitle_info.append((phrase, p_start, p_end))
                all_phrase_timings.append((p_start, p_end))
                try:
                    text_img = create_subtitle_image(phrase, font_size=font_size, language=language)
                    clip = (
                        ImageClip(text_img)
                        .with_start(p_start)
                        .with_end(p_end)
                        .with_position(("center", subtitle_y))
                    )
                    subtitle_clips.append(clip)
                    chunk_count += 1
                except Exception as e:
                    print(f"      자막 경고: {e}")

        print(f"      자막 {chunk_count}개 청크 생성")

        # 구절별 타이밍 출력
        for j, (phrase, ps, pe) in enumerate(all_subtitle_info):
            # 소속 씬 찾기
            scene_id = "?"
            for seg in audio_segments:
                if ps >= seg.audio_start - 0.01 and pe <= seg.audio_end + 0.01:
                    scene_id = seg.scene_id
                    break
            print(f"        [{j+1:2d}] 씬{scene_id} {ps:5.2f}~{pe:5.2f}s ({pe-ps:.1f}s) \"{phrase}\"")

        # QA 검증
        _run_dead_section_qa(all_phrase_timings, duration)
        _run_sync_validation(all_subtitle_info, all_whisper_words)

        # 4. 영상 합성
        print(f"[4/4] 영상 렌더링 중...")
        if scene_images:
            bg_clips = _create_scene_bg_clips_v3(
                audio_segments, duration, format_config,
                depthflow_override=depthflow_override,
            )
        else:
            bg_clips = [ColorClip(size=(1080, 1920), color=format_config["bg_color"], duration=duration)]

        video = CompositeVideoClip(bg_clips + subtitle_clips)
        _ffmpeg_mux(video, audio_path, output_path, fps=30)

        # 정리
        video.close()
        if os.path.exists(audio_path):
            os.remove(audio_path)
        # 씬별 WAV 정리
        for seg in audio_segments:
            if seg.wav_path and os.path.exists(seg.wav_path):
                try:
                    os.remove(seg.wav_path)
                except OSError:
                    pass
        # DepthFlow 임시 파일 정리
        if hasattr(_create_scene_bg_clips_v3, "_temp_files"):
            for tf in _create_scene_bg_clips_v3._temp_files:
                try:
                    if tf and os.path.exists(tf):
                        os.unlink(tf)
                except OSError:
                    pass
            _create_scene_bg_clips_v3._temp_files = []

        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path) / (1024 * 1024)
            print(f"      완료: {output_path}")
            print(f"      길이: {duration:.1f}초 | 크기: {file_size:.1f}MB")
            return {
                "success": True,
                "episode_id": episode_id,
                "path": output_path,
                "duration": duration,
                "file_size_mb": round(file_size, 1),
                "format": video_format,
                "voice_preset": voice_preset,
                "engine": "qwen3_tts",
                "architecture": "per_scene_v3",
                "scenes": len(audio_segments),
                "subtitles": chunk_count,
            }
        return {"success": False, "episode_id": episode_id, "error": "렌더링 실패"}

    # ══════════════════════════════════════════════════════════
    # 레거시 경로 (scenes 없을 때 — 단일 TTS)
    # ══════════════════════════════════════════════════════════
    audio_path = str(TEMP_DIR / f"audio_{ts}.wav")

    tts_text = preprocess_korean_for_tts(text) if language == "ko" else text
    tts_sentences = split_sentences(tts_text)
    subtitle_text = display_text if display_text else text
    display_sentences = split_sentences(subtitle_text)
    n_sent = len(tts_sentences)

    print(f"[1/3] Qwen3-TTS 단일 생성 중... (voice: {voice_preset} — {desc})")

    raw_audio_path = str(TEMP_DIR / f"raw_audio_{ts}.wav")
    tts_result = engine.generate(tts_text, raw_audio_path)
    raw_duration = tts_result["duration"]
    print(f"      TTS 완료: {raw_duration:.1f}초")

    print("      Whisper 분석 중...")
    whisper_data = get_word_timestamps(raw_audio_path)
    whisper_words_raw = whisper_data["words"] if whisper_data else []
    print(f"      Whisper 워드 {len(whisper_words_raw)}개 감지")

    import shutil
    shutil.copy2(raw_audio_path, audio_path)
    duration = raw_duration
    shifted_words = whisper_words_raw

    if os.path.exists(raw_audio_path):
        os.remove(raw_audio_path)

    print("[2/3] 자막 생성 중...")

    all_phrases = []
    phrase_to_sent = []
    for i in range(n_sent):
        disp_sent = display_sentences[i] if i < len(display_sentences) else tts_sentences[i]
        phrases = split_korean_phrases(disp_sent, max_chars=16) if language == "ko" \
            else split_into_chunks(disp_sent, max_chars=16)
        for phrase in phrases:
            all_phrases.append(phrase)
            phrase_to_sent.append(i)

    all_timings = _align_phrases_to_whisper(
        all_phrases, shifted_words, 0.0, duration,
    )

    sentence_ranges = []
    for si in range(n_sent):
        indices = [j for j in range(len(all_phrases)) if phrase_to_sent[j] == si]
        if indices:
            sentence_ranges.append((all_timings[indices[0]][0], all_timings[indices[-1]][1]))
        elif sentence_ranges:
            sentence_ranges.append((sentence_ranges[-1][1], sentence_ranges[-1][1]))
        else:
            sentence_ranges.append((0.0, 0.0))

    print(f"      최종: {duration:.1f}초 (문장 {n_sent}개, 구절 {len(all_phrases)}개)")

    timings = [
        (tts_sentences[i], sentence_ranges[i][0], sentence_ranges[i][1])
        for i in range(n_sent)
    ]

    _run_dead_section_qa(all_timings, duration)

    subtitle_clips = []
    chunk_count = 0
    all_subtitle_info = []

    for j, phrase in enumerate(all_phrases):
        p_start, p_end = all_timings[j]
        all_subtitle_info.append((phrase, p_start, p_end))
        try:
            text_img = create_subtitle_image(phrase, font_size=font_size, language=language)
            clip = (
                ImageClip(text_img)
                .with_start(p_start)
                .with_end(p_end)
                .with_position(("center", subtitle_y))
            )
            subtitle_clips.append(clip)
            chunk_count += 1
        except Exception as e:
            print(f"      자막 경고: {e}")

    print(f"      자막 {chunk_count}개 청크 생성")
    _run_sync_validation(all_subtitle_info, shifted_words)

    mastered_path = audio_path.replace(".wav", "_mastered.wav")
    print("      오디오 마스터링 적용 중...")
    _master_audio(audio_path, mastered_path)
    if os.path.exists(mastered_path):
        os.remove(audio_path)
        audio_path = mastered_path

    print("[3/3] 영상 렌더링 중...")

    if scene_images:
        bg_clips = _create_scene_bg_clips(scene_images, timings, duration, format_config, depthflow_override=depthflow_override)
    else:
        bg_clips = [ColorClip(size=(1080, 1920), color=format_config["bg_color"], duration=duration)]

    video = CompositeVideoClip(bg_clips + subtitle_clips)
    _ffmpeg_mux(video, audio_path, output_path, fps=30)

    video.close()
    if os.path.exists(audio_path):
        os.remove(audio_path)

    if hasattr(_create_scene_bg_clips, "_temp_files"):
        for tf in _create_scene_bg_clips._temp_files:
            try:
                if tf and os.path.exists(tf):
                    os.unlink(tf)
            except OSError:
                pass
        _create_scene_bg_clips._temp_files = []

    if os.path.exists(output_path):
        file_size = os.path.getsize(output_path) / (1024 * 1024)
        print(f"      완료: {output_path}")
        print(f"      길이: {duration:.1f}초 | 크기: {file_size:.1f}MB")
        return {
            "success": True,
            "episode_id": episode_id,
            "path": output_path,
            "duration": duration,
            "file_size_mb": round(file_size, 1),
            "format": video_format,
            "voice_preset": voice_preset,
            "engine": "qwen3_tts",
            "sentences": len(tts_sentences),
            "subtitles": chunk_count,
        }

    return {"success": False, "episode_id": episode_id, "error": "렌더링 실패"}


# CLI 진입점
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="YouTube Shorts Video Composer (Qwen3-TTS)")
    parser.add_argument("--script", type=str, help="Script JSON path")
    parser.add_argument("--text", type=str, help="Direct text input")
    parser.add_argument("--output", type=str, default=None)
    parser.add_argument("--voice", type=str, default=QWEN3_DEFAULT_VOICE,
                        help=f"Voice preset: {', '.join(QWEN3_VOICE_PRESETS.keys())}")
    parser.add_argument("--instruct", type=str, default=None, help="Custom voice description")
    parser.add_argument("--speed", type=float, default=None)
    parser.add_argument("--format", type=str, default="dark-bg-text")
    parser.add_argument("--test", action="store_true", help="Run test render")
    args = parser.parse_args()

    if args.test:
        test_text = "만약에 지금 중력이 두 배가 된다면? 몸무게가 순식간에 두 배가 됩니다."
        result = render_video(
            text=test_text,
            output_path=str(RENDERED_DIR / "test_qwen3.mp4"),
            voice_preset=args.voice,
            voice_instruct=args.instruct,
            speed=args.speed,
            video_format=args.format,
        )
        if result["success"]:
            print(f"\nTest OK: {result['path']}")
        else:
            print(f"\nFAILED: {result.get('error')}")

    elif args.script:
        result = render_from_script(args.script, args.output)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.text:
        out = args.output or str(RENDERED_DIR / f"render_{datetime.now():%Y%m%d_%H%M%S}.mp4")
        result = render_video(
            text=args.text,
            output_path=out,
            voice_preset=args.voice,
            voice_instruct=args.instruct,
            speed=args.speed,
            video_format=args.format,
        )
        print(json.dumps(result, indent=2, ensure_ascii=False))

    else:
        parser.print_help()
