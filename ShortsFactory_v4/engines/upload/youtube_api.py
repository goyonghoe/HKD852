"""
YouTube Upload API — re-exports from existing ShortsFactory_Agent/libs/youtube_uploader.py.

Provides OAuth-authenticated YouTube Data API v3 upload functionality.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add shared libs to path
_SHARED_LIBS = Path(__file__).resolve().parent.parent.parent.parent / "ShortsFactory_Agent" / "libs"
if str(_SHARED_LIBS) not in sys.path:
    sys.path.insert(0, str(_SHARED_LIBS))

# Re-export core upload functionality
from youtube_uploader import (
    upload_video,
    get_authenticated_service,
    UploadConfig,
)

__all__ = ["upload_video", "get_authenticated_service", "UploadConfig"]
