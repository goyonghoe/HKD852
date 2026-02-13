#!/usr/bin/env python3
"""
애니메이션 쇼츠 생성기
- 스크립트 기반 일러스트 이미지 자동 생성
- Ken Burns 효과 (확대/축소/팬)
- 자막 + 음성 합성
"""

import asyncio
import os
import math
import random
from pathlib import Path
from datetime import datetime

import edge_tts
from moviepy import (
    ColorClip, AudioFileClip, ImageClip,
    CompositeVideoClip, concatenate_videoclips, VideoClip
)
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

# 설정
PIPELINE_DIR = Path(__file__).parent
TEMP_DIR = PIPELINE_DIR / "temp"
OUTPUT_DIR = PIPELINE_DIR / "output"

for d in [TEMP_DIR, OUTPUT_DIR]:
    d.mkdir(exist_ok=True)

FONT_PATH = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
VOICE = "ko-KR-HyunsuMultilingualNeural"

# 색상 팔레트 (어둡고 신비로운 느낌)
COLORS = {
    "bg_dark": (15, 15, 30),
    "bg_purple": (30, 20, 50),
    "accent_blue": (70, 130, 220),
    "accent_cyan": (80, 200, 220),
    "accent_pink": (220, 100, 180),
    "accent_orange": (255, 150, 80),
    "white": (255, 255, 255),
    "gray": (100, 100, 120),
}


