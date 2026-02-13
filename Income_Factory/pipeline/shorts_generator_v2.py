#!/usr/bin/env python3
"""
YouTube Shorts 자동 생성 파이프라인 V2
- TTS 음성 생성 (Edge TTS)
- 자막 생성 (drawtext 기반)
- 영상 합성 (FFmpeg)
"""

import asyncio
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from datetime import datetime

# Edge TTS import
try:
    import edge_tts
except ImportError:
    print("Installing edge-tts...")
    subprocess.run([sys.executable, "-m", "pip", "install", "edge-tts", "-q"])
    import edge_tts

# 설정
PIPELINE_DIR = Path(__file__).parent
TEMP_DIR = PIPELINE_DIR / "temp"
OUTPUT_DIR = PIPELINE_DIR / "output"

# 디렉토리 생성
for d in [TEMP_DIR, OUTPUT_DIR]:
    d.mkdir(exist_ok=True)

# TTS 음성 설정 (한국어)
VOICE_OPTIONS = {
    "male": "ko-KR-InJoonNeural",
    "female": "ko-KR-SunHiNeural",
    "male_bright": "ko-KR-HyunsuNeural"
}


class ShortsGeneratorV2:
    def __init__(self, voice_type="male"):
        self.voice = VOICE_OPTIONS.get(voice_type, VOICE_OPTIONS["male"])
        self.word_timings = []

    async def generate_audio_with_timing(self, text: str, audio_path: str):
        """TTS로 음성 생성 + 타이밍 정보 수집"""
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

        print(f"✅ 음성 생성: {audio_path}")
        return audio_path

    def get_audio_duration(self, audio_path: str) -> float:
        """오디오 파일 길이"""
        result = subprocess.run([
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path
        ], capture_output=True, text=True)
        return float(result.stdout.strip())

    def parse_sentences(self, text: str) -> list:
        """문장 분리"""
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

    def create_video_with_subtitles(self, audio_path: str, text: str, output_path: str,
                                     bg_color: str = "#1a1a2e"):
        """배경 + 오디오 + 자막이 합성된 영상 생성"""
        duration = self.get_audio_duration(audio_path)
        sentences = self.parse_sentences(text)

        # 문장별 타이밍 계산
        sentence_timings = self._calculate_sentence_timings(sentences, duration)

        # drawtext 필터 생성
        drawtext_filters = []
        for i, (sentence, start, end) in enumerate(sentence_timings):
            # 긴 문장 줄바꿈
            display_text = sentence
            if len(sentence) > 20:
                mid = len(sentence) // 2
                # 공백 기준으로 줄바꿈
                space_idx = sentence.rfind(' ', 0, mid + 10)
                if space_idx > 5:
                    display_text = sentence[:space_idx] + "\\n" + sentence[space_idx+1:]

            # 특수문자 이스케이프
            display_text = display_text.replace("'", "\\'").replace(":", "\\:")

            filter_str = (
                f"drawtext=text='{display_text}':"
                f"fontsize=50:"
                f"fontcolor=white:"
                f"borderw=3:"
                f"bordercolor=black:"
                f"x=(w-text_w)/2:"
                f"y=(h-text_h)/2+200:"
                f"enable='between(t,{start:.2f},{end:.2f})'"
            )
            drawtext_filters.append(filter_str)

        # 필터 체인
        filter_complex = ",".join(drawtext_filters) if drawtext_filters else "null"

        # FFmpeg 명령어
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", f"color=c={bg_color}:s=1080x1920:d={duration+1}:r=30",
            "-i", audio_path,
            "-vf", filter_complex,
            "-c:v", "libx264",
            "-c:a", "aac",
            "-pix_fmt", "yuv420p",
            "-shortest",
            output_path
        ]

        print("🎬 영상 렌더링 중...")
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"⚠️ 자막 렌더링 오류, 자막 없이 생성...")
            # 자막 없이 재시도
            cmd_simple = [
                "ffmpeg", "-y",
                "-f", "lavfi",
                "-i", f"color=c={bg_color}:s=1080x1920:d={duration+1}:r=30",
                "-i", audio_path,
                "-c:v", "libx264",
                "-c:a", "aac",
                "-pix_fmt", "yuv420p",
                "-shortest",
                output_path
            ]
            subprocess.run(cmd_simple, capture_output=True)

        return output_path

    def _calculate_sentence_timings(self, sentences: list, total_duration: float) -> list:
        """문장별 타이밍 계산"""
        if not self.word_timings:
            # 타이밍 정보 없으면 균등 분배
            time_per_sentence = total_duration / len(sentences)
            return [
                (s, i * time_per_sentence, (i + 1) * time_per_sentence)
                for i, s in enumerate(sentences)
            ]

        result = []
        word_idx = 0

        for sentence in sentences:
            words_in_sentence = len(sentence.split())

            if word_idx < len(self.word_timings):
                start = self.word_timings[word_idx]["start"]
            else:
                start = self.word_timings[-1]["start"] if self.word_timings else 0

            end_idx = min(word_idx + words_in_sentence - 1, len(self.word_timings) - 1)
            if end_idx >= 0 and self.word_timings:
                end = self.word_timings[end_idx]["start"] + self.word_timings[end_idx]["duration"] + 0.5
            else:
                end = start + 3

            word_idx += words_in_sentence
            result.append((sentence, start, end))

        return result


