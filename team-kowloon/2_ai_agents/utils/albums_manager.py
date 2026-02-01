#!/usr/bin/env python3
"""
Albums Manager - 앨범 마스터 데이터 관리

albums_master.json을 읽어서 앨범 정보를 제공합니다.
"""

import json
from pathlib import Path
from typing import List, Dict, Optional


class AlbumsManager:
    """앨범 마스터 데이터 관리 클래스"""

    def __init__(self, master_file: str = None):
        """
        Args:
            master_file: albums_master.json 파일 경로
        """
        self.base_dir = Path(__file__).parent.parent.parent  # team-kowloon/

        if master_file is None:
            master_file = self.base_dir / "1_human_control" / "albums_master.json"
        else:
            master_file = Path(master_file)

        self.master_file = master_file
        self.data = self._load_master()
        self.albums = self.data['albums']

    def _load_master(self) -> Dict:
        """마스터 데이터 로드"""
        with open(self.master_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def get_album_by_artist(self, artist_name: str) -> Optional[Dict]:
        """
        아티스트의 앨범 정보 조회

        Args:
            artist_name: 아티스트명

        Returns:
            앨범 정보 딕셔너리 (없으면 None)
        """
        for album in self.albums:
            if album['artist'].upper() == artist_name.upper():
                return album
        return None

    def get_tracks(self, artist_name: str) -> List[str]:
        """
        앨범의 트랙 리스트 조회

        Args:
            artist_name: 아티스트명

        Returns:
            트랙 리스트
        """
        album = self.get_album_by_artist(artist_name)
        if album is None:
            return []
        return album.get('tracks', [])

    def get_album_title(self, artist_name: str) -> str:
        """
        앨범 타이틀 조회

        Args:
            artist_name: 아티스트명

        Returns:
            앨범 타이틀 (없으면 빈 문자열)
        """
        album = self.get_album_by_artist(artist_name)
        if album is None:
            return ""
        return album.get('title', '')

    def get_release_date(self, artist_name: str) -> str:
        """
        앨범 발매일 조회

        Args:
            artist_name: 아티스트명

        Returns:
            발매일 (없으면 "미정")
        """
        album = self.get_album_by_artist(artist_name)
        if album is None:
            return "미정"
        date = album.get('release_date')
        return date if date else "미정"

    def list_all_albums(self) -> List[Dict]:
        """모든 앨범 정보 리스트"""
        return self.albums

    def __repr__(self):
        return f"AlbumsManager({len(self.albums)} albums loaded)"


# CLI 테스트
if __name__ == "__main__":
    print("=" * 70)
    print("  Albums Manager - 앨범 마스터 데이터 관리")
    print("=" * 70)
    print()

    manager = AlbumsManager()
    print(f"✅ 로드 완료: {manager}")
    print()

    # 전체 앨범 리스트
    print("📋 전체 앨범:")
    for album in manager.list_all_albums():
        artist = album['artist']
        title = album['title']
        date = album.get('release_date', '미정')
        tracks = len(album.get('tracks', []))
        print(f"  • {artist:20s} - {title:30s} ({date}, {tracks}곡)")
    print()

    # 아티스트별 조회
    print("🔍 아티스트별 조회:")
    test_artists = ["TAEYANG", "JEON SOMI", "MEOVV", "ALLDAY PROJECT"]
    for artist in test_artists:
        album_title = manager.get_album_title(artist)
        release_date = manager.get_release_date(artist)
        tracks = manager.get_tracks(artist)
        print(f"\n  {artist}:")
        print(f"    앨범: {album_title}")
        print(f"    발매일: {release_date}")
        if tracks:
            print(f"    트랙 ({len(tracks)}곡):")
            for i, track in enumerate(tracks, 1):
                print(f"      {i}. {track}")
        else:
            print(f"    트랙: (미공개)")
    print()

    print("=" * 70)
    print("✅ 테스트 완료!")
    print("=" * 70)
