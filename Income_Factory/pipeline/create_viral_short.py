#!/usr/bin/env python3
"""
바이럴 쇼츠 생성기 - 놀라운 사실/교양 콘텐츠
"""

import asyncio
import os
from pathlib import Path
from datetime import datetime

import edge_tts
from moviepy import ColorClip, AudioFileClip, ImageClip, CompositeVideoClip
from PIL import Image, ImageDraw, ImageFont
import numpy as np

# 설정
PIPELINE_DIR = Path(__file__).parent
TEMP_DIR = PIPELINE_DIR / "temp"
OUTPUT_DIR = PIPELINE_DIR / "output"

for d in [TEMP_DIR, OUTPUT_DIR]:
    d.mkdir(exist_ok=True)

FONT_PATH = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

# 더 자연스러운 Hyunsu 음성 사용
VOICE = "ko-KR-HyunsuMultilingualNeural"


class ViralShortsCreator:
    def __init__(self):
        self.word_timings = []

    async def create_audio(self, text: str, path: str):
        """자연스러운 TTS 생성 - 속도/피치 조절"""
        # rate: -10% ~ +10%, pitch: -10Hz ~ +10Hz
        comm = edge_tts.Communicate(
            text,
            VOICE,
            rate="-3%",   # 약간 느리게 (더 또렷하게)
            pitch="-1Hz"  # 약간 낮게 (더 신뢰감 있게)
        )

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

    def create_text_image(self, text: str, size=(1080, 250), font_size=52) -> np.ndarray:
        """한글 자막 이미지 - 더 크고 선명하게"""
        img = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        try:
            font = ImageFont.truetype(FONT_PATH, font_size)
        except:
            font = ImageFont.load_default()

        # 줄바꿈 처리
        display_text = text
        if len(text) > 18:
            mid = len(text) // 2
            # 공백이나 조사 기준으로 자르기
            for i in range(mid, min(mid + 8, len(text))):
                if text[i] in ' ,을를이가은는에서':
                    display_text = text[:i+1].strip() + "\n" + text[i+1:].strip()
                    break
            else:
                space = text.rfind(' ', 0, mid + 5)
                if space > 3:
                    display_text = text[:space] + "\n" + text[space+1:]

        bbox = draw.textbbox((0, 0), display_text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]

        x = (size[0] - text_w) // 2
        y = (size[1] - text_h) // 2

        # 더 두꺼운 외곽선
        for dx in range(-4, 5):
            for dy in range(-4, 5):
                if dx != 0 or dy != 0:
                    draw.text((x + dx, y + dy), display_text, font=font, fill=(0, 0, 0, 255))

        # 흰색 텍스트
        draw.text((x, y), display_text, font=font, fill=(255, 255, 255, 255))

        return np.array(img)

    def create_video(self, audio_path: str, text: str, output_path: str):
        audio = AudioFileClip(audio_path)
        duration = audio.duration

        # 더 어두운 배경 (집중도 향상)
        bg = ColorClip(size=(1080, 1920), color=(15, 15, 25), duration=duration)

        sentences = self.split_sentences(text)
        timings = self.calc_timings(sentences, duration)

        subtitle_clips = []
        for sent, start, end in timings:
            try:
                text_img = self.create_text_image(sent)
                txt_clip = (
                    ImageClip(text_img)
                    .with_start(start)
                    .with_end(end)
                    .with_position(("center", 1350))
                )
                subtitle_clips.append(txt_clip)
            except Exception as e:
                print(f"자막 오류: {e}")
                continue

        video = CompositeVideoClip([bg] + subtitle_clips)
        video = video.with_audio(audio)

        print("🎬 렌더링 중...")
        video.write_videofile(
            output_path,
            fps=30,
            codec='libx264',
            audio_codec='aac',
            logger=None
        )

        audio.close()
        video.close()
        return output_path


