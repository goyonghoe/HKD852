#!/usr/bin/env python3
"""
Video Analyzer - 영상 파일 인코딩 성분 분석 도구

input/ 폴더에 영상 파일을 넣고 실행하면,
각 영상의 인코딩 정보를 분석하여 동일 인코딩 재현에 필요한 정보를 출력합니다.
"""

import json
import subprocess
import sys
from pathlib import Path

VIDEO_EXTENSIONS = {
    ".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv",
    ".wmv", ".m4v", ".ts", ".mts", ".m2ts", ".3gp", ".ogv",
}

INPUT_DIR = Path(__file__).parent / "input"


def run_ffprobe(file_path: Path) -> dict:
    """ffprobe로 영상 파일의 전체 메타데이터를 JSON으로 추출"""
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        str(file_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffprobe 실행 실패: {file_path}\n{result.stderr}")
    return json.loads(result.stdout)


def find_stream(streams: list, codec_type: str) -> dict | None:
    """특정 타입(video/audio)의 첫 번째 스트림을 반환"""
    for s in streams:
        if s.get("codec_type") == codec_type:
            return s
    return None


def format_bitrate(bps: str | None) -> str:
    """비트레이트를 읽기 쉬운 단위로 변환"""
    if not bps:
        return "N/A"
    bps_int = int(bps)
    if bps_int >= 1_000_000:
        return f"{bps_int / 1_000_000:.2f} Mbps"
    return f"{bps_int / 1_000:.0f} Kbps"


def format_duration(seconds: str | None) -> str:
    """초 단위를 HH:MM:SS 형태로 변환"""
    if not seconds:
        return "N/A"
    total = int(float(seconds))
    h, remainder = divmod(total, 3600)
    m, s = divmod(remainder, 60)
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def format_filesize(bytes_str: str | None) -> str:
    """파일 크기를 읽기 쉬운 단위로 변환"""
    if not bytes_str:
        return "N/A"
    size = int(bytes_str)
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} TB"


def analyze_video(file_path: Path) -> dict:
    """영상 파일 하나를 분석하여 인코딩 정보를 딕셔너리로 반환"""
    probe = run_ffprobe(file_path)
    streams = probe.get("streams", [])
    fmt = probe.get("format", {})

    video = find_stream(streams, "video")
    audio = find_stream(streams, "audio")

    info = {
        "파일명": file_path.name,
        "컨테이너": fmt.get("format_long_name", fmt.get("format_name", "N/A")),
        "길이": format_duration(fmt.get("duration")),
        "파일크기": format_filesize(fmt.get("size")),
        "전체 비트레이트": format_bitrate(fmt.get("bit_rate")),
    }

    if video:
        fps_parts = video.get("r_frame_rate", "0/1").split("/")
        fps = round(int(fps_parts[0]) / int(fps_parts[1]), 3) if len(fps_parts) == 2 and int(fps_parts[1]) != 0 else 0

        info["영상"] = {
            "코덱": video.get("codec_name", "N/A"),
            "코덱(풀네임)": video.get("codec_long_name", "N/A"),
            "프로파일": video.get("profile", "N/A"),
            "해상도": f"{video.get('width', '?')}x{video.get('height', '?')}",
            "FPS": fps,
            "픽셀포맷": video.get("pix_fmt", "N/A"),
            "비트레이트": format_bitrate(video.get("bit_rate")),
            "컬러스페이스": video.get("color_space", "N/A"),
            "컬러범위": video.get("color_range", "N/A"),
        }
    else:
        info["영상"] = None

    if audio:
        info["오디오"] = {
            "코덱": audio.get("codec_name", "N/A"),
            "코덱(풀네임)": audio.get("codec_long_name", "N/A"),
            "프로파일": audio.get("profile", "N/A"),
            "샘플레이트": f"{audio.get('sample_rate', 'N/A')} Hz",
            "채널": audio.get("channels", "N/A"),
            "채널레이아웃": audio.get("channel_layout", "N/A"),
            "비트레이트": format_bitrate(audio.get("bit_rate")),
        }
    else:
        info["오디오"] = None

    return info


