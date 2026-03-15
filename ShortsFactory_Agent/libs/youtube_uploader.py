#!/usr/bin/env python3
"""
YouTube Shorts 업로드 모듈 — OAuth 2.0 + YouTube Data API v3
ShortsFactory_Agent 자동화 파이프라인용
"""

import argparse
import json
import os
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

# ── Auto-install dependencies ─────────────────────────────
_REQUIRED = ["google-api-python-client", "google-auth-oauthlib"]
try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    from googleapiclient.errors import HttpError
except ImportError:
    print(f"필수 패키지 설치 중: {', '.join(_REQUIRED)}")
    subprocess.check_call(
        [sys.executable, "-m", "pip", "install", *_REQUIRED, "-q"]
    )
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    from googleapiclient.errors import HttpError


# ── Configuration ─────────────────────────────────────────
CONFIG_DIR = Path.home() / ".config" / "shorts-factory"
TOKEN_PATH = CONFIG_DIR / "youtube_token.json"
CLIENT_SECRET_PATH = CONFIG_DIR / "client_secret.json"
CHANNELS_CONFIG_PATH = CONFIG_DIR / "channels.json"

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


# ── Channel routing ──────────────────────────────────────

def _load_channels_config() -> dict:
    """채널 설정 로드 (~/.config/shorts-factory/channels.json)."""
    if not CHANNELS_CONFIG_PATH.exists():
        return {}
    with open(CHANNELS_CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def resolve_channel(episode_id: str = "", series: str = "") -> str:
    """에피소드/시리즈 → 채널 ID 결정.

    매칭 우선순위:
    1. series 필드 (스크립트 JSON의 "series" 값)
    2. episode_id prefix (whatif_, paper_ 등)
    3. default_channel
    """
    config = _load_channels_config()
    if not config:
        return ""

    routing = config.get("series_routing", {})

    # 1. series 필드로 매칭
    if series:
        for key, channel_id in routing.items():
            if key in series:
                return channel_id

    # 2. episode_id prefix로 매칭
    if episode_id:
        ep_prefix = episode_id.split("_")[0] if "_" in episode_id else episode_id
        for key, channel_id in routing.items():
            if key == ep_prefix:
                return channel_id

    return config.get("default_channel", "")


def get_channel_paths(channel_id: str) -> tuple[Path, Path]:
    """채널별 토큰/시크릿 경로 반환."""
    config = _load_channels_config()
    channels = config.get("channels", {})

    if channel_id and channel_id in channels:
        ch = channels[channel_id]
        token = CONFIG_DIR / ch.get("token_file", "youtube_token.json")
        secret = CONFIG_DIR / ch.get("client_secret_file", "client_secret.json")
        return token, secret

    # 채널 설정 없으면 기본 경로
    return TOKEN_PATH, CLIENT_SECRET_PATH

# Retry constants
MAX_RETRIES = 3
INITIAL_BACKOFF_SEC = 5.0
BACKOFF_MULTIPLIER = 2.0

# YouTube limits
MAX_FILE_SIZE_MB = 256
MAX_SHORTS_DURATION_SEC = 60
MAX_TITLE_LENGTH = 100
MAX_DESCRIPTION_LENGTH = 5000


# ── Data classes ──────────────────────────────────────────


@dataclass
class UploadRequest:
    """업로드 요청."""

    video_path: str
    title: str
    description: str
    tags: list
    category_id: str = "24"  # Entertainment
    privacy_status: str = "private"
    scheduled_at: Optional[str] = None  # ISO 8601 UTC


@dataclass
class UploadResult:
    """업로드 결과."""

    success: bool
    video_id: Optional[str] = None
    url: Optional[str] = None
    upload_timestamp: Optional[str] = None
    privacy_status: Optional[str] = None
    error: Optional[str] = None
    http_status: Optional[int] = None


# ── Auth ──────────────────────────────────────────────────


def ensure_config_dir():
    """설정 디렉토리 생성 + 권한 설정."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    os.chmod(str(CONFIG_DIR), 0o700)

    if TOKEN_PATH.exists():
        os.chmod(str(TOKEN_PATH), 0o600)


def _check_token_permissions():
    """토큰 파일 권한 검증."""
    if not TOKEN_PATH.exists():
        return
    mode = oct(TOKEN_PATH.stat().st_mode)[-3:]
    if mode != "600":
        print(f"[보안 경고] 토큰 파일 권한이 {mode}입니다. 600으로 변경합니다.")
        os.chmod(str(TOKEN_PATH), 0o600)


def authenticate(channel_id: str = "") -> Credentials:
    """OAuth 2.0 인증 — 채널별 토큰 캐시 + 자동 갱신.

    Args:
        channel_id: 채널 ID (channels.json 키). 빈 문자열이면 기본 토큰 사용.

    Flow:
        1. 채널별 토큰 경로에서 기존 토큰 확인
        2. 유효하면 → 반환
        3. 만료되었으면 → refresh
        4. 없으면 → 브라우저 동의 흐름
        5. 토큰 저장 (chmod 600)
    """
    ensure_config_dir()

    token_path, secret_path = get_channel_paths(channel_id)
    channel_label = f" [{channel_id}]" if channel_id else ""

    # 토큰 권한 검증
    if token_path.exists():
        mode = oct(token_path.stat().st_mode)[-3:]
        if mode != "600":
            os.chmod(str(token_path), 0o600)

    creds = None

    # 1. 기존 토큰 로드
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    # 2. 토큰 갱신 또는 새로 획득
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print(f"토큰 갱신 중...{channel_label}")
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"토큰 갱신 실패: {e}")
                print("새로운 인증이 필요합니다.")
                creds = None

        if not creds:
            if not secret_path.exists():
                raise FileNotFoundError(
                    f"OAuth 클라이언트 파일 없음: {secret_path}\n"
                    f"GCP 콘솔에서 다운로드하여 저장하세요:\n"
                    f"  {secret_path}"
                )

            config = _load_channels_config()
            ch_name = config.get("channels", {}).get(channel_id, {}).get("name", channel_id)
            handle = config.get("channels", {}).get(channel_id, {}).get("youtube_handle", "")
            print(f"브라우저에서 Google 인증을 진행합니다...{channel_label}")
            if ch_name:
                print(f"  → 채널: {ch_name} ({handle})")
                print(f"  → 해당 채널의 Google 계정으로 로그인하세요!")
            flow = InstalledAppFlow.from_client_secrets_file(
                str(secret_path), SCOPES
            )
            creds = flow.run_local_server(port=0)

    # 3. 토큰 저장
    with open(token_path, "w") as f:
        f.write(creds.to_json())
    os.chmod(str(token_path), 0o600)

    print(f"인증 완료.{channel_label}")
    return creds


def build_youtube_service(credentials: Credentials):
    """YouTube Data API v3 서비스 객체 생성."""
    return build("youtube", "v3", credentials=credentials)


# ── Validation ────────────────────────────────────────────


def validate_video_for_shorts(video_path: str) -> dict:
    """업로드 전 Shorts 요건 검증 (ffprobe)."""
    result = {
        "valid": True,
        "duration": 0.0,
        "width": 0,
        "height": 0,
        "file_size_mb": 0.0,
        "issues": [],
    }

    path = Path(video_path)
    if not path.exists():
        result["valid"] = False
        result["issues"].append(f"파일 없음: {video_path}")
        return result

    # 파일 크기
    size_mb = path.stat().st_size / (1024 * 1024)
    result["file_size_mb"] = round(size_mb, 1)
    if size_mb > MAX_FILE_SIZE_MB:
        result["valid"] = False
        result["issues"].append(f"파일 크기 {size_mb:.1f}MB > {MAX_FILE_SIZE_MB}MB")

    # ffprobe로 비디오 정보
    try:
        probe_cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            video_path,
        ]
        probe_output = subprocess.run(
            probe_cmd, capture_output=True, text=True, timeout=10
        )
        if probe_output.returncode == 0:
            probe = json.loads(probe_output.stdout)

            # Duration
            duration = float(probe.get("format", {}).get("duration", 0))
            result["duration"] = round(duration, 1)
            if duration > MAX_SHORTS_DURATION_SEC:
                result["valid"] = False
                result["issues"].append(
                    f"길이 {duration:.1f}s > {MAX_SHORTS_DURATION_SEC}s"
                )

            # Resolution
            for stream in probe.get("streams", []):
                if stream.get("codec_type") == "video":
                    result["width"] = stream.get("width", 0)
                    result["height"] = stream.get("height", 0)
                    break

            # Aspect ratio check (9:16)
            w, h = result["width"], result["height"]
            if w > 0 and h > 0:
                ratio = h / w
                if ratio < 1.5:  # 9:16 = 1.78, allow some tolerance
                    result["issues"].append(
                        f"가로 비율 {w}x{h} — 세로 영상(9:16) 권장"
                    )
        else:
            result["issues"].append("ffprobe 실행 실패")
    except FileNotFoundError:
        result["issues"].append("ffprobe가 설치되어 있지 않습니다")
    except Exception as e:
        result["issues"].append(f"ffprobe 오류: {e}")

    return result


# ── Upload ────────────────────────────────────────────────


def upload_video(request: UploadRequest, channel_id: str = "") -> UploadResult:
    """YouTube에 영상 업로드 (재시도 로직 포함).

    Args:
        request: 업로드 요청 정보
        channel_id: 대상 채널 ID (channels.json 키). 빈 문자열이면 기본 채널.
    """
    from datetime import datetime, timezone

    # 1. 인증 (채널별)
    try:
        creds = authenticate(channel_id=channel_id)
        youtube = build_youtube_service(creds)
    except FileNotFoundError as e:
        return UploadResult(success=False, error=str(e))
    except Exception as e:
        return UploadResult(success=False, error=f"인증 실패: {e}")

    # 2. 메타데이터 구성
    title = request.title[:MAX_TITLE_LENGTH]
    description = request.description[:MAX_DESCRIPTION_LENGTH]

    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": request.tags,
            "categoryId": request.category_id,
            "defaultLanguage": "ko",
            "defaultAudioLanguage": "ko",
        },
        "status": {
            "privacyStatus": request.privacy_status,
            "selfDeclaredMadeForKids": False,
        },
    }

    # 예약 업로드
    if request.scheduled_at:
        body["status"]["publishAt"] = request.scheduled_at
        body["status"]["privacyStatus"] = "private"  # 예약 시 private 필수

    # 3. 미디어 파일
    media = MediaFileUpload(
        request.video_path,
        mimetype="video/mp4",
        resumable=True,
        chunksize=1024 * 1024,  # 1MB chunks
    )

    # 4. 업로드 (재시도 포함)
    print(f"  업로드 시작: {Path(request.video_path).name}")
    print(f"  타이틀: {title}")

    for attempt in range(MAX_RETRIES):
        try:
            insert_request = youtube.videos().insert(
                part="snippet,status",
                body=body,
                media_body=media,
            )

            response = None
            while response is None:
                status, response = insert_request.next_chunk()
                if status:
                    progress = int(status.progress() * 100)
                    print(f"  업로드 진행: {progress}%")

            video_id = response["id"]
            now = datetime.now(timezone.utc).isoformat(timespec="seconds")

            print(f"  업로드 완료: https://youtube.com/shorts/{video_id}")

            return UploadResult(
                success=True,
                video_id=video_id,
                url=f"https://youtube.com/shorts/{video_id}",
                upload_timestamp=now,
                privacy_status=request.privacy_status,
            )

        except HttpError as e:
            status_code = e.resp.status if hasattr(e, "resp") else 0

            if status_code in (500, 502, 503, 504):
                wait = INITIAL_BACKOFF_SEC * (BACKOFF_MULTIPLIER**attempt)
                print(f"  서버 오류 ({status_code}). {wait}초 후 재시도...")
                time.sleep(wait)
                continue

            elif status_code == 403:
                error_detail = str(e)
                if "quota" in error_detail.lower():
                    return UploadResult(
                        success=False,
                        error="YouTube API 일일 할당량 초과. 자정(PST) 후 재시도하세요.",
                        http_status=403,
                    )
                return UploadResult(
                    success=False,
                    error=f"권한 거부 (403): {error_detail}",
                    http_status=403,
                )

            elif status_code == 401:
                if attempt == 0:
                    print("  인증 만료. 토큰 갱신 후 재시도...")
                    try:
                        creds = authenticate(channel_id=channel_id)
                        youtube = build_youtube_service(creds)
                        continue
                    except Exception:
                        pass
                return UploadResult(
                    success=False,
                    error="인증 실패 (401). `python youtube_uploader.py auth`로 재인증하세요.",
                    http_status=401,
                )

            else:
                return UploadResult(
                    success=False,
                    error=f"HTTP {status_code}: {e}",
                    http_status=status_code,
                )

        except Exception as e:
            return UploadResult(success=False, error=f"예기치 않은 오류: {e}")

    return UploadResult(
        success=False,
        error=f"최대 재시도 횟수 초과 ({MAX_RETRIES}회)",
    )


def format_metadata_for_youtube(script_json: dict) -> UploadRequest:
    """스크립트 JSON → YouTube 업로드 요청 변환.

    메타데이터 전략 v2:
    - 카테고리: 24 (Entertainment)
    - 태그: 한글 니치 3 + 영문 브로드 2~3 (5~6개)
    - 설명: 한글 훅 + 해시태그 4~5개
    """
    try:
        import sys
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from metadata_gen import format_for_youtube

        yt_meta = format_for_youtube(script_json)
        return UploadRequest(
            video_path="",  # caller가 설정
            title=yt_meta["title"][:MAX_TITLE_LENGTH],
            description=yt_meta["description"][:MAX_DESCRIPTION_LENGTH],
            tags=yt_meta["tags"][:30],
            category_id=yt_meta.get("category_id", "24"),
            privacy_status=yt_meta.get("privacy_status", "private"),
        )
    except ImportError:
        # fallback: metadata_gen 없을 때 직접 변환
        meta = script_json.get("metadata", {})
        hashtags = meta.get("hashtags", [])

        tags = [h.lstrip("#") for h in hashtags]
        for required in ["WhatIf", "Shorts"]:
            if required not in tags:
                tags.append(required)
        tags = tags[:6]

        description = meta.get("description", "")
        description = description.replace("\nAI-assisted production.", "")
        description = description.replace("AI-assisted production.", "")

        title = meta.get("title", script_json.get("episode_id", "Untitled"))

        return UploadRequest(
            video_path="",
            title=title[:MAX_TITLE_LENGTH],
            description=description[:MAX_DESCRIPTION_LENGTH],
            tags=tags,
            category_id="24",  # Entertainment
            privacy_status="private",
        )


# ── CLI ───────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(description="YouTube Shorts Uploader")
    subparsers = parser.add_subparsers(dest="command", help="명령")

    # auth
    auth_p = subparsers.add_parser("auth", help="OAuth 2.0 인증 실행")
    auth_p.add_argument("--channel", "-c", default="", help="채널 ID (channels.json 키)")

    # upload
    upload_p = subparsers.add_parser("upload", help="단일 영상 업로드")
    upload_p.add_argument("--video", required=True, help="MP4 파일 경로")
    upload_p.add_argument("--script", required=True, help="스크립트 JSON 경로")
    upload_p.add_argument(
        "--privacy",
        default="private",
        choices=["private", "unlisted", "public"],
    )

    # validate
    validate_p = subparsers.add_parser("validate", help="영상 Shorts 요건 검증")
    validate_p.add_argument("--video", required=True, help="MP4 파일 경로")

    args = parser.parse_args()

    if args.command == "auth":
        channel_id = args.channel
        try:
            authenticate(channel_id=channel_id)
            token_path, _ = get_channel_paths(channel_id)
            print(f"\n인증 성공!")
            print(f"토큰 저장: {token_path}")
            if channel_id:
                config = _load_channels_config()
                ch = config.get("channels", {}).get(channel_id, {})
                print(f"채널: {ch.get('name', channel_id)} ({ch.get('youtube_handle', '')})")
        except FileNotFoundError as e:
            print(f"\n오류: {e}")
            print("\n=== GCP 셋업 가이드 ===")
            print("1. https://console.cloud.google.com → 프로젝트 생성")
            print("2. YouTube Data API v3 활성화")
            print("3. OAuth 동의 화면 → 외부 → 테스트 사용자 추가")
            print("4. OAuth 2.0 클라이언트 → 데스크톱 앱 → JSON 다운로드")
            print(f"5. 다운로드한 JSON → {CLIENT_SECRET_PATH}")
            print("6. 이 명령 다시 실행")

    elif args.command == "upload":
        with open(args.script, "r", encoding="utf-8") as f:
            script = json.load(f)

        request = format_metadata_for_youtube(script)
        request.video_path = args.video
        request.privacy_status = args.privacy

        # 검증
        validation = validate_video_for_shorts(args.video)
        if not validation["valid"]:
            print(f"검증 실패: {validation['issues']}")
            sys.exit(1)

        print(f"영상 검증 OK: {validation['duration']}s, "
              f"{validation['width']}x{validation['height']}, "
              f"{validation['file_size_mb']}MB")

        # 채널 자동 라우팅: --channel 지정 > series/episode_id 기반 > default
        channel_id = getattr(args, "channel", "") or ""
        if not channel_id:
            channel_id = resolve_channel(
                episode_id=script.get("episode_id", ""),
                series=script.get("series", ""),
            )
        if channel_id:
            config = _load_channels_config()
            ch = config.get("channels", {}).get(channel_id, {})
            print(f"채널: {ch.get('name', channel_id)} ({ch.get('youtube_handle', '')})")

        result = upload_video(request, channel_id=channel_id)
        if result.success:
            print(f"\n업로드 성공!")
            print(f"  URL: {result.url}")
            print(f"  Video ID: {result.video_id}")
        else:
            print(f"\n업로드 실패: {result.error}")
            sys.exit(1)

    elif args.command == "validate":
        result = validate_video_for_shorts(args.video)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        if not result["valid"]:
            sys.exit(1)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
