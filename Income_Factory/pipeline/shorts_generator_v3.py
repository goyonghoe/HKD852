#!/usr/bin/env python3
"""
YouTube Shorts 자동 생성 파이프라인 V3
- TTS 음성 생성 (Edge TTS)
- 자막 생성 (한글 폰트 지원)
- 영상 합성 (FFmpeg)
"""

import asyncio
import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime

try:
    import edge_tts
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "edge-tts", "-q"])
    import edge_tts

# 설정
PIPELINE_DIR = Path(__file__).parent
TEMP_DIR = PIPELINE_DIR / "temp"
OUTPUT_DIR = PIPELINE_DIR / "output"

for d in [TEMP_DIR, OUTPUT_DIR]:
    d.mkdir(exist_ok=True)

# 한글 폰트 경로 (macOS)
KOREAN_FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

# TTS 음성
VOICE_OPTIONS = {
    "male": "ko-KR-InJoonNeural",
    "female": "ko-KR-SunHiNeural",
}


class ShortsGenerator:
    def __init__(self, voice_type="male"):
        self.voice = VOICE_OPTIONS.get(voice_type, VOICE_OPTIONS["male"])
        self.word_timings = []

    async def generate_audio(self, text: str, audio_path: str):
        """TTS 음성 생성"""
        communicate = edge_tts.Communicate(text, self.voice)

        self.word_timings = []
        audio_data = b""

        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
            elif chunk["type"] == "WordBoundary":
                self.word_timings.append({
                    "text": chunk["text"],
                    "start": chunk["offset"] / 10_000_000,
                    "duration": chunk["duration"] / 10_000_000
                })

        with open(audio_path, "wb") as f:
            f.write(audio_data)

        print(f"✅ 음성 생성 완료")
        return audio_path

    def get_duration(self, audio_path: str) -> float:
        result = subprocess.run([
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path
        ], capture_output=True, text=True)
        return float(result.stdout.strip())

    def create_video(self, audio_path: str, text: str, output_path: str):
        """영상 생성 (배경 + 오디오 + 자막)"""
        duration = self.get_duration(audio_path)
        sentences = self._split_sentences(text)
        timings = self._calc_timings(sentences, duration)

        # drawtext 필터 생성
        filters = []
        for sentence, start, end in timings:
            # 한글 처리를 위해 텍스트 파일로 저장
            safe_text = sentence.replace("'", "").replace('"', '').replace(':', ' ')
            if len(safe_text) > 25:
                mid = len(safe_text) // 2
                space = safe_text.rfind(' ', 5, mid + 10)
                if space > 0:
                    safe_text = safe_text[:space] + '\\n' + safe_text[space+1:]

            f = (
                f"drawtext="
                f"fontfile='{KOREAN_FONT}':"
                f"text='{safe_text}':"
                f"fontsize=48:"
                f"fontcolor=white:"
                f"borderw=3:"
                f"bordercolor=black:"
                f"x=(w-text_w)/2:"
                f"y=h-text_h-400:"
                f"enable='between(t\\,{start:.2f}\\,{end:.2f})'"
            )
            filters.append(f)

        filter_str = ",".join(filters) if filters else "null"

        # FFmpeg 실행
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", f"color=c=0x1a1a2e:s=1080x1920:d={duration+1}:r=30",
            "-i", audio_path,
            "-filter_complex", filter_str,
            "-map", "0:v", "-map", "1:a",
            "-c:v", "libx264", "-preset", "fast",
            "-c:a", "aac",
            "-pix_fmt", "yuv420p",
            "-shortest",
            output_path
        ]

        print("🎬 영상 렌더링 중...")
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"⚠️ 자막 오류, 자막 없이 생성 중...")
            # 자막 없이 재시도
            cmd_simple = [
                "ffmpeg", "-y",
                "-f", "lavfi", "-i", f"color=c=0x1a1a2e:s=1080x1920:d={duration+1}:r=30",
                "-i", audio_path,
                "-map", "0:v", "-map", "1:a",
                "-c:v", "libx264", "-c:a", "aac",
                "-pix_fmt", "yuv420p", "-shortest",
                output_path
            ]
            subprocess.run(cmd_simple, capture_output=True)

        print(f"✅ 영상 생성 완료")
        return output_path

    def _split_sentences(self, text: str) -> list:
        sentences = []
        current = ""
        for char in text:
            current += char
            if char in ".!?":
                if current.strip():
                    sentences.append(current.strip())
                current = ""
        if current.strip():
            sentences.append(current.strip())
        return sentences

    def _calc_timings(self, sentences: list, total: float) -> list:
        if not self.word_timings:
            per = total / len(sentences) if sentences else 3
            return [(s, i*per, (i+1)*per) for i, s in enumerate(sentences)]

        result = []
        idx = 0
        for sent in sentences:
            words = len(sent.split())
            start = self.word_timings[idx]["start"] if idx < len(self.word_timings) else (result[-1][2] if result else 0)
            end_idx = min(idx + words - 1, len(self.word_timings) - 1)
            end = self.word_timings[end_idx]["start"] + self.word_timings[end_idx]["duration"] + 0.3 if end_idx >= 0 else start + 3
            idx += words
            result.append((sent, start, end))
        return result


async def create_short(script: dict, voice: str = "male") -> str:
    """메인 함수"""
    gen = ShortsGenerator(voice)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    audio = str(TEMP_DIR / f"audio_{ts}.mp3")
    output = str(OUTPUT_DIR / f"short_{ts}.mp4")

    print("\n" + "=" * 50)
    print(f"🎬 제목: {script['title']}")
    print("=" * 50)

    # 1. 음성 생성
    print("\n[1/2] 음성 생성...")
    await gen.generate_audio(script["content"], audio)
    dur = gen.get_duration(audio)
    print(f"📊 길이: {dur:.1f}초")

    # 2. 영상 생성
    print("\n[2/2] 영상 합성...")
    gen.create_video(audio, script["content"], output)

    # 결과
    if os.path.exists(output):
        size = os.path.getsize(output) / (1024*1024)
        print("\n" + "=" * 50)
        print("🎉 완료!")
        print(f"📁 {output}")
        print(f"⏱️ {dur:.1f}초 | 📦 {size:.1f}MB")
        print("=" * 50)
        os.remove(audio)
        return output
    return None


# 테스트
SCRIPT = {
    "title": "AI로 월 100만원 버는 법",
    "content": """ChatGPT로 돈 번다는 사람들 진짜일까요.
저도 처음엔 믿지 않았습니다.
근데 직접 해보니까 진짜였어요.

첫번째 AI 썸네일 제작.
크몽에서 건당 5천원.
하루 10개면 5만원입니다.

두번째 AI 블로그 글 대필.
글 하나에 2만원.
하루 3개면 6만원.

세번째 AI 번역 서비스.
전문가 수준 번역이 가능합니다.

이 세가지만 해도 월 100만원은 현실적입니다.
중요한 건 시작하는 겁니다.
팔로우 해두세요."""
}

if __name__ == "__main__":
    print("🚀 YouTube Shorts Generator V3")
    result = asyncio.run(create_short(SCRIPT))
    if result:
        print(f"\n💡 열기: open \"{result}\"")