# 실제 바이럴 가능한 스크립트들
VIRAL_SCRIPTS = [
    {
        "title": "뇌가 당신을 속이는 방법",
        "content": """지금 이 영상을 보는 당신의 뇌는 당신을 속이고 있습니다.

우리 뇌는 매 초 1100만 개의 정보를 받아들이지만, 의식적으로 처리하는 건 고작 50개뿐입니다.

나머지는요?

뇌가 알아서 삭제하거나 조작해버립니다.

예를 들어 코는 항상 시야에 보이지만 뇌가 무시해버리죠.

더 무서운 건 기억도 조작된다는 겁니다.

당신이 확신하는 어린 시절 기억 중 40퍼센트는 실제로 일어나지 않았을 수 있습니다.

뇌가 만들어낸 가짜 기억이죠.

이게 무섭다면 팔로우 눌러두세요.""",
        "hashtags": ["#뇌과학", "#심리학", "#쇼츠", "#놀라운사실"]
    },
    {
        "title": "잠들기 직전 몸이 떨리는 이유",
        "content": """잠들기 직전에 갑자기 떨어지는 느낌 받아본 적 있죠?

이건 입면경련이라고 합니다.

근데 왜 이런 일이 생길까요?

과학자들도 정확한 이유를 모릅니다.

가장 유력한 가설은 이겁니다.

뇌가 잠들면서 근육이 이완되는데, 이걸 죽어가는 것으로 착각한다는 거죠.

그래서 뇌가 급하게 근육에 신호를 보내서 깨우는 겁니다.

당신의 뇌가 당신을 살리려고 한 거예요.

이런 사실 더 알고 싶으면 팔로우 해두세요.""",
        "hashtags": ["#수면", "#과학", "#쇼츠", "#신기한사실"]
    },
    {
        "title": "우주에서 가장 무서운 소리",
        "content": """나사가 공개한 우주의 소리를 들어보셨나요?

우주는 진공이라 소리가 안 들린다고 배웠죠?

그건 반만 맞습니다.

블랙홀 주변의 가스 파동을 소리로 변환하면 이런 소리가 납니다.

57옥타브나 낮춰야 인간이 들을 수 있는 소리예요.

들어본 사람들은 이렇게 말합니다.

지옥의 울부짖음 같다고요.

더 무서운 건 이 소리가 수십억 년 동안 계속 울리고 있다는 겁니다.

소름 돋았으면 팔로우 눌러주세요.""",
        "hashtags": ["#우주", "#나사", "#쇼츠", "#소름"]
    }
]


async def create_viral_short(script_idx: int = 0) -> str:
    """바이럴 쇼츠 생성"""
    creator = ViralShortsCreator()
    script = VIRAL_SCRIPTS[script_idx]
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    audio_path = str(TEMP_DIR / f"audio_{ts}.mp3")
    output_path = str(OUTPUT_DIR / f"viral_{ts}.mp4")

    print("\n" + "=" * 50)
    print(f"🎬 {script['title']}")
    print("=" * 50)

    print("\n[1/2] 음성 생성 중...")
    await creator.create_audio(script["content"], audio_path)

    audio = AudioFileClip(audio_path)
    dur = audio.duration
    audio.close()
    print(f"✅ 음성 생성 완료 ({dur:.1f}초)")

    print("\n[2/2] 영상 합성 중...")
    creator.create_video(audio_path, script["content"], output_path)

    if os.path.exists(output_path):
        size = os.path.getsize(output_path) / (1024 * 1024)
        print("\n" + "=" * 50)
        print("🎉 완료!")
        print(f"📁 {output_path}")
        print(f"⏱️ {dur:.1f}초 | 📦 {size:.1f}MB")
        print(f"🏷️ {' '.join(script['hashtags'])}")
        print("=" * 50)

        os.remove(audio_path)
        return output_path

    return None


if __name__ == "__main__":
    import sys

    print("🚀 바이럴 쇼츠 생성기")
    print("\n사용 가능한 스크립트:")
    for i, s in enumerate(VIRAL_SCRIPTS):
        print(f"  {i}: {s['title']}")

    idx = int(sys.argv[1]) if len(sys.argv) > 1 else 0

    result = asyncio.run(create_viral_short(idx))
    if result:
        print(f"\n💡 열기: open \"{result}\"")
