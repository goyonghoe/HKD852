"""
EngineManager — loads a channel profile and instantiates the correct engines.

Reads channel configuration from channels/<channel_id>.json and creates
the appropriate TTS, visual, and compose engine instances.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .tts.base import TTSEngine
from .visual.base import VisualEngine

# Project root for ShortsFactory_v4
_V4_ROOT = Path(__file__).resolve().parent.parent


class EngineManager:
    """Central registry that maps a channel profile to concrete engine instances.

    Usage:
        mgr = EngineManager("whatif_ko")
        tts = mgr.get_tts_engine()
        vis = mgr.get_visual_engine()
        comp = mgr.get_composer()
    """

    def __init__(self, channel_id: str, channels_dir: Path | None = None):
        self.channel_id = channel_id
        self.channels_dir = channels_dir or (_V4_ROOT / "channels")
        self.profile = self._load_profile()

    # ── Profile loading ──────────────────────────────────────

    def _load_profile(self) -> dict[str, Any]:
        """Load channel profile JSON. Falls back to defaults if missing."""
        profile_path = self.channels_dir / f"{self.channel_id}.json"
        if profile_path.exists():
            with open(profile_path, "r", encoding="utf-8") as f:
                return json.load(f)

        # Sensible defaults when no profile file exists
        return {
            "channel_id": self.channel_id,
            "tts": {"engine": "edge", "preset": "en-male-multilingual"},
            "visual": {"engine": "local_sd"},
            "compose": {"engine": "default"},
        }

    # ── Engine factories ─────────────────────────────────────

    def get_tts_engine(self) -> TTSEngine:
        """Instantiate the TTS engine specified in the channel profile."""
        tts_cfg = self.profile.get("tts", {})
        engine_type = tts_cfg.get("engine", "edge")

        if engine_type == "qwen3":
            from .tts.qwen3 import Qwen3TTSEngineAdapter
            return Qwen3TTSEngineAdapter(
                preset=tts_cfg.get("preset"),
                mode=tts_cfg.get("mode", "voicedesign"),
                speed=tts_cfg.get("speed"),
                lang_code=tts_cfg.get("lang_code", "auto"),
            )
        elif engine_type == "elevenlabs":
            from .tts.elevenlabs import ElevenLabsTTSEngine
            return ElevenLabsTTSEngine(
                voice_id=tts_cfg.get("voice_id"),
                model_id=tts_cfg.get("model_id"),
                stability=tts_cfg.get("stability", 0.5),
                similarity_boost=tts_cfg.get("similarity_boost", 0.75),
            )
        else:
            # Default: Edge TTS (free, always available)
            from .tts.edge import EdgeTTSEngine
            return EdgeTTSEngine(
                preset=tts_cfg.get("preset", "en-male-multilingual"),
                rate=tts_cfg.get("rate"),
                pitch=tts_cfg.get("pitch"),
            )

    def get_visual_engine(self) -> VisualEngine:
        """Instantiate the visual engine specified in the channel profile."""
        vis_cfg = self.profile.get("visual", {})
        engine_type = vis_cfg.get("engine", "local_sd")

        if engine_type == "flux_api":
            from .visual.flux_api import FluxAPIEngine
            return FluxAPIEngine()
        elif engine_type == "kling":
            from .visual.kling_video import KlingVideoEngine
            return KlingVideoEngine()
        else:
            # Default: local SD via existing image_gen.py
            from .visual.local_sd import LocalSDEngine
            return LocalSDEngine()

    def get_composer(self):
        """Instantiate the video composer with channel-specific settings."""
        from .compose.video_composer import VideoComposer
        return VideoComposer(profile=self.profile)