async def create_short_v2(script: dict, voice_type: str = "male") -> str:
    """쇼츠 영상 생성 V2"""
    generator = ShortsGeneratorV2(voice_type)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    audio_path = str(TEMP_DIR / f"audio_{timestamp}.mp3")
    final_path = str(OUTPUT_DIR / f"short_{timestamp}.mp4")

    print("\n🎬 쇼츠 생성 시작!")
    print(f"📝 제목: {script['title']}")
    print("-" * 50)

    # 1. TTS 생성
    print("\n[1/2] 음성 생성 중...")
    await generator.generate_audio_with_timing(script["content"], audio_path)

    duration = generator.get_audio_duration(audio_path)
    print(f"📊 음성 길이: {duration:.1f}초")

    # 2. 영상 생성 (배경 + 오디오 + 자막)
    print("\n[2/2] 영상 합성 중...")
    generator.create_video_with_subtitles(audio_path, script["content"], final_path)

    # 결과 확인
    if os.path.exists(final_path):
        file_size = os.path.getsize(final_path) / (1024 * 1024)
        print("\n" + "=" * 50)
        print(f"🎉 쇼츠 생성 완료!")
        print(f"📁 파일: {final_path}")
        print(f"⏱️  길이: {duration:.1f}초")
        print(f"📦 크기: {file_size:.1f}MB")
        print("=" * 50)

        # 임시 파일 정리
        try:
            os.remove(audio_path)
        except:
            pass

        return final_path
    else:
        print("❌ 영상 생성 실패")
        return None


# 테스트 스크립트
TEST_SCRIPT = {
    "title": "AI로 월 100만원 버는 법",
    "content": """ChatGPT로 돈 번다는 사람들, 진짜일까요?
저도 처음엔 믿지 않았습니다. 근데 직접 해보니까 진짜였어요.

첫 번째, AI 썸네일 제작.
Canva에서 AI로 썸네일 만들어서 크몽에 올리세요.
건당 5천원, 하루 10개면 5만원입니다.

두 번째, AI 블로그 글 대필.
ChatGPT로 초안 잡고 다듬으면 끝.
글 하나에 2만원, 하루 3개면 6만원.

세 번째, AI 번역 서비스.
DeepL이랑 ChatGPT 조합하면 전문가 수준입니다.

이 세 가지만 해도 월 100만원은 현실적입니다.
중요한 건 시작하는 겁니다.

팔로우 해두세요!""",
    "hashtags": ["#AI부업", "#ChatGPT", "#쇼츠"]
}


if __name__ == "__main__":
    print("🚀 YouTube Shorts 자동 생성기 V2")
    print("=" * 50)

    result = asyncio.run(create_short_v2(TEST_SCRIPT, voice_type="male"))
    if result:
        print(f"\n✅ 생성된 파일: {result}")
        print(f"\n💡 파일 열기: open \"{result}\"")
