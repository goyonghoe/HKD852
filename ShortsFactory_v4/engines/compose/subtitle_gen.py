"""
Subtitle Generator — re-exports from existing ShortsFactory_Agent/libs/subtitle_gen.py.

Provides sentence splitting and timing calculation for subtitle overlay.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add shared libs to path
_SHARED_LIBS = Path(__file__).resolve().parent.parent.parent.parent / "ShortsFactory_Agent" / "libs"
if str(_SHARED_LIBS) not in sys.path:
    sys.path.insert(0, str(_SHARED_LIBS))

# Re-export core functions
from subtitle_gen import split_sentences, calc_sentence_timings

__all__ = ["split_sentences", "calc_sentence_timings"]
