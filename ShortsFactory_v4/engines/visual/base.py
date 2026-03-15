"""
Abstract base class for visual generation engines.

Covers both image generation (required) and video generation (optional).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path


class VisualEngine(ABC):
    """Abstract visual engine interface.

    All visual backends must implement generate_image().
    generate_video() is optional and raises NotImplementedError by default.
    """

    @abstractmethod
    async def generate_image(
        self,
        prompt: str,
        output_path: Path,
        width: int = 1080,
        height: int = 1920,
    ) -> Path:
        """Generate an image from a text prompt.

        Args:
            prompt: Text description of the desired image.
            output_path: Where to save the output image.
            width: Image width in pixels.
            height: Image height in pixels.

        Returns:
            Path to the generated image file.
        """
        ...

    async def generate_video(
        self,
        prompt: str,
        output_path: Path,
        duration: float = 5.0,
    ) -> Path:
        """Generate a short video clip from a text prompt.

        This is optional — most engines only support images.
        Override in subclasses that support video generation (e.g. Kling).

        Args:
            prompt: Text description of the desired video.
            output_path: Where to save the output video.
            duration: Desired clip duration in seconds.

        Returns:
            Path to the generated video file.

        Raises:
            NotImplementedError: If the engine does not support video generation.
        """
        raise NotImplementedError(
            f"{self.__class__.__name__} does not support video generation. "
            "Use an engine like KlingVideoEngine for video."
        )
