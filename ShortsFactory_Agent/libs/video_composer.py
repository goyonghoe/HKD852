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
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

try:
    from moviepy import ColorClip, AudioFileClip, ImageClip, CompositeVideoClip, vfx
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "moviepy", "-q"])
    from moviepy import ColorClip, AudioFileClip, ImageClip, CompositeVideoClip, vfx

from PIL import Image, ImageDraw, ImageFont
import numpy as np

from tts_engine import Qwen3TTSEngine, QWEN3_VOICE_PRESETS, QWEN3_DEFAULT_VOICE
from subtitle_gen import split_sentences, calc_sentence_timings

# 디렉토리 설정
AGENT_DIR = Path(__file__).parent.parent
PIPELINE_DIR = AGENT_DIR / "pipeline"
TEMP_DIR = PIPELINE_DIR / "temp"
RENDERED_DIR = PIPELINE_DIR / "rendered"

for d in [TEMP_DIR, RENDERED_DIR]:
    d.mkdir(parents=True, exist_ok=True)

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


def get_font(language: str, size: int) -> ImageFont.FreeTypeFont:
    """언어에 맞는 Bold 폰트 로드"""
    # .ttc 파일 내 Bold weight 인덱스
    BOLD_INDEX = {"ko": 6, "ja": 0, "en": 0}

    paths = [FONT_PATHS.get(language, ""), FONT_PATHS.get(f"{language}_fallback", "")]
    paths += list(FONT_PATHS.values())

    for path in paths:
        if path and os.path.exists(path):
            try:
                if path.endswith(".ttc"):
                    idx = BOLD_INDEX.get(language, 0)
                    return ImageFont.truetype(path, size, index=idx)
                return ImageFont.truetype(path, size)
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


def preprocess_korean_for_tts(text: str) -> str:
    """한국어 텍스트에 자연스러운 끊어읽기 쉼표 삽입 (TTS 프로소디 개선)."""
    result = text
    for adv in ["만약에", "그래서", "결국", "하지만", "그러나", "그런데", "따라서", "물론", "사실"]:
        result = re.sub(rf'({re.escape(adv)})\s+(?!,)', rf'\1, ', result)
    for ending in [r'인데', r'는데', r'지만', r'니까']:
        result = re.sub(rf'(\w+{ending})\s+(?![,?.!])', rf'\1, ', result)
    result = re.sub(r',\s*,', ',', result)
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


def _find_sentence_boundaries(
    sentences: list[str],
    whisper_words: list[dict],
    total_duration: float,
) -> list[float]:
    """문장 경계 시점을 하이브리드 방식으로 탐지.

    1. 글자수 비례로 예상 경계 시점 계산
    2. 각 예상 시점 ±2초 범위 내에서 가장 큰 Whisper 워드 갭으로 스냅
    3. 갭이 없으면 예상 시점 사용

    반환: n-1개 경계 시점 리스트 (오름차순)
    """
    n = len(sentences)
    if n <= 1:
        return []

    # 글자수 비례 예상 경계
    char_lens = [len(s) for s in sentences]
    total_chars = sum(char_lens) or 1
    expected = []
    cum = 0
    for i in range(n - 1):
        cum += char_lens[i]
        expected.append(total_duration * cum / total_chars)

    if not whisper_words or len(whisper_words) < 2:
        print(f"      경계 탐지: Whisper 워드 부족, 글자수 비례 사용")
        return expected

    # Whisper 워드 간 갭 (50ms 이상만 유효)
    MIN_GAP = 0.05  # 50ms — 이 미만은 경계로 간주하지 않음
    gaps = []
    for i in range(1, len(whisper_words)):
        size = whisper_words[i]["start"] - whisper_words[i - 1]["end"]
        if size >= MIN_GAP:
            mid = (whisper_words[i - 1]["end"] + whisper_words[i]["start"]) / 2
            gaps.append({"mid": mid, "size": size, "idx": i})

    if gaps:
        top_gaps = sorted(gaps, key=lambda g: -g["size"])[:6]
        print(f"      유효 갭 {len(gaps)}개 (≥{MIN_GAP*1000:.0f}ms), 상위: " +
              ", ".join(f"{g['mid']:.1f}s({g['size']*1000:.0f}ms)" for g in top_gaps))
    else:
        print(f"      유효 갭 없음 (모든 갭 < {MIN_GAP*1000:.0f}ms) → 글자수 비례 사용")
        return expected

    # 각 예상 경계를 ±2초 내 가장 큰 갭으로 스냅
    SNAP_RANGE = 2.0
    boundaries = []
    used = set()

    for bi, et in enumerate(expected):
        best = None
        for g in gaps:
            if g["idx"] in used:
                continue
            if abs(g["mid"] - et) <= SNAP_RANGE:
                if best is None or g["size"] > best["size"]:
                    best = g

        if best:
            boundaries.append(best["mid"])
            used.add(best["idx"])
            print(f"      경계 {bi+1}: 예상 {et:.2f}초 → 스냅 {best['mid']:.2f}초 (갭 {best['size']*1000:.0f}ms)")
        else:
            boundaries.append(et)
            print(f"      경계 {bi+1}: 예상 {et:.2f}초 (글자수 비례)")

    return sorted(boundaries)


