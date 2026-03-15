"""
Abstract base class for TTS engines.

All TTS backends (Edge, Qwen3, ElevenLabs, etc.) implement this interface
so the pipeline can swap them without code changes.
"""

from __future__ import annotations

import subprocess
from abc import ABC, abstractmethod
from pathlib import Path


class TTSEngine(ABC):
    """Abstract TTS engine interface.

    Subclasses must implement:
        - generate(): produce audio from text
        - list_presets(): return available voice presets
    """

    @abstractmethod
    async def generate(
        self,
        text: str,
        output_path: Path,
        preset: str | None = None,
    ) -> Path:
        """Generate speech audio from text.

        Args:
            text: The text to synthesize.
            output_path: Where to save the output audio file (WAV preferred).
            preset: Optional voice preset name to override the engine default.

        Returns:
            Path to the generated audio file.
        """
        ...

    @abstractmethod
    def list_presets(self) -> list[str]:
        """Return the list of available voice preset names."""
        ...

    def get_duration(self, audio_path: Path) -> float:
        """Get duration of an audio file in seconds using ffprobe.

        This default implementation works for any audio format ffprobe supports.
        Subclasses may override for faster or format-specific measurement.
        """
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(audio_path),
            ],
            capture_output=True,
            text=True,
        )
        try:
            return float(result.stdout.strip())
        except ValueError:
            return 0.0