class IllustrationGenerator:
    """스크립트 키워드 기반 일러스트 생성"""

    def __init__(self, size=(1080, 1920)):
        self.size = size
        self.w, self.h = size

    def create_gradient_bg(self, color1, color2, direction="vertical"):
        """그라데이션 배경 생성"""
        img = Image.new('RGB', self.size)
        draw = ImageDraw.Draw(img)

        if direction == "vertical":
            for y in range(self.h):
                r = int(color1[0] + (color2[0] - color1[0]) * y / self.h)
                g = int(color1[1] + (color2[1] - color1[1]) * y / self.h)
                b = int(color1[2] + (color2[2] - color1[2]) * y / self.h)
                draw.line([(0, y), (self.w, y)], fill=(r, g, b))
        else:
            for x in range(self.w):
                r = int(color1[0] + (color2[0] - color1[0]) * x / self.w)
                g = int(color1[1] + (color2[1] - color1[1]) * x / self.w)
                b = int(color1[2] + (color2[2] - color1[2]) * x / self.w)
                draw.line([(x, 0), (x, self.h)], fill=(r, g, b))

        return img

    def draw_glow_circle(self, img, center, radius, color, glow_size=50):
        """글로우 효과가 있는 원"""
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        # 글로우 레이어들
        for i in range(glow_size, 0, -5):
            alpha = int(100 * (1 - i / glow_size))
            glow_color = (*color, alpha)
            draw.ellipse([
                center[0] - radius - i,
                center[1] - radius - i,
                center[0] + radius + i,
                center[1] + radius + i
            ], fill=glow_color)

        # 메인 원
        draw.ellipse([
            center[0] - radius,
            center[1] - radius,
            center[0] + radius,
            center[1] + radius
        ], fill=(*color, 255))

        return Image.alpha_composite(img.convert('RGBA'), overlay)

    def draw_brain(self, img, center, size, color):
        """간단한 뇌 형태 도형"""
        draw = ImageDraw.Draw(img)
        cx, cy = center

        # 뇌 형태를 원들로 표현
        # 좌뇌
        draw.ellipse([cx - size*0.8, cy - size*0.5, cx - size*0.1, cy + size*0.5],
                    fill=color, outline=COLORS["white"], width=3)
        # 우뇌
        draw.ellipse([cx + size*0.1, cy - size*0.5, cx + size*0.8, cy + size*0.5],
                    fill=color, outline=COLORS["white"], width=3)
        # 연결부
        draw.ellipse([cx - size*0.2, cy - size*0.2, cx + size*0.2, cy + size*0.2],
                    fill=color)

        # 신경 라인들
        for i in range(5):
            angle = random.uniform(0, 2 * math.pi)
            length = random.uniform(size * 0.3, size * 0.6)
            end_x = cx + math.cos(angle) * length
            end_y = cy + math.sin(angle) * length
            draw.line([(cx, cy), (end_x, end_y)], fill=COLORS["accent_cyan"], width=2)
            draw.ellipse([end_x - 5, end_y - 5, end_x + 5, end_y + 5],
                        fill=COLORS["accent_cyan"])

        return img

    def draw_eye(self, img, center, size, color):
        """눈 형태 (감시/인식 상징)"""
        draw = ImageDraw.Draw(img)
        cx, cy = center

        # 외곽 (눈 형태)
        draw.ellipse([cx - size, cy - size*0.5, cx + size, cy + size*0.5],
                    fill=COLORS["white"], outline=color, width=4)
        # 홍채
        draw.ellipse([cx - size*0.4, cy - size*0.4, cx + size*0.4, cy + size*0.4],
                    fill=color)
        # 동공
        draw.ellipse([cx - size*0.15, cy - size*0.15, cx + size*0.15, cy + size*0.15],
                    fill=COLORS["bg_dark"])
        # 하이라이트
        draw.ellipse([cx - size*0.3, cy - size*0.25, cx - size*0.1, cy - size*0.05],
                    fill=COLORS["white"])

        return img

    def draw_question_mark(self, img, center, size, color):
        """물음표 (의문/궁금증)"""
        draw = ImageDraw.Draw(img)
        cx, cy = center

        try:
            font = ImageFont.truetype(FONT_PATH, int(size * 1.5))
        except:
            font = ImageFont.load_default()

        # 글로우 효과
        for offset in range(10, 0, -2):
            alpha_color = (*color[:3], int(50 * offset / 10))
            draw.text((cx - size*0.3 + offset//2, cy - size*0.8), "?",
                     font=font, fill=color)

        draw.text((cx - size*0.3, cy - size*0.8), "?",
                 font=font, fill=COLORS["white"])

        return img

    def draw_particles(self, img, count=30, color=None):
        """떠다니는 입자 효과"""
        draw = ImageDraw.Draw(img)

        for _ in range(count):
            x = random.randint(0, self.w)
            y = random.randint(0, self.h)
            size = random.randint(2, 8)
            alpha = random.randint(50, 150)

            particle_color = color or random.choice([
                COLORS["accent_cyan"],
                COLORS["accent_blue"],
                COLORS["accent_pink"]
            ])

            draw.ellipse([x, y, x + size, y + size],
                        fill=(*particle_color, alpha))

        return img

    def draw_neural_network(self, img, center, size, color):
        """신경망 형태"""
        draw = ImageDraw.Draw(img)
        cx, cy = center

        # 노드들
        nodes = []
        layers = [3, 5, 5, 3]
        layer_x = cx - size

        for layer_size in layers:
            layer_nodes = []
            for i in range(layer_size):
                y = cy - (layer_size - 1) * size * 0.3 / 2 + i * size * 0.3
                layer_nodes.append((layer_x, y))
                draw.ellipse([layer_x - 10, y - 10, layer_x + 10, y + 10],
                            fill=color)
            nodes.append(layer_nodes)
            layer_x += size * 0.7

        # 연결선
        for i in range(len(nodes) - 1):
            for n1 in nodes[i]:
                for n2 in nodes[i + 1]:
                    draw.line([n1, n2], fill=(*color, 100), width=1)

        return img

    def draw_numbers(self, img, center, size):
        """떠다니는 숫자들 (데이터 상징)"""
        draw = ImageDraw.Draw(img)
        cx, cy = center

        try:
            font = ImageFont.truetype(FONT_PATH, 30)
        except:
            font = ImageFont.load_default()

        numbers = "1100만 50 40% 0 1"
        for i, num in enumerate(numbers.split()):
            x = cx + random.randint(-int(size), int(size))
            y = cy + random.randint(-int(size), int(size))
            color = random.choice([COLORS["accent_cyan"], COLORS["accent_blue"], COLORS["gray"]])
            draw.text((x, y), num, font=font, fill=color)

        return img

    def generate_scene(self, scene_type: str, keyword: str = "") -> Image.Image:
        """장면 타입에 따른 이미지 생성"""

        # 기본 그라데이션 배경
        if scene_type == "brain":
            bg = self.create_gradient_bg(COLORS["bg_dark"], COLORS["bg_purple"])
            bg = bg.convert('RGBA')
            bg = self.draw_brain(bg, (self.w//2, self.h//2 - 200), 250, COLORS["accent_blue"])
            bg = self.draw_particles(bg, 40)

        elif scene_type == "eye":
            bg = self.create_gradient_bg(COLORS["bg_purple"], COLORS["bg_dark"])
            bg = bg.convert('RGBA')
            bg = self.draw_eye(bg, (self.w//2, self.h//2 - 200), 200, COLORS["accent_cyan"])
            bg = self.draw_particles(bg, 30, COLORS["accent_cyan"])

        elif scene_type == "question":
            bg = self.create_gradient_bg(COLORS["bg_dark"], (40, 30, 60))
            bg = bg.convert('RGBA')
            bg = self.draw_question_mark(bg, (self.w//2, self.h//2 - 200), 150, COLORS["accent_pink"])
            bg = self.draw_particles(bg, 25)

        elif scene_type == "neural":
            bg = self.create_gradient_bg((20, 20, 40), COLORS["bg_dark"])
            bg = bg.convert('RGBA')
            bg = self.draw_neural_network(bg, (self.w//2, self.h//2 - 200), 300, COLORS["accent_cyan"])
            bg = self.draw_particles(bg, 35)

        elif scene_type == "data":
            bg = self.create_gradient_bg(COLORS["bg_dark"], COLORS["bg_purple"])
            bg = bg.convert('RGBA')
            bg = self.draw_numbers(bg, (self.w//2, self.h//2 - 200), 300)
            bg = self.draw_particles(bg, 50, COLORS["accent_blue"])

        elif scene_type == "memory":
            bg = self.create_gradient_bg((30, 25, 50), COLORS["bg_dark"])
            bg = bg.convert('RGBA')
            # 흐릿한 원들 (기억 조각)
            for _ in range(5):
                x = random.randint(200, self.w - 200)
                y = random.randint(300, self.h - 800)
                bg = self.draw_glow_circle(bg, (x, y), random.randint(50, 100),
                                          COLORS["accent_pink"], glow_size=80)
            bg = self.draw_particles(bg, 20)

        else:  # default
            bg = self.create_gradient_bg(COLORS["bg_dark"], COLORS["bg_purple"])
            bg = bg.convert('RGBA')
            bg = self.draw_particles(bg, 30)

        return bg


class AnimatedShortsCreator:
    """애니메이션 쇼츠 생성기"""

    def __init__(self):
        self.illustrator = IllustrationGenerator()
        self.word_timings = []

    async def create_audio(self, text: str, path: str):
        """TTS 생성"""
        comm = edge_tts.Communicate(text, VOICE, rate="-3%", pitch="-1Hz")
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

    def analyze_script(self, text: str) -> list:
        """스크립트 분석하여 장면 타입 결정"""
        sentences = []
        current = ""
        for c in text:
            current += c
            if c in ".!?":
                if current.strip():
                    sentences.append(current.strip())
                current = ""
        if current.strip():
            sentences.append(current.strip())

        # 키워드 기반 장면 타입 매핑
        scene_types = []
        for sent in sentences:
            sent_lower = sent.lower()
            if any(w in sent_lower for w in ["뇌", "brain", "의식"]):
                scene_types.append("brain")
            elif any(w in sent_lower for w in ["정보", "데이터", "숫자", "개"]):
                scene_types.append("data")
            elif any(w in sent_lower for w in ["삭제", "조작", "무시"]):
                scene_types.append("neural")
            elif any(w in sent_lower for w in ["코", "시야", "보이"]):
                scene_types.append("eye")
            elif any(w in sent_lower for w in ["기억", "어린", "가짜"]):
                scene_types.append("memory")
            elif any(w in sent_lower for w in ["?", "무섭", "왜"]):
                scene_types.append("question")
            else:
                # 이전 장면과 다른 타입 선택
                prev = scene_types[-1] if scene_types else "brain"
                options = ["brain", "neural", "data", "eye", "question", "memory"]
                options.remove(prev) if prev in options else None
                scene_types.append(random.choice(options))

        return list(zip(sentences, scene_types))

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
            end = self.word_timings[end_idx]["start"] + self.word_timings[end_idx]["duration"] + 0.3 if end_idx >= 0 else start + 3
            idx += words
            result.append((sent, start, min(end, duration)))

        return result

    def apply_ken_burns(self, img_array: np.ndarray, duration: float,
                        effect_type: str = "zoom_in") -> VideoClip:
        """Ken Burns 효과 적용"""
        h, w = img_array.shape[:2]
        pil_img = Image.fromarray(img_array)

        def make_frame(t):
            progress = t / duration if duration > 0 else 0

            if effect_type == "zoom_in":
                scale = 1.0 + 0.2 * progress
                offset_x = 0
            elif effect_type == "zoom_out":
                scale = 1.2 - 0.2 * progress
                offset_x = 0
            elif effect_type == "pan_left":
                scale = 1.15
                offset_x = int(w * 0.1 * (1 - progress))
            elif effect_type == "pan_right":
                scale = 1.15
                offset_x = int(w * 0.1 * progress)
            else:
                scale = 1.0 + 0.15 * progress
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

    def create_subtitle_clip(self, text: str, duration: float, size=(1080, 200)) -> ImageClip:
        """자막 클립 생성"""
        img = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        try:
            font = ImageFont.truetype(FONT_PATH, 50)
        except:
            font = ImageFont.load_default()

        # 줄바꿈
        display_text = text
        if len(text) > 18:
            mid = len(text) // 2
            for i in range(mid, min(mid + 8, len(text))):
                if text[i] in ' ,을를이가은는에서':
                    display_text = text[:i+1].strip() + "\n" + text[i+1:].strip()
                    break

        bbox = draw.textbbox((0, 0), display_text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        x = (size[0] - text_w) // 2
        y = (size[1] - text_h) // 2

        # 외곽선
        for dx in range(-4, 5):
            for dy in range(-4, 5):
                if dx != 0 or dy != 0:
                    draw.text((x + dx, y + dy), display_text, font=font, fill=(0, 0, 0, 255))

        draw.text((x, y), display_text, font=font, fill=(255, 255, 255, 255))

        return ImageClip(np.array(img), duration=duration)

    def create_video(self, audio_path: str, script: str, output_path: str):
        """애니메이션 영상 생성"""
        audio = AudioFileClip(audio_path)
        duration = audio.duration

        # 스크립트 분석
        scenes = self.analyze_script(script)
        sentences = [s[0] for s in scenes]
        scene_types = [s[1] for s in scenes]

        # 타이밍 계산
        timings = self.calc_timings(sentences, duration)

        # 장면별 클립 생성
        clips = []
        effects = ["zoom_in", "zoom_out", "pan_left", "pan_right"]

        for i, ((sent, start, end), scene_type) in enumerate(zip(timings, scene_types)):
            scene_duration = end - start
            if scene_duration <= 0:
                continue

            # 일러스트 생성
            print(f"  장면 {i+1}/{len(timings)}: {scene_type}")
            img = self.illustrator.generate_scene(scene_type)
            img_array = np.array(img.convert('RGB'))

            # Ken Burns 효과 적용
            effect = effects[i % len(effects)]
            scene_clip = self.apply_ken_burns(img_array, scene_duration, effect)
            scene_clip = scene_clip.with_start(start)

            # 자막 클립
            sub_clip = (
                self.create_subtitle_clip(sent, scene_duration)
                .with_start(start)
                .with_position(("center", 1400))
            )

            clips.append(scene_clip)
            clips.append(sub_clip)

        # 합성
        print("  영상 합성 중...")
        video = CompositeVideoClip(clips, size=(1080, 1920))
        video = video.with_audio(audio)

        print("  렌더링 중...")
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


# 바이럴 스크립트
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


async def create_animated_short():
    """메인 함수"""
    creator = AnimatedShortsCreator()
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    audio_path = str(TEMP_DIR / f"audio_{ts}.mp3")
    output_path = str(OUTPUT_DIR / f"animated_{ts}.mp4")

    print("\n" + "=" * 50)
    print(f"🎬 {VIRAL_SCRIPT['title']}")
    print("=" * 50)

    print("\n[1/3] 음성 생성 중...")
    await creator.create_audio(VIRAL_SCRIPT["content"], audio_path)

    audio = AudioFileClip(audio_path)
    dur = audio.duration
    audio.close()
    print(f"✅ 음성 완료 ({dur:.1f}초)")

    print("\n[2/3] 장면 생성 중...")

    print("\n[3/3] 영상 합성 중...")
    creator.create_video(audio_path, VIRAL_SCRIPT["content"], output_path)

    if os.path.exists(output_path):
        size = os.path.getsize(output_path) / (1024 * 1024)
        print("\n" + "=" * 50)
        print("🎉 완료!")
        print(f"📁 {output_path}")
        print(f"⏱️ {dur:.1f}초 | 📦 {size:.1f}MB")
        print("=" * 50)

        os.remove(audio_path)
        return output_path

    return None


if __name__ == "__main__":
    print("🚀 애니메이션 쇼츠 생성기")
    result = asyncio.run(create_animated_short())
    if result:
        print(f"\n💡 열기: open \"{result}\"")
