#!/usr/bin/env python3
"""
YouTube Shorts 자동 생성기 (MoviePy 2.x 버전)
"""

import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime

# 의존성
try:
    import edge_tts
    from moviepy import (
        ColorClip, AudioFileClip, ImageClip, CompositeVideoClip
    )
    from PIL import Image, ImageDraw, ImageFont
    import numpy as np
except ImportError:
    print("의존성 설치 중...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install",
                   "edge-tts", "moviepy", "pillow", "numpy", "-q"])
    import edge_tts
    from moviepy import (
        ColorClip, AudioFileClip, ImageClip, CompositeVideoClip
    )
    from PIL import Image, ImageDraw, ImageFont
    import numpy as np

# 설정
PIPELINE_DIR = Path(__file__).parent
TEMP_DIR = PIPELINE_DIR / "temp"
OUTPUT_DIR = PIPELINE_DIR / "output"

for d in [TEMP_DIR, OUTPUT_DIR]:
    d.mkdir(exist_ok=True)

# 한글 폰트
FONT_PATH = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

# 음성 옵션
VOICES = {
    "male": "ko-KR-InJoonNeural",
    "female": "ko-KR-SunHiNeural",
}


class ShortsCreator:
    def __init__(self, voice="male"):
        self.voice = VOICES.get(voice, VOICES["male"])
        self.word_timings = []

    async def create_audio(self, text: str, path: str):
        """TTS 음성 생성"""
        comm = edge_tts.Communicate(text, self.voice)
        self.word_timings = []
        audio_data = b""

        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
            elif chunk["type"] == "WordBoundary":
                self.word_timings.append({
                    "text": chunk["text"],
                    "start": chunk["offset"] / 10_000_000,
                    "duration": chunk["duration"] / 10_000_000
                })

        with open(path, "wb") as f:
            f.write(audio_data)

        return path

    def split_sentences(self, text: str) -> list:
        """문장 분리"""
        result = []
        current = ""
        for c in text:
            current += c
            if c in ".!?":
                if current.strip():
                    result.append(current.strip())
                current = ""
        if current.strip():
            result.append(current.strip())
        return result

    def calc_timings(self, sentences: list, duration: float) -> list:
        """문장별 타이밍 계산"""
        if not self.word_timings:
            per = duration / len(sentences)
            return [(s, i*per, (i+1)*per) for i, s in enumerate(sentences)]

        result = []
        idx = 0
        for sent in sentences:
            words = len(sent.split())
            start = self.word_timings[idx]["start"] if idx < len(self.word_timings) else (result[-1][2] if result else 0)
            end_idx = min(idx + words - 1, len(self.word_timings) - 1)
            end = self.word_timings[end_idx]["start"] + self.word_timings[end_idx]["duration"] + 0.5 if end_idx >= 0 else start + 3
            idx += words
            result.append((sent, start, min(end, duration)))
        return result

    def create_text_image(self, text: str, size=(1080, 200)) -> np.ndarray:
        """PIL로 한글 텍스트 이미지 생성"""
        img = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # 폰트 로드
        try:
            font = ImageFont.truetype(FONT_PATH, 48)
        except:
            font = ImageFont.load_default()

        # 텍스트 줄바꿈
        display_text = text
        if len(text) > 20:
            mid = len(text) // 2
            space = text.rfind(' ', 0, mid + 10)
            if space > 0:
                display_text = text[:space] + "\n" + text[space+1:]

        # 텍스트 크기 계산
        bbox = draw.textbbox((0, 0), display_text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]

        # 중앙 정렬
        x = (size[0] - text_w) // 2
        y = (size[1] - text_h) // 2

        # 외곽선 (검정색)
        for dx in [-3, 0, 3]:
            for dy in [-3, 0, 3]:
                if dx != 0 or dy != 0:
                    draw.text((x + dx, y + dy), display_text, font=font, fill=(0, 0, 0, 255))

        # 메인 텍스트 (흰색)
        draw.text((x, y), display_text, font=font, fill=(255, 255, 255, 255))

        return np.array(img)

    def create_video(self, audio_path: str, text: str, output_path: str):
        """영상 생성"""
        # 오디오 로드
        audio = AudioFileClip(audio_path)
        duration = audio.duration

        # 배경 (세로 1080x1920, 진한 남색)
        bg = ColorClip(size=(1080, 1920), color=(26, 26, 46), duration=duration)

        # 문장 파싱 및 타이밍
        sentences = self.split_sentences(text)
        timings = self.calc_timings(sentences, duration)

        # 자막 클립 생성
        subtitle_clips = []
        for sent, start, end in timings:
            try:
                # PIL로 텍스트 이미지 생성
                text_img = self.create_text_image(sent)

                # ImageClip으로 변환
                txt_clip = (
                    ImageClip(text_img)
                    .with_start(start)
                    .with_end(end)
                    .with_position(("center", 1400))
                )
                subtitle_clips.append(txt_clip)
            except Exception as e:
                print(f"자막 오류: {e}")
                continue

        # 합성
        all_clips = [bg] + subtitle_clips
        video = CompositeVideoClip(all_clips)
        video = video.with_audio(audio)

        # 출력
        print("🎬 영상 렌더링 중... (30초~1분 소요)")
        video.write_videofile(
            output_path,
            fps=30,
            codec='libx264',
            audio_codec='aac',
            logger=None
        )

        # 정리
        audio.close()
        video.close()

        return output_path


async def create_short(script: dict, voice: str = "male") -> str:
    """메인 함수"""
    creator = ShortsCreator(voice)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    audio_path = str(TEMP_DIR / f"audio_{ts}.mp3")
    output_path = str(OUTPUT_DIR / f"short_{ts}.mp4")

    print("\n" + "=" * 50)
    print(f"🎬 {script['title']}")
    print("=" * 50)

    # 1. 음성 생성
    print("\n[1/2] 음성 생성 중...")
    await creator.create_audio(script["content"], audio_path)
    print("✅ 음성 생성 완료")

    # 2. 영상 생성
    print("\n[2/2] 영상 합성 중...")
    creator.create_video(audio_path, script["content"], output_path)

    # 결과
    if os.path.exists(output_path):
        size = os.path.getsize(output_path) / (1024 * 1024)
        audio_check = AudioFileClip(audio_path)
        dur = audio_check.duration
        audio_check.close()

        print("\n" + "=" * 50)
        print("🎉 완료!")
        print(f"📁 {output_path}")
        print(f"⏱️ {dur:.1f}초 | 📦 {size:.1f}MB")
        print("=" * 50)

        # 임시 파일 정리
        try:
            os.remove(audio_path)
        except:
            pass

        return output_path

    return None


# 테스트 스크립트
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
하루 3개면 6만원이죠.

세번째 AI 번역 서비스.
전문가 수준 번역이 가능합니다.

이 세가지만 해도 월 100만원은 현실적입니다.
중요한 건 시작하는 겁니다.
팔로우 해두세요."""
}


if __name__ == "__main__":
    print("🚀 YouTube Shorts Generator")
    result = asyncio.run(create_short(SCRIPT))
    if result:
        print(f"\n💡 열기: open \"{result}\"")