def _concat_wav_with_silence(wav_paths: list[str], silence_sec: float, output_path: str) -> float:
    """WAV 파일들을 무음 간격으로 이어붙여 합성. 총 길이(초) 반환."""
    all_samples = []
    sample_rate = n_channels = sample_width = None

    for i, path in enumerate(wav_paths):
        with wave.open(path, "r") as wf:
            if sample_rate is None:
                sample_rate = wf.getframerate()
                n_channels = wf.getnchannels()
                sample_width = wf.getsampwidth()
            frames = wf.readframes(wf.getnframes())
            all_samples.append(np.frombuffer(frames, dtype=np.int16))
            if i < len(wav_paths) - 1:
                n_silence = int(silence_sec * sample_rate * n_channels)
                all_samples.append(np.zeros(n_silence, dtype=np.int16))

    combined = np.concatenate(all_samples)
    with wave.open(output_path, "w") as wf:
        wf.setnchannels(n_channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(combined.tobytes())
    return len(combined) / (sample_rate * n_channels)


def _map_phrases_to_whisper_words(
    phrases: list[str],
    whisper_words: list[dict],
    sent_offset: float,
) -> list[tuple[float, float]] | None:
    """구절을 Whisper 워드에 글자수 비례로 매핑 (문장 내).
    오버랩 방지: 각 구절의 끝은 다음 구절의 시작을 초과하지 않음.
    """
    if not whisper_words or not phrases:
        return None
    n_w = len(whisper_words)
    p_chars = [len(p) for p in phrases]
    total = sum(p_chars)
    if total == 0:
        return None
    timings = []
    pos = 0
    for chars in p_chars:
        r0 = pos / total
        r1 = (pos + chars) / total
        wi = min(int(r0 * n_w), n_w - 1)
        wj = min(max(round(r1 * n_w) - 1, wi), n_w - 1)
        t0 = whisper_words[wi]["start"] + sent_offset
        t1 = whisper_words[wj]["end"] + sent_offset
        if t1 <= t0:
            t1 = t0 + 0.1
        timings.append((t0, t1))
        pos += chars

    # 오버랩 방지: phrase[i].end <= phrase[i+1].start
    for j in range(len(timings) - 1):
        if timings[j][1] > timings[j + 1][0]:
            timings[j] = (timings[j][0], timings[j + 1][0])
        # 최소 표시 시간 보장 (0.1초)
        if timings[j][1] - timings[j][0] < 0.1:
            timings[j] = (timings[j][0], timings[j][0] + 0.1)

    return timings


def _insert_silence_at_boundaries(
    audio_path: str,
    boundary_times: list[float],
    silence_sec: float,
    output_path: str,
) -> tuple[float, list[float]]:
    """오디오 파일의 지정 시점들에 무음을 삽입. (총 길이, 새 경계 시점들) 반환.

    boundary_times: 문장 경계 시점(초) 리스트 (n-1개)
    각 경계에 silence_sec 만큼의 무음이 삽입됨.
    """
    with wave.open(audio_path, "r") as wf:
        sample_rate = wf.getframerate()
        n_channels = wf.getnchannels()
        sample_width = wf.getsampwidth()
        frames = wf.readframes(wf.getnframes())
    audio = np.frombuffer(frames, dtype=np.int16)

    n_silence_samples = int(silence_sec * sample_rate * n_channels)
    silence_block = np.zeros(n_silence_samples, dtype=np.int16)

    sorted_boundaries = sorted(boundary_times)
    parts = []
    new_boundary_times = []
    cumulative_silence = 0.0

    prev_sample = 0
    for bt in sorted_boundaries:
        sample_idx = int(bt * sample_rate * n_channels)
        sample_idx = min(sample_idx, len(audio))
        parts.append(audio[prev_sample:sample_idx])
        parts.append(silence_block)
        cumulative_silence += silence_sec
        new_boundary_times.append(bt + cumulative_silence)
        prev_sample = sample_idx

    parts.append(audio[prev_sample:])

    combined = np.concatenate(parts)
    with wave.open(output_path, "w") as wf:
        wf.setnchannels(n_channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(combined.tobytes())

    total_duration = len(combined) / (sample_rate * n_channels)
    return total_duration, new_boundary_times


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


def _shift_whisper_words(
    words: list[dict],
    boundary_times_original: list[float],
    silence_sec: float,
) -> list[dict]:
    """무음 삽입으로 인한 Whisper 워드 타임스탬프 시프트.

    boundary_times_original: 원본 오디오 기준 문장 경계 시점 리스트
    각 경계 이후의 워드는 누적 무음만큼 시프트.
    """
    sorted_boundaries = sorted(boundary_times_original)
    shifted = []
    for w in words:
        offset = 0.0
        for bt in sorted_boundaries:
            if w["start"] >= bt:
                offset += silence_sec
            else:
                break
        shifted.append({
            "text": w["text"],
            "start": w["start"] + offset,
            "end": w["end"] + offset,
        })
    return shifted


def get_word_timestamps(audio_path: str) -> dict | None:
    """Whisper로 워드 레벨 + 세그먼트 레벨 타임스탬프 추출.
    반환: {"words": [...], "segments": [...]} 또는 None
    """
    try:
        ssl._create_default_https_context = ssl._create_unverified_context
        import whisper
        model = whisper.load_model("base")
        result = model.transcribe(audio_path, word_timestamps=True, language="ko")
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


def detect_sentence_boundaries(audio_path: str, n_sentences: int) -> list[float] | None:
    """오디오 무음 구간 감지로 문장 경계 시점(초) 반환. 실패 시 None."""
    if not os.path.exists(audio_path):
        print(f"      [무음감지] 파일 없음: {audio_path}")
        return None
    try:
        with wave.open(audio_path, "r") as wf:
            frames = wf.readframes(wf.getnframes())
            sample_rate = wf.getframerate()
            n_channels = wf.getnchannels()
    except Exception as e:
        print(f"      [무음감지] WAV 읽기 실패: {e}")
        return None

    audio = np.frombuffer(frames, dtype=np.int16).astype(np.float32)
    if n_channels == 2:
        audio = audio[::2]
    if len(audio) == 0:
        return None

    # 20ms 윈도우 RMS 에너지
    win = int(sample_rate * 0.02)
    energy = []
    for i in range(0, len(audio), win):
        chunk = audio[i : i + win]
        energy.append(np.sqrt(np.mean(chunk**2)) if len(chunk) > 0 else 0)

    if not energy:
        return None

    # 무음 임계값 (하위 20%)
    threshold = np.percentile(energy, 20)

    # 무음 구간 탐지 (100ms+ = 5윈도우+)
    min_gap = 5
    gaps = []
    silent_start = None
    for i, e in enumerate(energy):
        if e <= threshold:
            if silent_start is None:
                silent_start = i
        else:
            if silent_start is not None and (i - silent_start) >= min_gap:
                mid_sec = ((silent_start + i) / 2) * 0.02
                gap_len = i - silent_start
                gaps.append((mid_sec, gap_len))
            silent_start = None

    # 가장 긴 무음 n-1개를 문장 경계로
    need = n_sentences - 1
    if len(gaps) < need:
        print(f"      [무음감지] 무음 구간 부족: {len(gaps)}개 < 필요 {need}개")
        return None

    gaps.sort(key=lambda x: -x[1])
    return sorted(g[0] for g in gaps[:need])


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


def _create_scene_bg_clips(
    scene_images: list,
    timings: list,
    total_duration: float,
    format_config: dict,
    fade_duration: float = 0.6,
) -> list:
    """씬 이미지를 문장 타이밍에 맞춰 크로스페이드 전환으로 배경 클립 생성"""
    n_images = len(scene_images)
    n_sentences = len(timings)

    if n_images == 0:
        return [ColorClip(size=(1080, 1920), color=format_config["bg_color"], duration=total_duration)]

    # 이미지 배열 미리 로드
    loaded_images = []
    for idx, path in enumerate(scene_images):
        try:
            loaded_images.append(_resize_image_for_shorts(path))
        except Exception as e:
            print(f"      씬 이미지 로드 실패 [{idx}]: {e}")
            loaded_images.append(None)

    # 씬 구간 계산: 각 문장에 이미지 1:1 매핑
    segments = []
    for i, (sent, start, end) in enumerate(timings):
        img_idx = min(i, n_images - 1)
        segments.append((img_idx, start, end))

    # 마지막 문장 이후 남은 시간
    if timings and timings[-1][2] < total_duration:
        last_idx = min(n_sentences - 1, n_images - 1)
        segments.append((last_idx, timings[-1][2], total_duration))

    # 클립 생성: 크로스페이드 전환 (이전 이미지 연장으로 검은 화면 방지)
    bg_clips = []
    for seg_i, (img_idx, start, end) in enumerate(segments):
        img_array = loaded_images[img_idx] if img_idx < len(loaded_images) else None

        if img_array is None:
            clip = ColorClip(size=(1080, 1920), color=format_config["bg_color"])
            clip = clip.with_start(start).with_end(end)
            bg_clips.append(clip)
            continue

        # 이전 씬과 다른 이미지일 때만 크로스페이드
        prev_img_idx = segments[seg_i - 1][0] if seg_i > 0 else -1
        is_new_image = (img_idx != prev_img_idx)

        # 이전 이미지 연장: 다음 씬이 크로스페이드하는 동안 배경으로 유지
        # → 검은 화면 방지
        if seg_i < len(segments) - 1:
            next_start = segments[seg_i + 1][1]  # 다음 씬 시작
            clip_end = max(end, next_start)  # 다음 씬 시작까지 연장
        else:
            clip_end = max(end, total_duration)

        # 새 씬 시작: 약간 앞당겨서 크로스페이드 겹침
        clip_start = max(0, start - fade_duration) if (seg_i > 0 and is_new_image) else start
        clip = ImageClip(img_array).with_start(clip_start).with_end(clip_end)

        # 첫 씬 → 페이드인, 이후 씬 → 크로스페이드인
        if seg_i == 0:
            clip = clip.with_effects([vfx.CrossFadeIn(fade_duration)])
        elif is_new_image:
            clip = clip.with_effects([vfx.CrossFadeIn(fade_duration)])

        bg_clips.append(clip)

    print(f"      씬 이미지 {n_images}장 → 배경 {len(bg_clips)}개 클립 (크로스페이드 {fade_duration}초)")
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
        output_path = str(RENDERED_DIR / f"{episode_id}.mp4")

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
    )


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
) -> dict:
    """텍스트 → 최종 MP4 영상 (Qwen3-TTS + PIL 자막 + moviepy 합성)"""
    if episode_id is None:
        episode_id = datetime.now().strftime("ep_%Y%m%d_%H%M%S")

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    audio_path = str(TEMP_DIR / f"audio_{ts}.wav")

    language = detect_language(text)

    # 1. 단일 TTS 생성 → Whisper → 문장 경계에 무음 삽입 (음성 톤 일관성)
    tts_text = preprocess_korean_for_tts(text) if language == "ko" else text
    tts_sentences = split_sentences(tts_text)
    subtitle_text = display_text if display_text else text
    display_sentences = split_sentences(subtitle_text)
    n_sent = len(tts_sentences)

    desc = QWEN3_VOICE_PRESETS.get(voice_preset, {}).get("desc", voice_preset)
    print(f"[1/3] Qwen3-TTS 단일 생성 중... (voice: {voice_preset} — {desc})")
    engine = Qwen3TTSEngine(preset=voice_preset, instruct=voice_instruct, speed=speed)

    raw_audio_path = str(TEMP_DIR / f"raw_audio_{ts}.wav")
    tts_result = engine.generate(tts_text, raw_audio_path)
    raw_duration = tts_result["duration"]
    print(f"      TTS 완료: {raw_duration:.1f}초")

    # Whisper로 워드 타임스탬프 추출 (원본 오디오 기준)
    print("      Whisper 분석 중...")
    whisper_data = get_word_timestamps(raw_audio_path)
    whisper_words_raw = whisper_data["words"] if whisper_data else []
    print(f"      Whisper 워드 {len(whisper_words_raw)}개 감지")

    # 문장 경계 탐지: 글자수 비례 + Whisper 갭 스냅 (하이브리드)
    SILENCE_GAP = 0.35
    sentence_ranges = []

    boundary_times_original = _find_sentence_boundaries(
        tts_sentences, whisper_words_raw, raw_duration,
    )

    if boundary_times_original:
        # 문장 경계에 무음 삽입
        duration, new_boundaries = _insert_silence_at_boundaries(
            raw_audio_path, boundary_times_original, SILENCE_GAP, audio_path,
        )
        # Whisper 워드 타임스탬프 시프트
        shifted_words = _shift_whisper_words(
            whisper_words_raw, boundary_times_original, SILENCE_GAP,
        )
        # 문장 범위: new_boundaries로 직접 구분 (빈틈 없음)
        prev_t = 0.0
        for nb in new_boundaries:
            sentence_ranges.append((prev_t, nb))
            prev_t = nb
        sentence_ranges.append((prev_t, duration))

        print(f"      무음 삽입 완료: {raw_duration:.1f}초 → {duration:.1f}초")
    else:
        # 문장 1개이거나 경계 탐지 실패
        import shutil
        shutil.copy2(raw_audio_path, audio_path)
        duration = raw_duration
        shifted_words = whisper_words_raw
        if n_sent == 1:
            sentence_ranges = [(0.0, duration)]
        else:
            char_total = sum(len(s) for s in tts_sentences) or 1
            t = 0.0
            for s in tts_sentences:
                sd = duration * (len(s) / char_total)
                sentence_ranges.append((t, t + sd))
                t += sd

    # 원본 오디오 정리
    if os.path.exists(raw_audio_path):
        os.remove(raw_audio_path)

    # 문장별 타이밍 출력
    print(f"      최종: {duration:.1f}초 (문장 {n_sent}개, 간격 {SILENCE_GAP}초)")
    for i, (s, e) in enumerate(sentence_ranges):
        disp = display_sentences[i][:25] if i < len(display_sentences) else "?"
        print(f"      문장 {i+1}: {s:.2f}~{e:.2f}초 ({e-s:.1f}s) | {disp}")

    # 씬 배경 전환용 timings
    timings = [
        (tts_sentences[i], sentence_ranges[i][0], sentence_ranges[i][1])
        for i in range(n_sent)
    ]

    # 2. 자막 생성 (글자수 비례 + Whisper 검증)
    print("[2/3] 자막 생성 중...")

    format_config = FORMAT_PRESETS.get(video_format, FORMAT_PRESETS["dark-bg-text"])
    subtitle_y = format_config["subtitle_y"]

    subtitle_clips = []
    chunk_count = 0
    all_subtitle_info = []  # 검증용

    for i in range(n_sent):
        disp_sent = display_sentences[i] if i < len(display_sentences) else tts_sentences[i]
        s_start, s_end = sentence_ranges[i]
        s_dur = s_end - s_start

        phrases = split_korean_phrases(disp_sent, max_chars=16) if language == "ko" \
            else split_into_chunks(disp_sent, max_chars=16)

        # Whisper 워드 기반 실제 음성 구간 탐지 → 구절 시간 분배
        sent_words = [w for w in shifted_words
                      if w["start"] < s_end and w["end"] > s_start]
        if sent_words:
            speech_start = max(sent_words[0]["start"], s_start)
            speech_end = min(sent_words[-1]["end"], s_end)
        else:
            speech_start = s_start
            speech_end = s_end
        speech_dur = max(speech_end - speech_start, 0.1)

        p_chars = [len(p) for p in phrases]
        tc = sum(p_chars) or 1
        phrase_timings = []
        pt = speech_start
        for chars in p_chars:
            pd = speech_dur * (chars / tc)
            phrase_timings.append((pt, min(pt + pd, speech_end)))
            pt += pd

        for j, phrase in enumerate(phrases):
            p_start, p_end = phrase_timings[j]
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

    # 자막-음성 싱크 자동 검증 (3단계)
    print(f"      자막 {chunk_count}개 청크 생성")
    warnings = []

    # 검증 1: 청크 품질 (너무 짧거나 긴 자막)
    for idx, (phrase, p_start, p_end) in enumerate(all_subtitle_info):
        dur = p_end - p_start
        if len(phrase) <= 2 and dur < 0.3:
            warnings.append(f"WARN 청크[{idx+1}] \"{phrase}\" 너무 짧음 ({len(phrase)}자, {dur:.2f}s)")
        if dur < 0.2:
            warnings.append(f"WARN 청크[{idx+1}] \"{phrase}\" 표시시간 부족 ({dur:.2f}s < 0.2s)")

    # 검증 2: Whisper 워드 매칭 + 타이밍 오프셋
    print("      [싱크 검증]")
    sync_ok = 0
    sync_warn = 0
    for idx, (phrase, p_start, p_end) in enumerate(all_subtitle_info):
        overlap_words = [w for w in shifted_words
                         if w["start"] < p_end and w["end"] > p_start]
        overlap_texts = [w["text"] for w in overlap_words]
        w_text = " ".join(overlap_texts) if overlap_texts else "(없음)"

        # 텍스트 매칭
        text_match = overlap_texts and any(
            phrase[:2] in w or w[:2] in phrase for w in overlap_texts
        )
        # 타이밍 오프셋: 자막 시작 vs 첫 매칭 워드 시작
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

    # 검증 3: 종합 판정
    total = sync_ok + sync_warn
    sync_rate = (sync_ok / total * 100) if total else 0
    print(f"      [검증 결과] {sync_ok}/{total} OK ({sync_rate:.0f}%)")
    if warnings:
        for w in warnings:
            print(f"      ⚠ {w}")
    if sync_rate >= 80:
        print("      → PASS: 싱크 품질 양호")
    else:
        print(f"      → WARN: 싱크 품질 미달 ({sync_rate:.0f}% < 80%)")
        print("      → 재렌더링 권고")

    # 2.5. 오디오 마스터링 (하이패스 + EQ + 컴프레서 + 리버브 + 라우드니스)
    mastered_path = audio_path.replace(".wav", "_mastered.wav")
    print("      오디오 마스터링 적용 중... (EQ + 컴프레서 + 리버브 + 라우드니스)")
    _master_audio(audio_path, mastered_path)
    if os.path.exists(mastered_path):
        os.remove(audio_path)
        audio_path = mastered_path
        print("      마스터링 완료")

    # 3. 영상 합성
    print("[3/3] 영상 렌더링 중...")
    audio = AudioFileClip(audio_path)

    # 씬 이미지가 있으면 배경으로 사용, 없으면 단색 배경
    if scene_images:
        bg_clips = _create_scene_bg_clips(scene_images, timings, duration, format_config)
    else:
        bg_clips = [ColorClip(size=(1080, 1920), color=format_config["bg_color"], duration=duration)]

    video = CompositeVideoClip(bg_clips + subtitle_clips)
    video = video.with_audio(audio)

    video.write_videofile(
        output_path,
        fps=30,
        codec="libx264",
        audio_codec="aac",
        logger=None,
    )

    # 정리
    audio.close()
    video.close()
    if os.path.exists(audio_path):
        os.remove(audio_path)

    # 결과 검증
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
