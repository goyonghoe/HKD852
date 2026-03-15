"""
Edge TTS Engine — free Microsoft Edge text-to-speech.

Uses the edge-tts library (no API key required).
Good quality, many languages, always available as a fallback.
"""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

from .base import TTSEngine

# Edge TTS voice presets (matching ShortsFactory_Agent/libs/tts_engine.py)
EDGE_PRESETS: dict[str, dict] = {
    "en-male-casual": {"voice": "en-US-GuyNeural", "rate": "-3%", "pitch": "-1Hz"},
    "en-male-trust": {"voice": "en-US-ChristopherNeural", "rate": "-5%", "pitch": "-2Hz"},
    "en-female-bright": {"voice": "en-US-JennyNeural", "rate": "+0%", "pitch": "+0Hz"},
    "en-female-natural": {"voice": "en-US-AriaNeural", "rate": "-2%", "pitch": "+0Hz"},
    "en-male-multilingual": {"voice": "en-US-AndrewMultilingualNeural", "rate": "-3%", "pitch": "-1Hz"},
    "en-female-multilingual": {"voice": "en-US-AvaMultilingualNeural", "rate": "-2%", "pitch": "+0Hz"},
    "ko-male": {"voice": "ko-KR-HyunsuMultilingualNeural", "rate": "-3%", "pitch": "-1Hz"},
    "ko-female": {"voice": "ko-KR-SunHiNeural", "rate": "+0%", "pitch": "+0Hz"},
    "ja-male": {"voice": "ja-JP-KeitaNeural", "rate": "-2%", "pitch": "+0Hz"},
}

DEFAULT_PRESET = "en-male-multilingual"


class EdgeTTSEngine(TTSEngine):
    """Free Edge TTS engine — always-available fallback.

    Args:
        preset: Voice preset name from EDGE_PRESETS.
        rate: Speech rate override (e.g. '-5%').
        pitch: Pitch override (e.g. '-2Hz').
    """

    def __init__(
        self,
        preset: str = DEFAULT_PRESET,
        rate: str | None = None,
        pitch: str | None = None,
    ):
        config = EDGE_PRESETS.get(preset, EDGE_PRESETS[DEFAULT_PRESET])
        self.voice = config["voice"]
        self.rate = rate or config["rate"]
        self.pitch = pitch or config["pitch"]
        self.preset = preset

    async def generate(
        self,
        text: str,
        output_path: Path,
        preset: str | None = None,
    ) -> Path:
        """Generate speech using Edge TTS.

        Output is WAV (24kHz, 16bit, mono) for consistency with other engines.
        """
        import edge_tts

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Resolve voice config if preset override given
        if preset and preset in EDGE_PRESETS:
            cfg = EDGE_PRESETS[preset]
            voice = cfg["voice"]
            rate = cfg["rate"]
            pitch = cfg["pitch"]
        else:
            voice = self.voice
            rate = self.rate
            pitch = self.pitch

        comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)

        # Edge TTS outputs mp3 — collect bytes
        audio_data = b""
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]

        # Write mp3 then convert to wav
        mp3_path = str(output_path) + ".mp3"
        with open(mp3_path, "wb") as f:
            f.write(audio_data)

        # mp3 -> wav (24kHz mono 16bit) to match Qwen3 output format
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", mp3_path,
                "-ar", "24000", "-ac", "1", "-acodec", "pcm_s16le",
                str(output_path),
            ],
            capture_output=True,
            text=True,
        )
        os.remove(mp3_path)

        return output_path

    def list_presets(self) -> list[str]:
        """Return available Edge TTS voice presets."""
        return list(EDGE_PRESETS.keys())
