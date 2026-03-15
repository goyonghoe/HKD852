"""
ShortsFactory v4 — Engine Abstraction Layer

Swappable engines for TTS, visual generation, video composition,
analytics feedback, and upload scheduling.
"""

from .manager import EngineManager

__all__ = ["EngineManager"]
