"""
Qwen3 TTS Engine adapter — wraps existing ShortsFactory_Agent/libs/tts_engine.py.

Supports both VoiceDesign (instruct-based) and CustomVoice (reference audio cloning) modes.
Runs locally on Apple Silicon via MLX — completely free.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

# Add shared libs to path so we can import the existing engine
_SHARED_LIBS = Path(__file__).resolve().parent.parent.parent.parent / "ShortsFactory_Agent" / "libs"
if str(_SHARED_LIBS) not in sys.path:
    sys.path.insert(0, str(_SHARED_LIBS))

from .base import TTSEngine


class Qwen3TTSEngineAdapter(TTSEngine):
    """Adapter wrapping the existing Qwen3TTSEngine / Qwen3CustomVoiceEngine.

    Args:
        preset: Voice preset name (e.g. 'witty-male', 'whatif-female').
        mode: 'voicedesign' for instruct-based or 'customvoice' for reference cloning.
        speed: Playback speed multiplier (1.0 = normal).
        lang_code: Language code for TTS ('auto', 'ko', 'en', 'ja').
        instruct: Custom voice description (overrides preset instruct).
        ref_audio: Path to reference audio for CustomVoice mode.
    """

    def __init__(
        self,
        preset: str | None = None,
        mode: str = "voicedesign",
        speed: float | None = None,
        lang_code: str = "auto",
        instruct: str | None = None,
        ref_audio: str | None = None,
    ):
        self.mode = mode
        self.preset = preset
        self.speed = speed
        self.lang_code = lang_code
        self.instruct = instruct
        self.ref_audio = ref_audio
        self._engine = None  # Lazy init

    def _get_engine(self):
        """Lazily create the underlying Qwen3 engine instance."""
        if self._engine is not None:
            return self._engine

        from tts_engine import (
            Qwen3TTSEngine as _VoiceDesign,
            Qwen3CustomVoiceEngine as _CustomVoice,
            QWEN3_DEFAULT_VOICE,
        )

        if self.mode == "customvoice":
            self._engine = _CustomVoice(
                preset=self.preset,
                ref_audio=self.ref_audio,
                speed=self.speed,
                lang_code=self.lang_code,
            )
        else:
            self._engine = _VoiceDesign(
                preset=self.preset or QWEN3_DEFAULT_VOICE,
                instruct=self.instruct,
                speed=self.speed,
                lang_code=self.lang_code,
            )
        return self._engine

    async def generate(
        self,
        text: str,
        output_path: Path,
        preset: str | None = None,
    ) -> Path:
        """Generate speech using Qwen3-TTS (sync engine wrapped in async)."""
        engine = self._get_engine()
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Qwen3 engines are synchronous — run in executor to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            engine.generate,
            text,
            str(output_path),
        )
        return Path(result["path"])

    def list_presets(self) -> list[str]:
        """Return available Qwen3 voice presets."""
        from tts_engine import QWEN3_VOICE_PRESETS, QWEN3_CLONE_PRESETS

        if self.mode == "customvoice":
            return list(QWEN3_CLONE_PRESETS.keys())
        return list(QWEN3_VOICE_PRESETS.keys())
