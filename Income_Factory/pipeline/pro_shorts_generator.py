#!/usr/bin/env python3
"""
프로 쇼츠 생성기 v2.0
- HuggingFace SDXL로 스크립트 맞춤 이미지 생성
- Ken Burns 애니메이션
- 고품질 TTS + 자막
"""

import asyncio
import os
import requests
import random
from pathlib import Path
from datetime import datetime
from io import BytesIO

import edge_tts
from moviepy import (
    ColorClip, AudioFileClip, ImageClip,
    CompositeVideoClip, VideoClip, concatenate_videoclips
)
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import numpy as np

# ============ 설정 ============
PIPELINE_DIR = Path(__file__).parent
TEMP_DIR = PIPELINE_DIR / "temp"
OUTPUT_DIR = PIPELINE_DIR / "output"
IMAGES_DIR = TEMP_DIR / "images"

for d in [TEMP_DIR, OUTPUT_DIR, IMAGES_DIR]:
    d.mkdir(exist_ok=True)

# API 설정
HF_TOKEN = os.getenv("HF_TOKEN")
HF_API_URL = "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0"

# 폰트
FONT_PATH = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

# TTS
VOICE = "ko-KR-HyunsuMultilingualNeural"


# ============ 이미지 생성 ============
class ImageGenerator:
    """HuggingFace API로 이미지 생성"""

    def __init__(self):
        self.headers = {"Authorization": f"Bearer {HF_TOKEN}"}
        self.style_suffix = ", digital art, cinematic lighting, dark atmospheric background, highly detailed, 4k, trending on artstation"

    def sentence_to_prompt(self, sentence: str, context: str = "") -> str:
        """한국어 문장을 영어 이미지 프롬프트로 변환"""
        # 키워드 매핑
        keyword_map = {
            # 뇌/의식 관련
            "뇌": "glowing human brain with neural connections",
            "의식": "consciousness visualization, abstract mind",
            "기억": "memory fragments floating, ethereal memories",
            "생각": "thought bubbles, mental visualization",
            "정보": "data streams, digital information flow",

            # 감각 관련
            "눈": "human eye closeup, detailed iris",
            "코": "human nose, face detail",
            "시야": "field of vision, perspective view",
            "보이": "visible, seeing, vision",

            # 숫자/데이터
            "1100만": "millions of data points, particle swarm",
            "50개": "fifty glowing orbs",
            "40퍼센트": "percentage visualization, pie chart",
            "숫자": "floating numbers, digital digits",

            # 행동/상태
            "삭제": "erasing, fading away, disappearing",
            "조작": "manipulation, distortion effect",
            "무시": "ignoring, filtering out",
            "속이": "deception, illusion, trick",

            # 감정/분위기
            "무서운": "scary, ominous atmosphere",
            "가짜": "fake, artificial, synthetic",
            "진짜": "real, authentic, genuine",

            # 기본
            "당신": "silhouette of a person",
            "사람": "human figure",
        }

        # 문장에서 키워드 찾기
        found_keywords = []
        for kr, en in keyword_map.items():
            if kr in sentence:
                found_keywords.append(en)

        if found_keywords:
            base_prompt = ", ".join(found_keywords[:3])  # 최대 3개
        else:
            # 기본 프롬프트
            base_prompt = "abstract concept visualization, mysterious atmosphere"

        return base_prompt + self.style_suffix

    def generate_image(self, prompt: str, output_path: str,
                       width: int = 1024, height: int = 1024) -> str:
        """이미지 생성"""
        print(f"  🎨 생성 중: {prompt[:50]}...")

        response = requests.post(
            HF_API_URL,
            headers=self.headers,
            json={"inputs": prompt},
            timeout=120
        )

        if response.status_code == 200 and 'image' in response.headers.get('content-type', ''):
            img = Image.open(BytesIO(response.content))

            # 세로 비율로 크롭 (9:16)
            img = self._crop_to_vertical(img)

            # 저장
            img.save(output_path)
            return output_path
        else:
            print(f"  ❌ 이미지 생성 실패: {response.status_code}")
            return None

    def _crop_to_vertical(self, img: Image.Image) -> Image.Image:
        """9:16 세로 비율로 크롭"""
        w, h = img.size
        target_ratio = 9 / 16
        current_ratio = w / h

        if current_ratio > target_ratio:
            # 너비가 더 넓음 -> 좌우 크롭
            new_w = int(h * target_ratio)
            left = (w - new_w) // 2
            img = img.crop((left, 0, left + new_w, h))
        else:
            # 높이가 더 높음 -> 상하 크롭
            new_h = int(w / target_ratio)
            top = (h - new_h) // 2
            img = img.crop((0, top, w, top + new_h))

        # 1080x1920으로 리사이즈
        img = img.resize((1080, 1920), Image.Resampling.LANCZOS)
        return img


