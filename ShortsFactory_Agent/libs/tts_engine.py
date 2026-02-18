#!/usr/bin/env python3
"""
다국어 TTS 엔진 — Edge TTS + Qwen3-TTS VoiceDesign
YouTube Shorts 자동화 공장용
"""

import asyncio
import os
import subprocess
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "edge-tts", "-q"])
    import edge_tts


# ──────────────────────────────────────
# Edge TTS 보이스 프리셋 (레거시 호환)
# ──────────────────────────────────────
VOICE_PRESETS = {
    "en-male-casual": {
        "voice": "en-US-GuyNeural",
        "rate": "-3%", "pitch": "-1Hz",
        "desc": "캐주얼, 유튜브 친화적",
    },
    "en-male-trust": {
        "voice": "en-US-ChristopherNeural",
        "rate": "-5%", "pitch": "-2Hz",
        "desc": "신뢰감, 금융/교양 적합",
    },
    "en-female-bright": {
        "voice": "en-US-JennyNeural",
        "rate": "+0%", "pitch": "+0Hz",
        "desc": "밝고 명확, 범용",
    },
    "en-female-natural": {
        "voice": "en-US-AriaNeural",
        "rate": "-2%", "pitch": "+0Hz",
        "desc": "자연스러운 톤, 내레이션 적합",
    },
    "en-male-multilingual": {
        "voice": "en-US-AndrewMultilingualNeural",
        "rate": "-3%", "pitch": "-1Hz",
        "desc": "최신 모델, 매우 자연스러움",
    },
    "en-female-multilingual": {
        "voice": "en-US-AvaMultilingualNeural",
        "rate": "-2%", "pitch": "+0Hz",
        "desc": "최신 모델, 매우 자연스러움",
    },
    "ko-male": {
        "voice": "ko-KR-HyunsuMultilingualNeural",
        "rate": "-3%", "pitch": "-1Hz",
        "desc": "한국어 남성, 자연스러움",
    },
    "ko-female": {
        "voice": "ko-KR-SunHiNeural",
        "rate": "+0%", "pitch": "+0Hz",
        "desc": "한국어 여성, 밝은 톤",
    },
    "ja-male": {
        "voice": "ja-JP-KeitaNeural",
        "rate": "-2%", "pitch": "+0Hz",
        "desc": "일본어 남성",
    },
}

DEFAULT_VOICE = "en-male-multilingual"


# ──────────────────────────────────────
# Qwen3-TTS VoiceDesign 프리셋
# instruct 텍스트로 원하는 목소리를 묘사
# ──────────────────────────────────────
QWEN3_VOICE_PRESETS = {
    "witty-male": {
        "instruct": "A witty and confident young male voice with warm mid-range pitch, natural conversational tone, slightly playful with authority",
        "speed": 1.0,
        "desc": "위트+자신감 남성, 과학/호기심 콘텐츠 적합",
    },
    "trust-male": {
        "instruct": "A trustworthy mature male voice with deep pitch, calm and steady pace, like a documentary narrator",
        "speed": 1.0,
        "desc": "신뢰감 남성, 다큐멘터리/심층 분석 적합",
    },
    "energetic-male": {
        "instruct": "An energetic young male voice with bright tone, engaging storytelling style, like a popular YouTube creator",
        "speed": 1.0,
        "desc": "에너지 남성, 트렌드/리스트 콘텐츠 적합",
    },
    "calm-female": {
        "instruct": "A calm and intelligent female voice with warm tone, moderate pitch, trustworthy and engaging",
        "speed": 1.0,
        "desc": "차분+지적 여성, 심리/건강 콘텐츠 적합",
    },
    "bright-female": {
        "instruct": (
            "A young Korean female voice with a cool, nonchalant baseline tone — "
            "she sounds effortlessly chic and unbothered, like she already knows the answer. "
            "Playful and mischievous energy underneath, with a bright vocal color. "
            "On questions, raise pitch with genuine curiosity and teasing anticipation. "
            "On exclamations, deliver with punchy surprise or sarcastic amusement, not shouting. "
            "On dramatic reveals, slow down slightly with a smirk in the voice. "
            "On facts and numbers, shift to deadpan delivery for comedic contrast. "
            "Think: a witty Gen-Z Korean female YouTuber who makes science fun — "
            "half nonchalant, half barely containing excitement."
        ),
        "speed": 1.0,
        "desc": "심드렁+시크+개구진+밝은톤, 만약에 시리즈 메인",
    },
    "whatif-female": {
        "instruct": "A young Korean female YouTuber voice with expressive emotional range. Start curious and excited, then shift to dramatic surprise when revealing facts, use playful sarcasm for punchlines. High energy, slightly exaggerated reactions, warm and relatable like talking to a friend. Think popular Korean science YouTube host.",
        "speed": 1.0,
        "desc": "만약에 시리즈 전용, 감정 풍부한 한국 유튜버 스타일",
    },
    "whatif-male": {
        "instruct": "A young Korean male voice with charismatic storytelling energy. Builds tension with rising intonation, delivers surprising facts with dramatic emphasis, ends with witty dry humor. Confident but approachable, like a popular Korean podcast host who makes science fun.",
        "speed": 1.0,
        "desc": "만약에 시리즈 남성, 카리스마 스토리텔러",
    },
    "storyteller-female": {
        "instruct": "A warm storytelling female voice with rich emotion, dramatic pauses, captivating and mysterious tone",
        "speed": 1.0,
        "desc": "스토리텔러 여성, 미스터리/역사 콘텐츠 적합",
    },
    "cool-female": {
        "instruct": "A cool and confident female voice with slightly low pitch, modern and edgy, like a tech podcast host",
        "speed": 1.0,
        "desc": "쿨한 여성, 테크/금융 콘텐츠 적합",
    },
}

