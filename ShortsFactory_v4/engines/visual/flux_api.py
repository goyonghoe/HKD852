"""
Flux API Engine — premium image generation via Flux API.

Requires:
    Environment variable: FLUX_API_KEY

Status: STUB — API integration pending.
"""

from __future__ import annotations

import os
from pathlib import Path

from .base import VisualEngine


class FluxAPIEngine(VisualEngine):
    """Flux API image generation (premium).

    TODO: Implement actual API integration when Flux API access is available.
    """

    def __init__(self):
        self.api_key = os.environ.get("FLUX_API_KEY", "")
        if not self.api_key:
            # Not a fatal error — allow instantiation for testing
            pass

    async def generate_image(
        self,
        prompt: str,
        output_path: Path,
        width: int = 1080,
        height: int = 1920,
    ) -> Path:
        """Generate an image via Flux API.

        TODO: Replace stub with actual API call:
            1. POST prompt + dimensions to Flux endpoint
            2. Poll for completion or use webhook
            3. Download result to output_path
        """
        if not self.api_key:
            raise RuntimeError(
                "FLUX_API_KEY environment variable is not set. "
                "Set it or switch to 'local_sd' engine in channel config."
            )

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # TODO: Actual Flux API implementation
        # import httpx
        # async with httpx.AsyncClient() as client:
        #     response = await client.post(
        #         "https://api.flux.ai/v1/generate",
        #         headers={"Authorization": f"Bearer {self.api_key}"},
        #         json={
        #             "prompt": prompt,
        #             "width": width,
        #             "height": height,
        #             "model": "flux-pro",
        #         },
        #     )
        #     response.raise_for_status()
        #     with open(output_path, "wb") as f:
        #         f.write(response.content)

        raise NotImplementedError(
            "FluxAPIEngine is a stub. Implement API integration when access is available."
        )
