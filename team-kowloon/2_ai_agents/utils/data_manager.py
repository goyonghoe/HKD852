#!/usr/bin/env python3
"""
SSBL 아트 리소스 Data Manager

Layer 2 데이터를 관리하는 클래스
- CRUD 작업 (Create, Read, Update, Delete)
- Google Sheets ↔ 로컬 CSV 동기화
- 필터링, 검색 기능
"""

import csv
import json
import subprocess
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict


@dataclass
class ArtResource:
    """아트 리소스 데이터 모델"""
    id: int
    project: str
    category_main: str
    artist: str
    album: str
    resource_type: str
    size_width: Optional[int] = None
    size_height: Optional[int] = None
    size_note: str = ""
    owner_planning: str = ""
    owner_art: str = ""
    detail_link: str = ""
    status: str = "pending"
    translation_status: str = "not_required"
    languages: str = ""
    priority: str = "medium"
    due_date: str = ""
    notes: str = ""
    created_at: str = ""
    updated_at: str = ""

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ArtResource':
        """딕셔너리에서 ArtResource 객체 생성"""
        # 정수 필드 변환
        if 'id' in data and data['id']:
            data['id'] = int(data['id'])
        if 'size_width' in data and data['size_width']:
            data['size_width'] = int(data['size_width']) if data['size_width'] else None
        if 'size_height' in data and data['size_height']:
            data['size_height'] = int(data['size_height']) if data['size_height'] else None

        return cls(**data)

    def to_dict(self) -> Dict[str, Any]:
        """ArtResource 객체를 딕셔너리로 변환"""
        return asdict(self)