QWEN3_MODEL_ID = "mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-6bit"
QWEN3_DEFAULT_VOICE = "witty-male"


# ──────────────────────────────────────
# Edge TTS 엔진
# ──────────────────────────────────────
class TTSEngine:
    """Edge TTS 기반 다국어 음성 합성 엔진"""

    def __init__(self, preset: str = DEFAULT_VOICE, rate: str = None, pitch: str = None):
        config = VOICE_PRESETS.get(preset, VOICE_PRESETS[DEFAULT_VOICE])
        self.voice = config["voice"]
        self.rate = rate if rate is not None else config["rate"]
        self.pitch = pitch if pitch is not None else config["pitch"]
        self.word_timings = []

    async def generate(self, text: str, output_path: str) -> dict:
        """TTS 음성 생성 + 워드 타이밍 수집"""
        comm = edge_tts.Communicate(
            text,
            self.voice,
            rate=self.rate,
            pitch=self.pitch,
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
                    "duration": chunk["duration"] / 10_000_000,
                })

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(audio_data)

        duration = _get_duration(output_path)

        return {
            "path": output_path,
            "duration": duration,
            "word_count": len(self.word_timings),
            "voice": self.voice,
            "engine": "edge_tts",
        }

    def get_word_timings(self) -> list:
        """마지막 생성의 워드 타이밍 반환"""
        return self.word_timings


# ──────────────────────────────────────
# Qwen3-TTS VoiceDesign 엔진
# ──────────────────────────────────────
class Qwen3TTSEngine:
    """Qwen3-TTS VoiceDesign 기반 고품질 음성 합성 엔진 (Apple Silicon MLX)"""

    def __init__(
        self,
        preset: str = QWEN3_DEFAULT_VOICE,
        instruct: str = None,
        speed: float = None,
        model_id: str = None,
    ):
        config = QWEN3_VOICE_PRESETS.get(preset, QWEN3_VOICE_PRESETS[QWEN3_DEFAULT_VOICE])
        self.instruct = instruct if instruct is not None else config["instruct"]
        self.speed = speed if speed is not None else config["speed"]
        self.model_id = model_id or QWEN3_MODEL_ID
        self.preset = preset
        self.word_timings = []

    def generate(self, text: str, output_path: str) -> dict:
        """TTS 음성 생성 (동기 — mlx_audio는 동기 API)"""
        from mlx_audio.tts.generate import generate_audio

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        output_dir = str(Path(output_path).parent)
        file_prefix = Path(output_path).stem

        generate_audio(
            text=text,
            model=self.model_id,
            output_path=output_dir + "/",
            file_prefix=file_prefix,
            audio_format="wav",
            instruct=self.instruct,
            speed=self.speed,
            verbose=False,
        )

        # mlx_audio는 _000 접미사를 붙임
        actual_path = os.path.join(output_dir, f"{file_prefix}_000.wav")
        if os.path.exists(actual_path) and actual_path != output_path:
            os.rename(actual_path, output_path)

        duration = _get_duration(output_path)

        return {
            "path": output_path,
            "duration": duration,
            "word_count": 0,
            "voice": f"qwen3:{self.preset}",
            "engine": "qwen3_tts",
            "instruct": self.instruct,
        }

    def get_word_timings(self) -> list:
        """Qwen3-TTS는 워드 타이밍 미지원 — 빈 리스트 반환"""
        return self.word_timings


