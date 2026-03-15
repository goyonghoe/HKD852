#!/usr/bin/env python3
"""YouTube Caption/Subtitle Downloader using yt-dlp.

Usage:
    python3 yt_captions.py "https://youtube.com/watch?v=VIDEO_ID" [--lang en] [--output captions.txt]

Downloads auto-generated or manual captions as plain text.
"""

import argparse
import json
import os
import sys
import tempfile

try:
    import yt_dlp
except ImportError:
    print("ERROR: yt-dlp not installed. Run: pip3 install yt-dlp", file=sys.stderr)
    sys.exit(1)


def get_captions(url: str, lang: str = "en") -> dict:
    """Download captions for a YouTube video."""
    with tempfile.TemporaryDirectory() as tmpdir:
        output_template = os.path.join(tmpdir, "%(id)s")

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "writesubtitles": True,
            "writeautomaticsub": True,
            "subtitleslangs": [lang],
            "subtitlesformat": "json3",
            "outtmpl": output_template,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            video_id = info.get("id", "unknown")
            title = info.get("title", "Unknown")

        # Find the subtitle file
        caption_text = ""
        for fname in os.listdir(tmpdir):
            if fname.endswith(".json3"):
                with open(os.path.join(tmpdir, fname), "r", encoding="utf-8") as f:
                    subtitle_data = json.load(f)

                # Extract text from json3 format
                events = subtitle_data.get("events", [])
                segments = []
                for event in events:
                    segs = event.get("segs", [])
                    text = "".join(s.get("utf8", "") for s in segs).strip()
                    if text and text != "\n":
                        segments.append(text)

                caption_text = " ".join(segments)
                # Clean up repeated whitespace
                caption_text = " ".join(caption_text.split())
                break

        return {
            "video_id": video_id,
            "title": title,
            "url": url,
            "language": lang,
            "caption_length": len(caption_text),
            "captions": caption_text,
        }


def main():
    parser = argparse.ArgumentParser(description="YouTube Caption Downloader")
    parser.add_argument("url", help="YouTube video URL")
    parser.add_argument("--lang", default="en", help="Caption language (default: en)")
    parser.add_argument("--output", help="Output file path")
    args = parser.parse_args()

    result = get_captions(args.url, args.lang)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            if args.output.endswith(".json"):
                json.dump(result, f, ensure_ascii=False, indent=2)
            else:
                f.write(result["captions"])
        print(f"Saved captions ({result['caption_length']} chars) to {args.output}")
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