def build_ffmpeg_command(info: dict, output_name: str = "output") -> str:
    """분석 결과를 바탕으로 동일 인코딩 ffmpeg 명령어를 생성"""
    parts = ["ffmpeg -i input_file"]

    v = info.get("영상")
    if v:
        codec = v["코덱"]
        # 코덱 매핑
        encoder_map = {
            "h264": "libx264",
            "hevc": "libx265",
            "h265": "libx265",
            "vp9": "libvpx-vp9",
            "vp8": "libvpx",
            "av1": "libaom-av1",
            "mpeg4": "mpeg4",
            "prores": "prores_ks",
        }
        encoder = encoder_map.get(codec, codec)
        parts.append(f"-c:v {encoder}")

        if v["프로파일"] != "N/A":
            profile = v["프로파일"].lower().replace(" ", "")
            # h264 프로파일 매핑
            profile_map = {"high": "high", "main": "main", "baseline": "baseline", "high10": "high10"}
            mapped = profile_map.get(profile, profile)
            parts.append(f"-profile:v {mapped}")

        if v["픽셀포맷"] != "N/A":
            parts.append(f"-pix_fmt {v['픽셀포맷']}")

        if v["비트레이트"] != "N/A":
            parts.append(f"-b:v {v['비트레이트'].replace(' ', '')}")

        parts.append(f"-r {v['FPS']}")
        parts.append(f"-s {v['해상도']}")

    a = info.get("오디오")
    if a:
        codec = a["코덱"]
        encoder_map = {
            "aac": "aac",
            "mp3": "libmp3lame",
            "opus": "libopus",
            "vorbis": "libvorbis",
            "flac": "flac",
            "pcm_s16le": "pcm_s16le",
            "ac3": "ac3",
            "eac3": "eac3",
        }
        encoder = encoder_map.get(codec, codec)
        parts.append(f"-c:a {encoder}")

        if a["비트레이트"] != "N/A":
            parts.append(f"-b:a {a['비트레이트'].replace(' ', '')}")

        if a["샘플레이트"] != "N/A Hz":
            parts.append(f"-ar {a['샘플레이트'].replace(' Hz', '')}")

        if a["채널"] != "N/A":
            parts.append(f"-ac {a['채널']}")

    # 출력 확장자 결정
    container = info.get("컨테이너", "")
    ext_map = {
        "matroska": ".mkv",
        "avi": ".avi",
        "quicktime": ".mov",
        "webm": ".webm",
        "flv": ".flv",
        "ogg": ".ogv",
        "mpeg-ts": ".ts",
    }
    ext = ".mp4"
    for key, val in ext_map.items():
        if key in container.lower():
            ext = val
            break

    parts.append(f"{output_name}{ext}")
    return " \\\n  ".join(parts)


def print_report(info: dict):
    """분석 결과를 복사-붙여넣기 하기 쉬운 텍스트로 출력"""
    lines = []
    lines.append(f"[{info['파일명']}]")
    lines.append(f"컨테이너: {info['컨테이너']}")
    lines.append(f"길이: {info['길이']}")
    lines.append(f"파일크기: {info['파일크기']}")
    lines.append(f"전체 비트레이트: {info['전체 비트레이트']}")

    v = info.get("영상")
    if v:
        lines.append(f"영상 코덱: {v['코덱']} ({v['코덱(풀네임)']})")
        lines.append(f"영상 프로파일: {v['프로파일']}")
        lines.append(f"해상도: {v['해상도']}")
        lines.append(f"FPS: {v['FPS']}")
        lines.append(f"픽셀포맷: {v['픽셀포맷']}")
        lines.append(f"영상 비트레이트: {v['비트레이트']}")
        lines.append(f"컬러스페이스: {v['컬러스페이스']}")
        lines.append(f"컬러범위: {v['컬러범위']}")

    a = info.get("오디오")
    if a:
        lines.append(f"오디오 코덱: {a['코덱']} ({a['코덱(풀네임)']})")
        lines.append(f"오디오 프로파일: {a['프로파일']}")
        lines.append(f"샘플레이트: {a['샘플레이트']}")
        lines.append(f"채널: {a['채널']} ({a['채널레이아웃']})")
        lines.append(f"오디오 비트레이트: {a['비트레이트']}")

    if not v and not a:
        lines.append("(스트림 정보 없음)")

    cmd = build_ffmpeg_command(info)
    lines.append(f"ffmpeg 명령어: {cmd}")

    text = "\n".join(lines)
    print(f"\n{text}\n")


def save_report(results: list[dict], output_path: Path):
    """분석 결과를 JSON 파일로 저장"""
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n  JSON 리포트 저장: {output_path}")


def main():
    if not INPUT_DIR.exists():
        INPUT_DIR.mkdir(parents=True)
        print(f"input/ 폴더를 생성했습니다. 영상 파일을 넣고 다시 실행하세요.")
        print(f"  경로: {INPUT_DIR}")
        return

    video_files = sorted(
        f for f in INPUT_DIR.iterdir()
        if f.is_file() and f.suffix.lower() in VIDEO_EXTENSIONS
    )

    if not video_files:
        print(f"input/ 폴더에 영상 파일이 없습니다.")
        print(f"  경로: {INPUT_DIR}")
        print(f"  지원 포맷: {', '.join(sorted(VIDEO_EXTENSIONS))}")
        return

    print(f"\n  {len(video_files)}개 영상 파일 분석 시작...\n")

    results = []
    for vf in video_files:
        try:
            info = analyze_video(vf)
            results.append(info)
            print_report(info)
        except Exception as e:
            print(f"\n  [오류] {vf.name}: {e}")

    # JSON 리포트 저장
    if results:
        report_path = Path(__file__).parent / "report.json"
        save_report(results, report_path)

    print(f"\n  분석 완료: {len(results)}/{len(video_files)} 파일")


if __name__ == "__main__":
    main()
