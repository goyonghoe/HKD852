"""
Video Composer — thin wrapper around existing ShortsFactory_Agent/libs/video_composer.py.

Adds channel-profile-aware configuration on top of the battle-tested
moviepy + PIL composition pipeline.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

# Add shared libs to path
_SHARED_LIBS = Path(__file__).resolve().parent.parent.parent.parent / "ShortsFactory_Agent" / "libs"
if str(_SHARED_LIBS) not in sys.path:
    sys.path.insert(0, str(_SHARED_LIBS))

# Re-export the core compose function for direct use
from video_composer import compose_short as _compose_short


class VideoComposer:
    """Channel-aware video composer.

    Wraps the existing video_composer.py and applies channel-specific
    settings (resolution, subtitle style, render config) from the profile.

    Args:
        profile: Channel profile dict (from channels/<id>.json).
    """

    def __init__(self, profile: dict[str, Any] | None = None):
        self.profile = profile or {}
        self.compose_cfg = self.profile.get("compose", {})

    @property
    def resolution(self) -> tuple[int, int]:
        """Target video resolution (width, height)."""
        return (
            self.compose_cfg.get("width", 1080),
            self.compose_cfg.get("height", 1920),
        )

    @property
    def fps(self) -> int:
        """Target frames per second."""
        return self.compose_cfg.get("fps", 30)

    def compose(
        self,
        script_path: str | Path,
        output_path: str | Path | None = None,
        **kwargs,
    ) -> dict:
        """Compose a Shorts video from a script JSON file.

        Delegates to the existing compose_short() function with
        channel-specific overrides applied.

        Args:
            script_path: Path to the script JSON.
            output_path: Optional override for the output video path.
            **kwargs: Additional arguments passed to compose_short.

        Returns:
            Result dict from compose_short (includes path, duration, etc).
        """
        compose_kwargs = {**kwargs}

        # Apply channel config overrides
        if output_path:
            compose_kwargs["output_path"] = str(output_path)

        render_config = self.compose_cfg.get("render_config")
        if render_config and "render_config" not in compose_kwargs:
            compose_kwargs["render_config"] = render_config

        return _compose_short(str(script_path), **compose_kwargs)
