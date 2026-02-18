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
    from moviepy import ColorClip, AudioFileClip, ImageClip, VideoFileClip, VideoClip, CompositeVideoClip, vfx
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "moviepy", "-q"])
    from moviepy import ColorClip, AudioFileClip, ImageClip, VideoFileClip, VideoClip, CompositeVideoClip, vfx

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
    경계 컷 지점에 20ms 페이드아웃/페이드인을 적용하여 끊김 방지.
    """
    FADE_MS = 20  # 페이드 길이 (밀리초)

    with wave.open(audio_path, "r") as wf:
        sample_rate = wf.getframerate()
        n_channels = wf.getnchannels()
        sample_width = wf.getsampwidth()
        frames = wf.readframes(wf.getnframes())
    audio = np.frombuffer(frames, dtype=np.int16).astype(np.float32)

    n_silence_samples = int(silence_sec * sample_rate * n_channels)
    silence_block = np.zeros(n_silence_samples, dtype=np.float32)
    fade_samples = int(FADE_MS / 1000 * sample_rate * n_channels)

    sorted_boundaries = sorted(boundary_times)
    parts = []
    new_boundary_times = []
    cumulative_silence = 0.0

    prev_sample = 0
    for bt in sorted_boundaries:
        sample_idx = int(bt * sample_rate * n_channels)
        sample_idx = min(sample_idx, len(audio))
        segment = audio[prev_sample:sample_idx].copy()

        # 페이드아웃: 세그먼트 끝 20ms
        if len(segment) > fade_samples and fade_samples > 0:
            fade_out = np.linspace(1.0, 0.0, fade_samples)
            segment[-fade_samples:] *= fade_out

        parts.append(segment)
        parts.append(silence_block.copy())
        cumulative_silence += silence_sec
        new_boundary_times.append(bt + cumulative_silence)
        prev_sample = sample_idx

    # 나머지 오디오
    tail = audio[prev_sample:].copy()
    # 페이드인: 마지막 세그먼트 시작 20ms
    if len(tail) > fade_samples and fade_samples > 0:
        fade_in = np.linspace(0.0, 1.0, fade_samples)
        tail[:fade_samples] *= fade_in
    parts.append(tail)

    # 각 무음 뒤 세그먼트에도 페이드인 적용 (두 번째 세그먼트부터)
    # parts 구조: [seg0, silence, seg1, silence, seg2, ..., tail]
    for pi in range(2, len(parts), 2):  # seg1, seg2, ... (무음 다음 세그먼트)
        seg = parts[pi]
        if len(seg) > fade_samples and fade_samples > 0:
            fade_in = np.linspace(0.0, 1.0, fade_samples)
            seg[:fade_samples] *= fade_in

    combined = np.concatenate(parts)
    combined = np.clip(combined, -32768, 32767).astype(np.int16)

    with wave.open(output_path, "w") as wf:
        wf.setnchannels(n_channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(combined.tobytes())

    total_duration = len(combined) / (sample_rate * n_channels)
    return total_duration, new_boundary_times


def _group_words_into_sentences(
    sentences: list[str],
    whisper_words: list[dict],
    total_duration: float,
) -> list[tuple[float, float]]:
    """Whisper 워드를 문장별로 그룹핑하여 문장 범위(시작, 종료) 산출.

    오디오를 자르지 않고, Whisper 워드 위치만으로 각 문장의
    실제 발화 구간을 결정합니다.

    전략:
    1. 각 문장의 글자수 비례로 예상 워드 개수 산출
    2. Whisper 워드를 순서대로 문장에 할당
    3. 각 문장의 첫 워드 start ~ 마지막 워드 end = 문장 범위
    4. 문장 사이 갭은 중간점에서 분할 (겹침/빈틈 없이)
    """
    n = len(sentences)
    if n == 0:
        return []
    if not whisper_words:
        # fallback: 글자수 비례
        char_total = sum(len(s) for s in sentences) or 1
        ranges = []
        t = 0.0
        for s in sentences:
            d = total_duration * (len(s) / char_total)
            ranges.append((t, t + d))
            t += d
        return ranges

    # 문장별 정규화 텍스트 길이
    sent_norms = [_normalize_for_match(s) for s in sentences]
    sent_chars = [max(len(sn), 1) for sn in sent_norms]
    total_chars = sum(sent_chars)

    # Whisper 워드를 글자수 비례로 문장에 할당
    n_words = len(whisper_words)
    word_idx = 0
    sent_word_groups = []

    for si in range(n):
        if si < n - 1:
            # 이 문장에 할당할 워드 수 (비례)
            alloc = max(1, round(n_words * sent_chars[si] / total_chars))
            end_idx = min(word_idx + alloc, n_words)
        else:
            # 마지막 문장: 나머지 전부
            end_idx = n_words

        group = whisper_words[word_idx:end_idx]
        sent_word_groups.append(group)
        word_idx = end_idx

    # 문장 범위: 각 그룹의 첫 워드 start ~ 마지막 워드 end
    raw_ranges = []
    for group in sent_word_groups:
        if group:
            raw_ranges.append((group[0]["start"], group[-1]["end"]))
        elif raw_ranges:
            # 빈 그룹: 이전 문장 끝에서 시작
            raw_ranges.append((raw_ranges[-1][1], raw_ranges[-1][1]))
        else:
            raw_ranges.append((0.0, 0.0))

    # 문장 사이 갭 처리: 겹침/빈틈 없이 중간점에서 분할
    ranges = []
    for si in range(n):
        s_start = raw_ranges[si][0]
        s_end = raw_ranges[si][1]

        # 시작점: 이전 문장 끝과의 중간
        if si > 0:
            prev_end = raw_ranges[si - 1][1]
            if s_start > prev_end:
                s_start = prev_end + (s_start - prev_end) / 2
            else:
                s_start = ranges[-1][1]  # 겹치면 이전 끝에서 바로 시작

        # 종료점: 다음 문장 시작과의 중간
        if si < n - 1:
            next_start = raw_ranges[si + 1][0]
            if next_start > s_end:
                s_end = s_end + (next_start - s_end) / 2

        # 첫 문장은 0부터, 마지막 문장은 끝까지
        if si == 0:
            s_start = 0.0
        if si == n - 1:
            s_end = total_duration

        ranges.append((s_start, s_end))

    return ranges


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
            _whisper_model = whisper.load_model("base")
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

# 씬 전환 플래시 효과
FLASH_DURATION = 0.12  # 플래시 지속시간 (초)


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


def _create_scene_bg_clips(
    scene_images: list,
    timings: list,
    total_duration: float,
    format_config: dict,
    fade_duration: float = 0.3,
    depthflow_override: dict = None,
) -> list:
    """씬 이미지를 DepthFlow 2.5D 패럴랙스 + flash transition으로 배경 클립 생성."""

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

    # DepthFlow 렌더링: 고유 이미지별 패럴랙스 비디오 생성
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

    # 클립 생성: DepthFlow 비디오 + flash transition
    bg_clips = []
    temp_files = []  # 나중에 정리할 임시 파일

    for seg_i, (img_idx, start, end) in enumerate(merged):
        video_path = rendered_paths[seg_i] if seg_i < len(rendered_paths) else None

        if video_path and os.path.exists(video_path):
            # DepthFlow 패럴랙스 비디오 클립
            try:
                clip = VideoFileClip(video_path)
                clip = clip.with_start(start)
                temp_files.append(video_path)
            except Exception as e:
                print(f"        씬 {seg_i+1}: 비디오 로드 실패 ({e})")
                clip = None

        if not video_path or not os.path.exists(video_path) or clip is None:
            # 정적 이미지 폴백
            img_path = unique_imgs[seg_i] if seg_i < len(unique_imgs) else unique_imgs[-1]
            try:
                img_array = _resize_image_for_shorts(img_path)
                clip = ImageClip(img_array, duration=end - start).with_start(start)
            except Exception:
                clip = ColorClip(size=(1080, 1920), color=format_config["bg_color"])
                clip = clip.with_start(start).with_end(end)

        # Flash transition (씬 전환 시 짧은 흰색 플래시)
        if seg_i > 0:
            flash_start = start - FLASH_DURATION / 2
            flash = ColorClip(
                size=(1080, 1920), color=(255, 255, 255),
                duration=FLASH_DURATION,
            ).with_start(max(0, flash_start))
            flash = flash.with_effects([
                vfx.CrossFadeIn(FLASH_DURATION / 2),
                vfx.CrossFadeOut(FLASH_DURATION / 2),
            ])
            bg_clips.append(flash)

        bg_clips.append(clip)
        preset_name = _assign_depthflow_presets(len(merged))[seg_i]["name"] if seg_i < len(merged) else "?"
        print(f"        씬 {seg_i+1}: {start:.1f}~{end:.1f}s [{preset_name}]")

    print(f"      씬 이미지 {n_images}장 → 배경 {len(bg_clips)}개 클립 (DepthFlow 2.5D + flash)")

    # 임시 파일 정리는 render 완료 후 수행 (클립이 읽기 중이므로)
    # _create_scene_bg_clips._temp_files에 저장
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
    depthflow_override: dict = None,
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

    # 오디오를 그대로 사용 (자르지 않음)
    import shutil
    shutil.copy2(raw_audio_path, audio_path)
    duration = raw_duration
    shifted_words = whisper_words_raw

    # 원본 오디오 정리
    if os.path.exists(raw_audio_path):
        os.remove(raw_audio_path)

    # Whisper 워드 덤프 (디버그)
    if shifted_words:
        print(f"      Whisper 워드 덤프:")
        for wi, w in enumerate(shifted_words):
            print(f"        [{wi:2d}] {w['start']:5.2f}~{w['end']:5.2f}s \"{w['text']}\"")

    # 2. 자막 생성 — 1단계 전역 정렬 (문장 그룹핑 없이 직접 매핑)
    print("[2/3] 자막 생성 중...")

    format_config = FORMAT_PRESETS.get(video_format, FORMAT_PRESETS["dark-bg-text"])
    subtitle_y = format_config["subtitle_y"]

    # 전체 구절 생성 (문장 소속 추적)
    all_phrases = []
    phrase_to_sent = []
    for i in range(n_sent):
        disp_sent = display_sentences[i] if i < len(display_sentences) else tts_sentences[i]
        phrases = split_korean_phrases(disp_sent, max_chars=16) if language == "ko" \
            else split_into_chunks(disp_sent, max_chars=16)
        for phrase in phrases:
            all_phrases.append(phrase)
            phrase_to_sent.append(i)

    # 전체 구절을 Whisper 워드에 직접 정렬 (1단계, 문장 그룹핑 없음)
    all_timings = _align_phrases_to_whisper(
        all_phrases, shifted_words, 0.0, duration,
    )

    # 문장 범위 = 소속 구절들의 범위 합산 (씬 이미지 전환용)
    sentence_ranges = []
    for si in range(n_sent):
        indices = [j for j in range(len(all_phrases)) if phrase_to_sent[j] == si]
        if indices:
            sentence_ranges.append((all_timings[indices[0]][0], all_timings[indices[-1]][1]))
        elif sentence_ranges:
            sentence_ranges.append((sentence_ranges[-1][1], sentence_ranges[-1][1]))
        else:
            sentence_ranges.append((0.0, 0.0))

    # 문장별 타이밍 출력
    print(f"      최종: {duration:.1f}초 (문장 {n_sent}개, 구절 {len(all_phrases)}개, 무편집 원본)")
    for i, (s, e) in enumerate(sentence_ranges):
        disp = display_sentences[i][:25] if i < len(display_sentences) else "?"
        print(f"      문장 {i+1}: {s:.2f}~{e:.2f}초 ({e-s:.1f}s) | {disp}")

    # 씬 배경 전환용 timings
    timings = [
        (tts_sentences[i], sentence_ranges[i][0], sentence_ranges[i][1])
        for i in range(n_sent)
    ]

    # 구절별 타이밍 결과
    for j, (phrase, (ps, pe)) in enumerate(zip(all_phrases, all_timings)):
        si = phrase_to_sent[j]
        print(f"        [{j+1:2d}] 문장{si+1} {ps:5.2f}~{pe:5.2f}s ({pe-ps:.1f}s) \"{phrase}\"")

    # 자막 클립 생성
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

    # 자막-음성 싱크 자동 검증 (3단계)
    print(f"      자막 {chunk_count}개 청크 생성")
    warnings = []

    # 검증 1: 청크 품질 (표시 시간 검증)
    display_fails = 0
    for idx, (phrase, p_start, p_end) in enumerate(all_subtitle_info):
        dur = p_end - p_start
        if dur < 0.4:
            warnings.append(f"FAIL 청크[{idx+1}] \"{phrase}\" 표시시간 {dur:.2f}s < 0.4s (안 보임)")
            display_fails += 1

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
    print(f"      [검증 결과] 싱크 {sync_ok}/{total} OK ({sync_rate:.0f}%)"
          f" | 표시시간 FAIL {display_fails}건")
    if warnings:
        for w in warnings:
            print(f"      ⚠ {w}")
    if display_fails > 0:
        print(f"      → FAIL: 자막 {display_fails}개가 0.4초 미만 (시청자에게 안 보임)")
        print("      → 재렌더링 필수")
    elif sync_rate >= 80:
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
        bg_clips = _create_scene_bg_clips(scene_images, timings, duration, format_config, depthflow_override=depthflow_override)
    else:
        bg_clips = [ColorClip(size=(1080, 1920), color=format_config["bg_color"], duration=duration)]

    video = CompositeVideoClip(bg_clips + subtitle_clips)
    video = video.with_audio(audio)

    video.write_videofile(
        output_path,
        fps=30,
        codec="libx264",
        audio_codec="aac",
        preset="veryfast",
        threads=4,
        ffmpeg_params=["-crf", "23"],
        logger=None,
    )

    # 정리
    audio.close()
    video.close()
    if os.path.exists(audio_path):
        os.remove(audio_path)

    # 결과 검증
    # DepthFlow 임시 파일 정리
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