# ============ 비디오 생성 ============
class ProShortsCreator:
    """프로 쇼츠 생성기"""

    def __init__(self):
        self.img_gen = ImageGenerator()
        self.word_timings = []

    async def create_audio(self, text: str, path: str):
        """TTS 생성"""
        comm = edge_tts.Communicate(text, VOICE, rate="-5%", pitch="-2Hz")
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
        """문장별 타이밍"""
        if not self.word_timings:
            per = duration / len(sentences)
            return [(s, i*per, (i+1)*per) for i, s in enumerate(sentences)]

        result = []
        idx = 0
        for sent in sentences:
            words = len(sent.split())
            start = self.word_timings[idx]["start"] if idx < len(self.word_timings) else (result[-1][2] if result else 0)
            end_idx = min(idx + words - 1, len(self.word_timings) - 1)
            end = self.word_timings[end_idx]["start"] + self.word_timings[end_idx]["duration"] + 0.3 if end_idx >= 0 else start + 3
            idx += words
            result.append((sent, start, min(end, duration)))

        return result

    def apply_ken_burns(self, img_array: np.ndarray, duration: float,
                        effect_type: str = "zoom_in") -> VideoClip:
        """Ken Burns 효과"""
        h, w = img_array.shape[:2]
        pil_img = Image.fromarray(img_array)

        def make_frame(t):
            progress = t / duration if duration > 0 else 0

            if effect_type == "zoom_in":
                scale = 1.0 + 0.15 * progress
                offset_x = 0
            elif effect_type == "zoom_out":
                scale = 1.15 - 0.15 * progress
                offset_x = 0
            elif effect_type == "pan_left":
                scale = 1.1
                offset_x = int(w * 0.08 * (1 - progress))
            elif effect_type == "pan_right":
                scale = 1.1
                offset_x = int(w * 0.08 * progress)
            else:
                scale = 1.0 + 0.1 * progress
                offset_x = 0

            new_w = int(w * scale)
            new_h = int(h * scale)

            resized = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

            left = (new_w - w) // 2 + offset_x
            top = (new_h - h) // 2
            left = max(0, min(left, new_w - w))
            top = max(0, min(top, new_h - h))

            cropped = resized.crop((left, top, left + w, top + h))
            return np.array(cropped)

        return VideoClip(make_frame, duration=duration)

    def create_subtitle_image(self, text: str, size=(1080, 200)) -> np.ndarray:
        """자막 이미지 생성"""
        img = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        try:
            font = ImageFont.truetype(FONT_PATH, 52)
        except:
            font = ImageFont.load_default()

        # 줄바꿈
        display_text = text
        if len(text) > 18:
            mid = len(text) // 2
            for i in range(mid, min(mid + 8, len(text))):
                if text[i] in ' ,을를이가은는에서도':
                    display_text = text[:i+1].strip() + "\n" + text[i+1:].strip()
                    break

        bbox = draw.textbbox((0, 0), display_text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        x = (size[0] - text_w) // 2
        y = (size[1] - text_h) // 2

        # 그림자/외곽선
        for dx in range(-4, 5):
            for dy in range(-4, 5):
                if dx != 0 or dy != 0:
                    draw.text((x + dx, y + dy), display_text, font=font, fill=(0, 0, 0, 255))

        draw.text((x, y), display_text, font=font, fill=(255, 255, 255, 255))
        return np.array(img)

    def create_video(self, audio_path: str, script: str, output_path: str):
        """영상 생성"""
        audio = AudioFileClip(audio_path)
        duration = audio.duration

        sentences = self.split_sentences(script)
        timings = self.calc_timings(sentences, duration)

        print(f"\n📝 총 {len(sentences)}개 장면 생성")

        # 이미지 생성 (2-3개 문장마다 1개 이미지)
        scene_groups = []
        group_size = 2  # 2문장당 1이미지
        for i in range(0, len(sentences), group_size):
            group = sentences[i:i+group_size]
            scene_groups.append(group)

        print(f"🎨 {len(scene_groups)}개 이미지 생성 중...")

        images = []
        effects = ["zoom_in", "zoom_out", "pan_left", "pan_right"]

        for i, group in enumerate(scene_groups):
            combined_text = " ".join(group)
            prompt = self.img_gen.sentence_to_prompt(combined_text)

            img_path = str(IMAGES_DIR / f"scene_{i}.png")
            result = self.img_gen.generate_image(prompt, img_path)

            if result:
                images.append(img_path)
            else:
                # 실패시 이전 이미지 재사용 또는 기본 배경
                if images:
                    images.append(images[-1])
                else:
                    # 기본 검정 배경
                    black = Image.new('RGB', (1080, 1920), (20, 20, 30))
                    black.save(img_path)
                    images.append(img_path)

        # 비디오 클립 생성
        print("\n🎬 영상 합성 중...")
        clips = []

        for i, (sent, start, end) in enumerate(timings):
            scene_duration = end - start
            if scene_duration <= 0:
                continue

            # 해당 문장의 이미지 선택
            img_idx = min(i // group_size, len(images) - 1)
            img = Image.open(images[img_idx])
            img_array = np.array(img)

            # Ken Burns 효과
            effect = effects[i % len(effects)]
            scene_clip = self.apply_ken_burns(img_array, scene_duration, effect)
            scene_clip = scene_clip.with_start(start)
            clips.append(scene_clip)

            # 자막
            sub_img = self.create_subtitle_image(sent)
            sub_clip = (
                ImageClip(sub_img)
                .with_start(start)
                .with_duration(scene_duration)
                .with_position(("center", 1400))
            )
            clips.append(sub_clip)

        # 합성
        video = CompositeVideoClip(clips, size=(1080, 1920))
        video = video.with_audio(audio)

        print("💾 렌더링 중...")
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


# ============ 스크립트 ============
VIRAL_SCRIPT = {
    "title": "뇌가 당신을 속이는 방법",
    "content": """지금 이 영상을 보는 당신의 뇌는 당신을 속이고 있습니다.

우리 뇌는 매 초 1100만 개의 정보를 받아들이지만, 의식적으로 처리하는 건 고작 50개뿐입니다.

나머지는요?

뇌가 알아서 삭제하거나 조작해버립니다.

예를 들어 코는 항상 시야에 보이지만 뇌가 무시해버리죠.

더 무서운 건 기억도 조작된다는 겁니다.

당신이 확신하는 어린 시절 기억 중 40퍼센트는 실제로 일어나지 않았을 수 있습니다.

뇌가 만들어낸 가짜 기억이죠.

이게 무섭다면 팔로우 눌러두세요."""
}


async def create_pro_short():
    """메인 함수"""
    creator = ProShortsCreator()
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    audio_path = str(TEMP_DIR / f"audio_{ts}.mp3")
    output_path = str(OUTPUT_DIR / f"pro_short_{ts}.mp4")

    print("\n" + "=" * 60)
    print(f"🎬 프로 쇼츠 생성: {VIRAL_SCRIPT['title']}")
    print("=" * 60)

    # 1. 음성 생성
    print("\n[1/3] 🎤 음성 생성 중...")
    await creator.create_audio(VIRAL_SCRIPT["content"], audio_path)

    audio = AudioFileClip(audio_path)
    dur = audio.duration
    audio.close()
    print(f"✅ 음성 완료 ({dur:.1f}초)")

    # 2. 영상 생성
    print("\n[2/3] 🎨 이미지 & 영상 생성 중...")
    creator.create_video(audio_path, VIRAL_SCRIPT["content"], output_path)

    # 3. 결과
    if os.path.exists(output_path):
        size = os.path.getsize(output_path) / (1024 * 1024)
        print("\n" + "=" * 60)
        print("🎉 완료!")
        print(f"📁 {output_path}")
        print(f"⏱️ {dur:.1f}초 | 📦 {size:.1f}MB")
        print("=" * 60)

        # 정리
        os.remove(audio_path)
        return output_path

    return None


if __name__ == "__main__":
    print("🚀 프로 쇼츠 생성기 v2.0")
    result = asyncio.run(create_pro_short())
    if result:
        print(f"\n💡 열기: open \"{result}\"")
