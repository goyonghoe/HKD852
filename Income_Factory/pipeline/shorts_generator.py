#!/usr/bin/env python3
"""
YouTube Shorts 자동 생성 파이프라인
- TTS 음성 생성 (Edge TTS)
- 자막 생성
- 영상 합성 (FFmpeg)
"""

import asyncio
import json
import os
import subprocess
import sys
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
BASE_DIR = Path(__file__).parent.parent
PIPELINE_DIR = Path(__file__).parent
TEMP_DIR = PIPELINE_DIR / "temp"
OUTPUT_DIR = PIPELINE_DIR / "output"
ASSETS_DIR = PIPELINE_DIR / "assets"

# 디렉토리 생성
for d in [TEMP_DIR, OUTPUT_DIR, ASSETS_DIR]:
    d.mkdir(exist_ok=True)

# TTS 음성 설정 (한국어)
VOICE_OPTIONS = {
    "male": "ko-KR-InJoonNeural",      # 남성 (차분)
    "female": "ko-KR-SunHiNeural",      # 여성 (밝음)
    "male_bright": "ko-KR-HyunsuNeural" # 남성 (밝음)
}


class ShortsGenerator:
    def __init__(self, voice_type="male"):
        self.voice = VOICE_OPTIONS.get(voice_type, VOICE_OPTIONS["male"])

    async def generate_audio(self, text: str, output_path: str) -> str:
        """TTS로 음성 생성"""
        communicate = edge_tts.Communicate(text, self.voice)
        await communicate.save(output_path)
        print(f"✅ 음성 생성 완료: {output_path}")
        return output_path

    async def generate_audio_with_subtitles(self, text: str, audio_path: str, subtitle_path: str):
        """TTS 음성 + 자막 동시 생성"""
        communicate = edge_tts.Communicate(text, self.voice)

        subtitles = []
        audio_data = b""

        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
            elif chunk["type"] == "WordBoundary":
                subtitles.append({
                    "text": chunk["text"],
                    "start": chunk["offset"] / 10_000_000,  # 100ns to seconds
                    "duration": chunk["duration"] / 10_000_000
                })

        # 오디오 저장
        with open(audio_path, "wb") as f:
            f.write(audio_data)

        # ASS 자막 생성 (더 나은 스타일링)
        self._create_ass_subtitles(subtitles, subtitle_path, text)

        print(f"✅ 음성 생성: {audio_path}")
        print(f"✅ 자막 생성: {subtitle_path}")

        return audio_path, subtitle_path

    def _create_ass_subtitles(self, word_timings: list, output_path: str, full_text: str):
        """ASS 자막 파일 생성 - 문장 단위로"""
        # 문장 분리
        sentences = []
        current = ""
        for char in full_text:
            current += char
            if char in ".!?":
                if current.strip():
                    sentences.append(current.strip())
                current = ""
        if current.strip():
            sentences.append(current.strip())

        # ASS 헤더
        ass_header = """[Script Info]
Title: YouTube Shorts Subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,60,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,4,2,2,50,50,400,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

        # 타이밍 계산
        if word_timings:
            total_duration = word_timings[-1]["start"] + word_timings[-1]["duration"]
        else:
            total_duration = 60

        time_per_sentence = total_duration / len(sentences) if sentences else 5

        events = []
        current_time = 0
        word_idx = 0

        for sentence in sentences:
            # 시작 시간 계산
            if word_timings and word_idx < len(word_timings):
                start_time = word_timings[word_idx]["start"]
            else:
                start_time = current_time

            # 문장의 단어 수 계산
            words_in_sentence = len(sentence.split())

            # 종료 시간 계산
            end_word_idx = min(word_idx + words_in_sentence, len(word_timings) - 1)
            if word_timings and end_word_idx >= 0:
                end_time = word_timings[end_word_idx]["start"] + word_timings[end_word_idx]["duration"] + 0.3
            else:
                end_time = start_time + time_per_sentence

            word_idx += words_in_sentence
            current_time = end_time

            # 긴 문장 줄바꿈 처리 (20자 기준)
            if len(sentence) > 25:
                mid = len(sentence) // 2
                space_idx = sentence.rfind(' ', 0, mid + 5)
                if space_idx > 0:
                    sentence = sentence[:space_idx] + "\\N" + sentence[space_idx+1:]

            start_str = self._format_ass_time(start_time)
            end_str = self._format_ass_time(end_time)

            events.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{sentence}")

        # 파일 저장
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(ass_header)
            f.write("\n".join(events))

    def _format_ass_time(self, seconds: float) -> str:
        """초를 ASS 시간 형식으로 변환"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        centis = int((seconds % 1) * 100)
        return f"{hours}:{minutes:02d}:{secs:02d}.{centis:02d}"

    def get_audio_duration(self, audio_path: str) -> float:
        """오디오 파일 길이 확인"""
        result = subprocess.run([
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path
        ], capture_output=True, text=True)
        return float(result.stdout.strip())

    def create_background_video(self, duration: float, output_path: str,
                                 bg_color: str = "#1a1a2e", text_lines: list = None):
        """그라데이션 배경 + 텍스트가 있는 영상 생성"""
        # 그라데이션 배경 생성
        filter_complex = (
            f"color=c={bg_color}:s=1080x1920:d={duration},"
            "format=rgba,"
            "geq=r='clip(r(X,Y)+30*sin(2*PI*X/1080),0,255)':"
            "g='clip(g(X,Y)+20*sin(2*PI*Y/1920),0,255)':"
            "b='clip(b(X,Y)+40*cos(2*PI*X/1080),0,255)'"
        )

        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", f"color=c={bg_color}:s=1080x1920:d={duration}",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-t", str(duration),
            output_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Warning: {result.stderr}")

        print(f"✅ 배경 영상 생성: {output_path}")
        return output_path

    def merge_audio_video(self, video_path: str, audio_path: str, output_path: str):
        """비디오 + 오디오 합성"""
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", audio_path,
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            output_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Warning: {result.stderr}")
        print(f"✅ 오디오 합성 완료: {output_path}")
        return output_path

    def add_subtitles_ass(self, video_path: str, subtitle_path: str, output_path: str):
        """ASS 자막 하드코딩"""
        # 절대 경로로 변환하고 이스케이프
        abs_subtitle = os.path.abspath(subtitle_path)
        # Windows/Mac 경로 이스케이프
        escaped_path = abs_subtitle.replace("\\", "/").replace(":", "\\:")

        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vf", f"ass={escaped_path}",
            "-c:a", "copy",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            output_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"자막 오류, 자막 없이 진행: {result.stderr[:200]}")
            # 자막 실패시 원본 복사
            subprocess.run(["cp", video_path, output_path])
        else:
            print(f"✅ 자막 추가 완료: {output_path}")

        return output_path


