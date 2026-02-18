#!/usr/bin/env python3
"""
자막 생성기 — 워드 타이밍 기반 FFmpeg drawtext 필터 생성
"""

from pathlib import Path


def split_sentences(text: str) -> list[str]:
    """텍스트를 문장 단위로 분할"""
    sentences = []
    current = ""
    for char in text:
        current += char
        if char in ".!?":
            stripped = current.strip()
            if stripped:
                sentences.append(stripped)
            current = ""
    if current.strip():
        sentences.append(current.strip())
    return sentences


def calc_sentence_timings(
    sentences: list[str],
    word_timings: list[dict],
    total_duration: float,
) -> list[tuple[str, float, float]]:
    """문장별 시작/종료 시간 계산"""
    if not word_timings:
        # 글자수 비례 가중치 분배 (균등 분할 → 문장 길이 반영)
        if not sentences:
            return []
        char_counts = [len(s) for s in sentences]
        total_chars = sum(char_counts)
        result = []
        t = 0.0
        for i, s in enumerate(sentences):
            dur = total_duration * (char_counts[i] / total_chars)
            result.append((s, t, t + dur))
            t += dur
        return result

    result = []
    word_idx = 0

    for sent in sentences:
        words_in_sent = len(sent.split())
        start = (
            word_timings[word_idx]["start"]
            if word_idx < len(word_timings)
            else (result[-1][2] if result else 0)
        )
        end_idx = min(word_idx + words_in_sent - 1, len(word_timings) - 1)
        end = (
            word_timings[end_idx]["start"]
            + word_timings[end_idx]["duration"]
            + 0.3
            if end_idx >= 0
            else start + 3
        )
        word_idx += words_in_sent
        result.append((sent, start, min(end, total_duration)))

    return result


def wrap_text(text: str, max_chars: int = 35) -> str:
    """긴 텍스트를 적절한 위치에서 줄바꿈 (drawtext 호환)"""
    if len(text) <= max_chars:
        return text

    mid = len(text) // 2
    # 공백 기준으로 나누기
    for i in range(mid, min(mid + 10, len(text))):
        if text[i] == " ":
            return text[:i]

    space = text.rfind(" ", 5, mid + 10)
    if space > 0:
        return text[:space]

    return text


def sanitize_for_ffmpeg(text: str) -> str:
    """FFmpeg drawtext용 텍스트 안전 처리"""
    return (
        text
        .replace("\\", "")
        .replace("'", "\u2019")  # 스마트 따옴표로 대체
        .replace('"', "")
        .replace(":", " -")
        .replace("%", " percent")
        .replace(";", ",")
        .replace("[", "(")
        .replace("]", ")")
    )


def generate_drawtext_filters(
    sentences: list[str],
    word_timings: list[dict],
    total_duration: float,
    font_path: str = "/System/Library/Fonts/Supplemental/Arial.ttf",
    font_size: int = 48,
    y_position: str = "h-text_h-400",
) -> str:
    """FFmpeg drawtext 필터 체인 생성"""
    timings = calc_sentence_timings(sentences, word_timings, total_duration)
    filters = []

    for sent, start, end in timings:
        safe_text = sanitize_for_ffmpeg(sent)
        wrapped = wrap_text(safe_text)

        f = (
            f"drawtext="
            f"fontfile='{font_path}':"
            f"text='{wrapped}':"
            f"fontsize={font_size}:"
            f"fontcolor=white:"
            f"borderw=3:"
            f"bordercolor=black:"
            f"x=(w-text_w)/2:"
            f"y={y_position}:"
            f"enable='between(t\\,{start:.2f}\\,{end:.2f})'"
        )
        filters.append(f)

    return ",".join(filters) if filters else "null"


def generate_ass_subtitles(
    sentences: list[str],
    word_timings: list[dict],
    total_duration: float,
    output_path: str,
    font_name: str = "Arial",
    font_size: int = 24,
) -> str:
    """ASS 자막 파일 생성 (대안: drawtext 대신 사용 가능)"""
    timings = calc_sentence_timings(sentences, word_timings, total_duration)

    def format_time(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = seconds % 60
        return f"{h}:{m:02d}:{s:05.2f}"

    header = f"""[Script Info]
Title: YouTube Shorts Subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,3,0,2,40,40,200,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events = []
    for sent, start, end in timings:
        s = format_time(start)
        e = format_time(end)
        events.append(f"Dialogue: 0,{s},{e},Default,,0,0,0,,{sent}")

    content = header + "\n".join(events)

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

    return output_path