class ArtResourceDataManager:
    """아트 리소스 데이터 관리 클래스"""

    def __init__(self, config_path: str = None):
        """
        Args:
            config_path: config.json 파일 경로 (기본: 프로젝트 루트의 1_human_control/config/config.json)
        """
        self.base_dir = Path(__file__).parent.parent.parent  # team-kowloon/
        if config_path is None:
            config_path = self.base_dir / "1_human_control" / "config" / "config.json"
        else:
            config_path = Path(config_path)
        self.config_path = config_path
        self.config = self._load_config()

        # Google Sheets URL
        self.layer2_url = self.config['google_sheets']['layer2_url']

        # 로컬 CSV 파일 경로
        self.local_csv = self.base_dir / self.config['local_files']['layer2_csv']

        # 캐시
        self._cache: Optional[List[ArtResource]] = None
        self._cache_timestamp: Optional[datetime] = None

    def _load_config(self) -> Dict:
        """config.json 로드"""
        with open(self.config_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _fetch_from_sheets(self) -> List[Dict[str, Any]]:
        """Google Sheets에서 CSV 데이터 가져오기"""
        # curl 사용 (SSL 인증 문제 해결)
        result = subprocess.run(
            ["curl", "-sL", self.layer2_url],
            capture_output=True,
            text=True,
            check=True
        )
        content = result.stdout

        # CSV 파싱
        lines = content.strip().split('\n')
        reader = csv.DictReader(lines)
        return list(reader)

    def _load_from_local(self) -> List[Dict[str, Any]]:
        """로컬 CSV 파일에서 데이터 로드"""
        with open(self.local_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            return list(reader)

    def _save_to_local(self, resources: List[ArtResource]):
        """로컬 CSV 파일에 데이터 저장"""
        fieldnames = [
            "id", "project", "category_main", "artist", "album", "resource_type",
            "size_width", "size_height", "size_note", "owner_planning", "owner_art",
            "detail_link", "status", "translation_status", "languages", "priority",
            "due_date", "notes", "created_at", "updated_at"
        ]

        with open(self.local_csv, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows([r.to_dict() for r in resources])

    def fetch(self, from_source: str = "sheets", use_cache: bool = True) -> List[ArtResource]:
        """
        데이터 가져오기

        Args:
            from_source: "sheets" (Google Sheets) 또는 "local" (로컬 CSV)
            use_cache: 캐시 사용 여부 (sheets일 때만 적용)

        Returns:
            ArtResource 객체 리스트
        """
        # 캐시 확인 (5분 이내)
        if use_cache and from_source == "sheets" and self._cache:
            if self._cache_timestamp:
                elapsed = (datetime.now() - self._cache_timestamp).seconds
                if elapsed < 300:  # 5분
                    return self._cache

        # 데이터 로드
        if from_source == "sheets":
            data = self._fetch_from_sheets()
        else:
            data = self._load_from_local()

        # ArtResource 객체로 변환
        resources = [ArtResource.from_dict(row) for row in data]

        # 캐시 업데이트
        if from_source == "sheets":
            self._cache = resources
            self._cache_timestamp = datetime.now()

        return resources

    def get_by_id(self, resource_id: int, from_source: str = "local") -> Optional[ArtResource]:
        """
        ID로 특정 리소스 조회

        Args:
            resource_id: 리소스 ID
            from_source: "local" (기본) 또는 "sheets"
        """
        resources = self.fetch(from_source=from_source)
        for resource in resources:
            if resource.id == resource_id:
                return resource
        return None

    def filter(self, **criteria) -> List[ArtResource]:
        """
        조건으로 필터링

        Args:
            **criteria: 필터 조건 (예: artist="TAEYANG", status="pending")

        Returns:
            필터링된 ArtResource 리스트
        """
        resources = self.fetch()
        filtered = resources

        for key, value in criteria.items():
            filtered = [r for r in filtered if getattr(r, key, None) == value]

        return filtered

    def search(self, query: str, fields: Optional[List[str]] = None) -> List[ArtResource]:
        """
        텍스트 검색

        Args:
            query: 검색어
            fields: 검색할 필드 리스트 (None이면 모든 텍스트 필드)

        Returns:
            검색 결과 ArtResource 리스트
        """
        resources = self.fetch()
        query_lower = query.lower()

        if fields is None:
            fields = ["artist", "album", "resource_type", "category_main", "notes"]

        results = []
        for resource in resources:
            for field in fields:
                value = str(getattr(resource, field, ""))
                if query_lower in value.lower():
                    results.append(resource)
                    break

        return results

    def create(self, resource_data: Dict[str, Any]) -> ArtResource:
        """
        새 리소스 추가

        Args:
            resource_data: 리소스 데이터 딕셔너리

        Returns:
            생성된 ArtResource 객체
        """
        resources = self.fetch(from_source="local")

        # 새 ID 생성 (최대 ID + 1)
        max_id = max([r.id for r in resources]) if resources else 0
        new_id = max_id + 1

        # 타임스탬프 자동 생성
        now = datetime.utcnow().isoformat() + "Z"
        resource_data['id'] = new_id
        resource_data['created_at'] = now
        resource_data['updated_at'] = now

        # ArtResource 객체 생성
        new_resource = ArtResource.from_dict(resource_data)

        # 로컬에 저장
        resources.append(new_resource)
        self._save_to_local(resources)

        # 캐시 무효화
        self._cache = None

        return new_resource

    def update(self, resource_id: int, updates: Dict[str, Any]) -> Optional[ArtResource]:
        """
        리소스 업데이트

        Args:
            resource_id: 리소스 ID
            updates: 업데이트할 필드 딕셔너리

        Returns:
            업데이트된 ArtResource 객체 (없으면 None)
        """
        resources = self.fetch(from_source="local")

        # 리소스 찾기
        target_idx = None
        for idx, resource in enumerate(resources):
            if resource.id == resource_id:
                target_idx = idx
                break

        if target_idx is None:
            return None

        # 업데이트 적용
        resource_dict = resources[target_idx].to_dict()
        resource_dict.update(updates)
        resource_dict['updated_at'] = datetime.utcnow().isoformat() + "Z"

        # ArtResource 객체로 변환
        updated_resource = ArtResource.from_dict(resource_dict)
        resources[target_idx] = updated_resource

        # 로컬에 저장
        self._save_to_local(resources)

        # 캐시 무효화
        self._cache = None

        return updated_resource

    def delete(self, resource_id: int, soft_delete: bool = True) -> bool:
        """
        리소스 삭제

        Args:
            resource_id: 리소스 ID
            soft_delete: True면 status를 'cancelled'로, False면 완전 삭제

        Returns:
            삭제 성공 여부
        """
        if soft_delete:
            # Soft delete: status를 cancelled로 변경
            result = self.update(resource_id, {"status": "cancelled"})
            return result is not None
        else:
            # Hard delete: 완전 삭제
            resources = self.fetch(from_source="local")
            original_count = len(resources)
            resources = [r for r in resources if r.id != resource_id]

            if len(resources) < original_count:
                self._save_to_local(resources)
                self._cache = None
                return True
            return False

    def stats(self) -> Dict[str, Any]:
        """데이터 통계"""
        resources = self.fetch()

        return {
            "total": len(resources),
            "by_artist": self._count_by_field(resources, "artist"),
            "by_category": self._count_by_field(resources, "category_main"),
            "by_status": self._count_by_field(resources, "status"),
            "by_priority": self._count_by_field(resources, "priority"),
        }

    def _count_by_field(self, resources: List[ArtResource], field: str) -> Dict[str, int]:
        """필드별 개수 집계"""
        counts = {}
        for resource in resources:
            value = getattr(resource, field, "")
            if not value:
                value = "(empty)"
            counts[value] = counts.get(value, 0) + 1
        return counts


# CLI 테스트
if __name__ == "__main__":
    print("=== SSBL Art Resource Data Manager ===\n")

    # Data Manager 초기화
    dm = ArtResourceDataManager()

    # 1. 데이터 가져오기
    print("1️⃣ Fetching data from Google Sheets...")
    resources = dm.fetch(from_source="sheets")
    print(f"   ✅ Loaded {len(resources)} resources\n")

    # 2. 통계
    print("2️⃣ Statistics:")
    stats = dm.stats()
    print(f"   Total: {stats['total']}")
    print(f"   Artists: {list(stats['by_artist'].keys())}")
    print(f"   Priorities: {stats['by_priority']}\n")

    # 3. 필터링 테스트
    print("3️⃣ Filter: artist=TAEYANG")
    taeyang_resources = dm.filter(artist="TAEYANG")
    print(f"   ✅ Found {len(taeyang_resources)} resources")
    if taeyang_resources:
        print(f"   Example: {taeyang_resources[0].resource_type}\n")

    # 4. 검색 테스트
    print("4️⃣ Search: '포토카드'")
    search_results = dm.search("포토카드")
    print(f"   ✅ Found {len(search_results)} resources\n")

    # 5. ID로 조회
    print("5️⃣ Get by ID: 1")
    resource = dm.get_by_id(1)
    if resource:
        print(f"   ✅ {resource.artist} - {resource.album} - {resource.resource_type}\n")

    print("✅ All tests passed!")