async def create_short(script: dict, voice_type: str = "male") -> str:
    """
    쇼츠 영상 생성 메인 함수

    script = {
        "title": "영상 제목",
        "hook": "첫 3초 훅 텍스트",
        "content": "전체 스크립트 내용",
        "hashtags": ["#태그1", "#태그2"]
    }
    """
    generator = ShortsGenerator(voice_type)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # 파일 경로 설정
    audio_path = str(TEMP_DIR / f"audio_{timestamp}.mp3")
    subtitle_path = str(TEMP_DIR / f"subtitle_{timestamp}.ass")
    bg_video_path = str(TEMP_DIR / f"bg_{timestamp}.mp4")
    merged_path = str(TEMP_DIR / f"merged_{timestamp}.mp4")
    final_path = str(OUTPUT_DIR / f"short_{timestamp}.mp4")

    print("\n🎬 쇼츠 생성 시작!")
    print(f"📝 제목: {script['title']}")
    print("-" * 50)

    # 1. TTS + 자막 생성
    print("\n[1/4] 음성 & 자막 생성 중...")
    await generator.generate_audio_with_subtitles(
        script["content"],
        audio_path,
        subtitle_path
    )

    # 2. 오디오 길이 확인
    duration = generator.get_audio_duration(audio_path)
    print(f"📊 음성 길이: {duration:.1f}초")

    # 3. 배경 영상 생성
    print("\n[2/4] 배경 영상 생성 중...")
    generator.create_background_video(duration + 1, bg_video_path)

    # 4. 오디오 + 비디오 합성
    print("\n[3/4] 오디오 합성 중...")
    generator.merge_audio_video(bg_video_path, audio_path, merged_path)

    # 5. 자막 추가
    print("\n[4/4] 자막 추가 중...")
    generator.add_subtitles_ass(merged_path, subtitle_path, final_path)

    # 최종 파일 확인
    if os.path.exists(final_path):
        file_size = os.path.getsize(final_path) / (1024 * 1024)  # MB
        print("\n" + "=" * 50)
        print(f"🎉 쇼츠 생성 완료!")
        print(f"📁 파일: {final_path}")
        print(f"⏱️  길이: {duration:.1f}초")
        print(f"📦 크기: {file_size:.1f}MB")
        print("=" * 50)
    else:
        print("❌ 영상 생성 실패")
        return None

    # 임시 파일 정리 (선택적)
    # for f in [audio_path, subtitle_path, bg_video_path, merged_path]:
    #     try:
    #         os.remove(f)
    #     except:
    #         pass

    return final_path


# 테스트 스크립트
TEST_SCRIPT = {
    "title": "AI로 월 100만원 버는 현실적인 방법",
    "hook": "ChatGPT로 돈 번다는 사람들, 진짜일까요?",
    "content": """ChatGPT로 돈 번다는 사람들, 진짜일까요?
저도 처음엔 믿지 않았습니다. 근데 직접 해보니까 진짜였어요.

첫 번째, AI 썸네일 제작. Canva에서 AI로 썸네일 만들어서 크몽에 올리세요. 건당 5천원, 하루 10개면 5만원입니다.

두 번째, AI 블로그 글 대필. ChatGPT로 초안 잡고 다듬으면 끝. 글 하나에 2만원, 하루 3개면 6만원.

세 번째, AI 번역 서비스. DeepL이랑 ChatGPT 조합하면 전문 번역가 수준 나옵니다. A4 한 장에 1만원.

이 세 가지만 해도 월 100만원은 현실적인 목표입니다. 중요한 건 시작하는 겁니다.

더 자세한 방법이 궁금하면 팔로우 해두세요.""",
    "hashtags": ["#AI부업", "#ChatGPT", "#월100만원", "#재테크", "#쇼츠"]
}


if __name__ == "__main__":
    print("🚀 YouTube Shorts 자동 생성기")
    print("=" * 50)

    # 테스트 실행
    result = asyncio.run(create_short(TEST_SCRIPT, voice_type="male"))
    if result:
        print(f"\n✅ 생성된 파일: {result}")
        print("\n💡 파일을 열어서 확인하세요:")
        print(f"   open {result}")
