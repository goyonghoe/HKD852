"""
ElevenLabs TTS Engine — premium API-based voice synthesis.

Requires:
    pip install elevenlabs
    Environment variable: ELEVENLABS_API_KEY
"""

from __future__ import annotations

import os
from pathlib import Path

from .base import TTSEngine


class ElevenLabsTTSEngine(TTSEngine):
    """ElevenLabs API wrapper for high-quality voice synthesis.

    Args:
        voice_id: ElevenLabs voice ID. If None, uses the default 'Rachel' voice.
        model_id: Model to use (e.g. 'eleven_multilingual_v2').
        stability: Voice stability (0.0-1.0). Lower = more expressive.
        similarity_boost: How closely to match the target voice (0.0-1.0).
    """

    def __init__(
        self,
        voice_id: str | None = None,
        model_id: str | None = None,
        stability: float = 0.5,
        similarity_boost: float = 0.75,
    ):
        self.api_key = os.environ.get("ELEVENLABS_API_KEY", "")
        self.voice_id = voice_id or "21m00Tcm4TlvDq8ikWAM"  # Rachel (default)
        self.model_id = model_id or "eleven_multilingual_v2"
        self.stability = stability
        self.similarity_boost = similarity_boost
        self._client = None

    def _get_client(self):
        """Lazily initialize the ElevenLabs client."""
        if self._client is not None:
            return self._client

        if not self.api_key:
            raise RuntimeError(
                "ELEVENLABS_API_KEY environment variable is not set. "
                "Get your API key from https://elevenlabs.io"
            )

        from elevenlabs.client import ElevenLabs
        self._client = ElevenLabs(api_key=self.api_key)
        return self._client

    async def generate(
        self,
        text: str,
        output_path: Path,
        preset: str | None = None,
    ) -> Path:
        """Generate speech via ElevenLabs API.

        Args:
            text: Text to synthesize.
            output_path: Where to save the audio (mp3 from API, converted to wav).
            preset: If provided, used as voice_id override.

        Returns:
            Path to the generated audio file.
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        client = self._get_client()
        voice_id = preset or self.voice_id

        # ElevenLabs SDK generate() returns an iterator of audio bytes
        audio_generator = client.generate(
            text=text,
            voice=voice_id,
            model=self.model_id,
            voice_settings={
                "stability": self.stability,
                "similarity_boost": self.similarity_boost,
            },
        )

        # Collect all audio chunks and write to file
        audio_data = b"".join(audio_generator)
        with open(output_path, "wb") as f:
            f.write(audio_data)

        return output_path

    def list_presets(self) -> list[str]:
        """Return available ElevenLabs voices.

        Queries the API for the user's voice library.
        Returns voice IDs as preset names.
        """
        try:
            client = self._get_client()
            response = client.voices.get_all()
            return [v.voice_id for v in response.voices]
        except Exception:
            # Fallback: return known default voices
            return [
                "21m00Tcm4TlvDq8ikWAM",  # Rachel
                "AZnzlk1XvdvUeBnXmlld",  # Domi
                "EXAVITQu4vr4xnSDxMaL",  # Bella
                "ErXwobaYiN019PkySvjV",  # Antoni
                "MF3mGyEYCl7XYWbV9V6O",  # Elli
                "TxGEqnHWrfWFTfGW9XjX",  # Josh
            ]
