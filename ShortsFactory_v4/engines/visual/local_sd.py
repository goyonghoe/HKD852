"""
Local SD Engine — wraps existing ShortsFactory_Agent/libs/image_gen.py.

Uses the triple-fallback chain: Gemini -> Pollinations -> HuggingFace Spaces.
Completely free, no API keys required (Gemini key optional for best quality).
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

# Add shared libs to path
_SHARED_LIBS = Path(__file__).resolve().parent.parent.parent.parent / "ShortsFactory_Agent" / "libs"
if str(_SHARED_LIBS) not in sys.path:
    sys.path.insert(0, str(_SHARED_LIBS))

from .base import VisualEngine


class LocalSDEngine(VisualEngine):
    """Local image generation via the existing triple-fallback chain.

    Fallback order:
        1. Google Gemini (best quality, needs GEMINI_API_KEY)
        2. Pollinations.ai (free, online)
        3. HuggingFace Spaces FLUX.1-merged (free, online)
    """

    async def generate_image(
        self,
        prompt: str,
        output_path: Path,
        width: int = 1080,
        height: int = 1920,
    ) -> Path:
        """Generate an image using the existing image_gen.py fallback chain."""
        from image_gen import generate_image

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # The existing generate_image is synchronous — run in executor
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: generate_image(
                prompt=prompt,
                output_path=str(output_path),
                width=width,
                height=height,
            ),
        )

        if not result.get("success"):
            raise RuntimeError(f"Image generation failed: {result.get('error', 'unknown')}")

        return Path(result["path"])
