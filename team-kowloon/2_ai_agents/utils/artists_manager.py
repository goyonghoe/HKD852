#!/usr/bin/env python3
"""
Artists Manager - 아티스트 마스터 데이터 관리

artists_master.json을 읽어서 아티스트 정보를 제공합니다.
- 아티스트명 정규화 (ADP → ALLDAY PROJECT)
- 멤버 리스트 조회
- 솔로/그룹 구분
"""

import json
from pathlib import Path
from typing import List, Dict, Optional


class ArtistsManager:
    """아티스트 마스터 데이터 관리 클래스"""

    def __init__(self, master_file: str = None):
        """
        Args:
            master_file: artists_master.json 파일 경로 (기본: 1_human_control/artists_master.json)
        """
        self.base_dir = Path(__file__).parent.parent.parent  # team-kowloon/

        if master_file is None:
            master_file = self.base_dir / "1_human_control" / "artists_master.json"
        else:
            master_file = Path(master_file)

        self.master_file = master_file
        self.data = self._load_master()
        self.artists = self.data['artists']

        # 빠른 조회를 위한 인덱스
        self._name_index = self._build_name_index()
        self._alias_index = self._build_alias_index()

    def _load_master(self) -> Dict:
        """마스터 데이터 로드"""
        with open(self.master_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _build_name_index(self) -> Dict[str, Dict]:
        """이름 → 아티스트 정보 인덱스"""
        return {artist['name']: artist for artist in self.artists}

    def _build_alias_index(self) -> Dict[str, str]:
        """별칭 → 정식 이름 인덱스"""
        index = {}
        for artist in self.artists:
            if 'alias' in artist:
                for alias in artist['alias']:
                    index[alias] = artist['name']
        return index

    def normalize_name(self, name: str) -> str:
        """
        아티스트명 정규화

        Args:
            name: 입력 아티스트명 (예: "ADP", "adp", "ALLDAY PROJECT")

        Returns:
            정규화된 정식 이름 (예: "ALLDAY PROJECT")
        """
        # 공백 제거 및 대문자 변환
        normalized = name.strip().upper()

        # 별칭이면 정식 이름으로 변환
        if normalized in self._alias_index:
            return self._alias_index[normalized]

        # 이미 정식 이름이면 그대로 반환
        if normalized in self._name_index:
            return normalized

        # 찾을 수 없으면 원본 반환
        return name

    def get_artist_info(self, name: str) -> Optional[Dict]:
        """
        아티스트 정보 조회

        Args:
            name: 아티스트명 (별칭 가능)

        Returns:
            아티스트 정보 딕셔너리 (없으면 None)
        """
        normalized = self.normalize_name(name)
        return self._name_index.get(normalized)

    def get_members(self, artist_name: str) -> List[str]:
        """
        아티스트의 멤버 리스트 조회

        Args:
            artist_name: 아티스트명 (별칭 가능)

        Returns:
            멤버 리스트 (솔로 아티스트는 빈 리스트)
        """
        info = self.get_artist_info(artist_name)
        if info is None:
            return []
        return info.get('members', [])

    def is_solo(self, artist_name: str) -> bool:
        """
        솔로 아티스트 여부

        Args:
            artist_name: 아티스트명

        Returns:
            솔로 아티스트면 True
        """
        info = self.get_artist_info(artist_name)
        if info is None:
            return False
        return info.get('type') == 'solo'

    def is_group(self, artist_name: str) -> bool:
        """
        그룹 아티스트 여부

        Args:
            artist_name: 아티스트명

        Returns:
            그룹 아티스트면 True
        """
        info = self.get_artist_info(artist_name)
        if info is None:
            return False
        return info.get('type') == 'group'

    def get_member_count(self, artist_name: str) -> int:
        """
        멤버 수 조회

        Args:
            artist_name: 아티스트명

        Returns:
            멤버 수 (솔로는 1, 정보 없으면 0)
        """
        info = self.get_artist_info(artist_name)
        if info is None:
            return 0
        return info.get('member_count', 0)

    def list_all_artists(self) -> List[str]:
        """모든 아티스트 이름 리스트"""
        return [artist['name'] for artist in self.artists]

    def format_members(self, artist_name: str, separator: str = ", ") -> str:
        """
        멤버 리스트를 문자열로 포맷팅

        Args:
            artist_name: 아티스트명
            separator: 구분자 (기본: ", ")

        Returns:
            포맷팅된 멤버 문자열 (예: "ANNIE, TARZZAN, BAILEY, WOOCHAN, YOUNGSEO")
        """
        members = self.get_members(artist_name)
        if not members:
            return ""
        return separator.join(members)

    def __repr__(self):
        return f"ArtistsManager({len(self.artists)} artists loaded)"


# CLI 테스트
if __name__ == "__main__":
    print("=" * 70)
    print("  Artists Manager - 아티스트 마스터 데이터 관리")
    print("=" * 70)
    print()

    manager = ArtistsManager()
    print(f"✅ 로드 완료: {manager}")
    print()

    # 1. 전체 아티스트 리스트
    print("📋 전체 아티스트:")
    for artist in manager.list_all_artists():
        info = manager.get_artist_info(artist)
        member_info = f" ({info['member_count']}인 {info['type']})" if info else ""
        print(f"  • {artist}{member_info}")
    print()

    # 2. 이름 정규화 테스트
    print("🔄 이름 정규화:")
    test_names = ["ADP", "adp", "ALLDAY PROJECT", "TAEYANG", "meovv"]
    for name in test_names:
        normalized = manager.normalize_name(name)
        print(f"  {name:20s} → {normalized}")
    print()

    # 3. 멤버 조회
    print("👥 멤버 조회:")
    for artist in manager.list_all_artists():
        members = manager.get_members(artist)
        if members:
            print(f"  • {artist}: {manager.format_members(artist)}")
        else:
            print(f"  • {artist}: (솔로 아티스트)")
    print()

    # 4. 타입 확인
    print("🔍 타입 확인:")
    test_artists = ["TAEYANG", "MEOVV", "ADP", "JEON SOMI"]
    for artist in test_artists:
        normalized = manager.normalize_name(artist)
        is_solo = manager.is_solo(normalized)
        is_group = manager.is_group(normalized)
        print(f"  • {artist:20s} → 솔로: {is_solo}, 그룹: {is_group}")
    print()

    print("=" * 70)
    print("✅ 테스트 완료!")
    print("=" * 70)