# ──────────────────────────────────────
# 공통 유틸리티
# ──────────────────────────────────────
def _get_duration(audio_path: str) -> float:
    """ffprobe로 오디오 길이 측정"""
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path,
        ],
        capture_output=True, text=True,
    )
    try:
        return float(result.stdout.strip())
    except ValueError:
        return 0.0


def create_engine(engine_type: str = "qwen3", **kwargs):
    """엔진 팩토리 — 스크립트 JSON에서 호출"""
    if engine_type == "edge_tts":
        return TTSEngine(
            preset=kwargs.get("preset", DEFAULT_VOICE),
            rate=kwargs.get("rate"),
            pitch=kwargs.get("pitch"),
        )
    else:
        return Qwen3TTSEngine(
            preset=kwargs.get("preset", QWEN3_DEFAULT_VOICE),
            instruct=kwargs.get("instruct"),
            speed=kwargs.get("speed"),
            model_id=kwargs.get("model_id"),
        )


async def generate_tts(
    text: str,
    output_path: str,
    preset: str = DEFAULT_VOICE,
) -> dict:
    """편의 함수: Edge TTS 텍스트 → 오디오 파일 (레거시 호환)"""
    engine = TTSEngine(preset)
    result = await engine.generate(text, output_path)
    result["word_timings"] = engine.get_word_timings()
    return result


async def generate_voice_samples(text: str, output_dir: str) -> list:
    """모든 영어 보이스 프리셋으로 샘플 생성 (비교용)"""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    results = []

    for preset_name, config in VOICE_PRESETS.items():
        if not preset_name.startswith("en-"):
            continue
        output_path = str(output_dir / f"sample_{preset_name}.mp3")
        engine = TTSEngine(preset_name)
        result = await engine.generate(text, output_path)
        result["preset"] = preset_name
        result["description"] = config["desc"]
        results.append(result)
        print(f"  {preset_name}: {config['desc']} ({result['duration']:.1f}s)")

    return results


# CLI 진입점
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="TTS Engine (Edge TTS + Qwen3)")
    parser.add_argument("--text", type=str, default="This AI tool replaces five different apps you're paying for right now.")
    parser.add_argument("--engine", type=str, default="qwen3", choices=["edge_tts", "qwen3"])
    parser.add_argument("--preset", type=str, default=None)
    parser.add_argument("--instruct", type=str, default=None, help="Qwen3 voice description")
    parser.add_argument("--speed", type=float, default=None)
    parser.add_argument("--output", type=str, default="output.wav")
    parser.add_argument("--samples", action="store_true", help="Generate all voice samples")
    parser.add_argument("--sample-dir", type=str, default="voice_samples")
    args = parser.parse_args()

    if args.samples:
        print("Generating voice samples...")
        results = asyncio.run(generate_voice_samples(args.text, args.sample_dir))
        print(f"\n{len(results)} samples generated in {args.sample_dir}/")
    elif args.engine == "qwen3":
        preset = args.preset or QWEN3_DEFAULT_VOICE
        engine = Qwen3TTSEngine(preset=preset, instruct=args.instruct, speed=args.speed)
        result = engine.generate(args.text, args.output)
        print(f"Generated: {result['path']} ({result['duration']:.1f}s, {result['voice']})")
    else:
        preset = args.preset or DEFAULT_VOICE
        result = asyncio.run(generate_tts(args.text, args.output, preset))
        print(f"Generated: {result['path']} ({result['duration']:.1f}s, {result['voice']})")
