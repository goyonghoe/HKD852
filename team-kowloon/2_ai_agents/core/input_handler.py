#!/usr/bin/env python3
"""
SSBL 아트 리소스 Input Handler

대화형 인터페이스로 아트 리소스를 추가/수정합니다.
- 최소한의 정보만 물어봄
- Data Manager를 통해 저장
- 자동 필드 채우기 (ID, 타임스탬프, 우선순위)
"""

from data_manager import ArtResourceDataManager, ArtResource
from typing import Optional, Dict, Any


class InputHandler:
    """아트 리소스 입력 핸들러"""

    def __init__(self):
        self.dm = ArtResourceDataManager()

        # 아티스트 목록
        self.artists = ["TAEYANG", "JEON SOMI", "MEOVV", "ADP"]

        # 카테고리 매핑 (간단한 입력 → 전체 카테고리명)
        self.category_shortcuts = {
            "신규": "신규 앨범 업데이트",
            "한정": "한정 테마 포토카드 업데이트",
            "이벤트": "이벤트 패스",
            "픽업": "픽업 뽑기 상점",
        }

        # 우선순위 자동 설정
        self.priority_map = {
            "신규 앨범 업데이트": "high",
            "한정 테마 포토카드 업데이트": "medium",
            "이벤트 패스": "high",
            "픽업 뽑기 상점": "medium",
        }

    def add_resource_interactive(self):
        """대화형으로 새 리소스 추가"""
        print("\n=== 새 아트 리소스 추가 ===\n")

        # 1. 아티스트 선택
        print("아티스트를 선택하세요:")
        for i, artist in enumerate(self.artists, 1):
            print(f"  {i}. {artist}")

        artist_idx = self._get_number_input("번호", 1, len(self.artists))
        artist = self.artists[artist_idx - 1]

        # 2. 앨범명 입력
        album = self._get_text_input("앨범명", required=False)

        # 3. 카테고리 선택
        print("\n카테고리를 선택하세요:")
        categories = list(self.category_shortcuts.values())
        for i, cat in enumerate(categories, 1):
            print(f"  {i}. {cat}")

        cat_idx = self._get_number_input("번호", 1, len(categories))
        category = categories[cat_idx - 1]

        # 4. 리소스 타입 입력
        resource_type = self._get_text_input("리소스 타입 (예: 일반 테마 포토카드 초상)")

        # 5. 사이즈 입력 (선택)
        size_input = self._get_text_input("사이즈 (예: 380x512, 또는 Enter로 건너뛰기)", required=False)
        size_width, size_height, size_note = self._parse_size(size_input)

        # 6. 담당자 입력 (선택)
        owner_planning = self._get_text_input("기획 담당자 (선택)", required=False)
        owner_art = self._get_text_input("아트 담당자 (선택)", required=False)

        # 7. 우선순위 자동 설정
        priority = self.priority_map.get(category, "medium")

        # 8. 데이터 생성
        resource_data = {
            "project": "SSBL",
            "artist": artist,
            "album": album,
            "category_main": category,
            "resource_type": resource_type,
            "size_width": size_width,
            "size_height": size_height,
            "size_note": size_note,
            "owner_planning": owner_planning,
            "owner_art": owner_art,
            "priority": priority,
            "status": "pending",
            "translation_status": "not_required",
        }

        # 9. 저장
        new_resource = self.dm.create(resource_data)

        print(f"\n✅ 새 리소스 추가 완료!")
        print(f"   ID: {new_resource.id}")
        print(f"   {artist} - {album} - {resource_type}")
        print(f"   우선순위: {priority}")
        print(f"   상태: {new_resource.status}")

        return new_resource

    def add_resource_quick(self, quick_input: str) -> ArtResource:
        """
        빠른 입력으로 리소스 추가

        예: "TAEYANG 컨셉 아트"
        """
        parts = quick_input.split()

        if len(parts) < 2:
            print("❌ 입력 형식: <아티스트> <리소스타입> [앨범]")
            return None

        artist = parts[0].upper()
        resource_type = " ".join(parts[1:])

        # 기본값
        resource_data = {
            "project": "SSBL",
            "artist": artist,
            "album": "",
            "category_main": "신규 앨범 업데이트",
            "resource_type": resource_type,
            "priority": "high",
            "status": "pending",
            "translation_status": "not_required",
        }

        new_resource = self.dm.create(resource_data)
        print(f"✅ 추가: {artist} - {resource_type} (ID: {new_resource.id})")
        return new_resource

    def update_status(self, resource_id: int, new_status: str):
        """리소스 상태 변경"""
        valid_statuses = ["pending", "in_progress", "review", "completed", "blocked", "cancelled"]

        if new_status not in valid_statuses:
            print(f"❌ 유효하지 않은 상태: {new_status}")
            print(f"   가능한 상태: {', '.join(valid_statuses)}")
            return

        updated = self.dm.update(resource_id, {"status": new_status})

        if updated:
            print(f"✅ 상태 변경: ID {resource_id} → {new_status}")
        else:
            print(f"❌ 리소스를 찾을 수 없습니다: ID {resource_id}")

    def assign_owner(self, resource_id: int, owner_name: str, owner_type: str = "art"):
        """담당자 지정"""
        field = f"owner_{owner_type}"
        updated = self.dm.update(resource_id, {field: owner_name})

        if updated:
            print(f"✅ 담당자 지정: ID {resource_id} → {owner_name} ({owner_type})")
        else:
            print(f"❌ 리소스를 찾을 수 없습니다: ID {resource_id}")

    def show_resources(self, filter_criteria: Optional[Dict] = None):
        """리소스 목록 표시"""
        if filter_criteria:
            resources = self.dm.filter(**filter_criteria)
            filter_str = ", ".join([f"{k}={v}" for k, v in filter_criteria.items()])
            print(f"\n=== 리소스 목록 (필터: {filter_str}) ===\n")
        else:
            resources = self.dm.fetch()
            print(f"\n=== 전체 리소스 목록 ===\n")

        if not resources:
            print("리소스가 없습니다.")
            return

        # 테이블 형식으로 출력
        print(f"{'ID':<5} {'아티스트':<15} {'앨범':<25} {'리소스':<30} {'상태':<12} {'우선순위':<8}")
        print("-" * 100)

        for r in resources[:20]:  # 최대 20개만 표시
            print(f"{r.id:<5} {r.artist:<15} {r.album:<25} {r.resource_type:<30} {r.status:<12} {r.priority:<8}")

        if len(resources) > 20:
            print(f"\n... 외 {len(resources) - 20}개")

    def _get_text_input(self, prompt: str, required: bool = True) -> str:
        """텍스트 입력 받기"""
        while True:
            value = input(f"{prompt}: ").strip()
            if value or not required:
                return value
            print("  ⚠️  필수 입력입니다.")

    def _get_number_input(self, prompt: str, min_val: int, max_val: int) -> int:
        """숫자 입력 받기"""
        while True:
            try:
                value = int(input(f"{prompt} ({min_val}-{max_val}): "))
                if min_val <= value <= max_val:
                    return value
                print(f"  ⚠️  {min_val}~{max_val} 사이의 숫자를 입력하세요.")
            except ValueError:
                print("  ⚠️  숫자를 입력하세요.")

    def _parse_size(self, size_str: str):
        """사이즈 문자열 파싱"""
        if not size_str:
            return None, None, ""

        size_str = size_str.strip()

        # (미정), (입력 필요) 등
        if "미정" in size_str:
            return None, None, "TBD"

        # ~280x40 (approximate)
        if size_str.startswith("~"):
            size_str = size_str[1:]
            note = "approximate"
        else:
            note = ""

        # 280x40 파싱
        if 'x' in size_str.lower():
            parts = size_str.lower().split('x')
            try:
                width = int(parts[0].strip())
                height = int(parts[1].strip())
                return width, height, note
            except (ValueError, IndexError):
                pass

        # 파싱 실패
        return None, None, size_str


# CLI 메인
def main():
    handler = InputHandler()

    print("=" * 60)
    print("  SSBL 아트 리소스 Input Handler")
    print("=" * 60)

    while True:
        print("\n메뉴:")
        print("  1. 새 리소스 추가 (대화형)")
        print("  2. 빠른 추가 (간단 입력)")
        print("  3. 리소스 조회")
        print("  4. 상태 변경")
        print("  5. 통계")
        print("  0. 종료")

        choice = input("\n선택: ").strip()

        if choice == "1":
            handler.add_resource_interactive()

        elif choice == "2":
            quick_input = input("입력 (예: TAEYANG 컨셉아트): ")
            handler.add_resource_quick(quick_input)

        elif choice == "3":
            print("\n필터 옵션:")
            print("  1. 전체")
            print("  2. 아티스트별")
            print("  3. 상태별")

            filter_choice = input("선택: ").strip()

            if filter_choice == "1":
                handler.show_resources()
            elif filter_choice == "2":
                artist = input("아티스트: ").strip()
                handler.show_resources({"artist": artist})
            elif filter_choice == "3":
                status = input("상태: ").strip()
                handler.show_resources({"status": status})

        elif choice == "4":
            resource_id = int(input("리소스 ID: "))
            new_status = input("새 상태 (pending/in_progress/completed): ")
            handler.update_status(resource_id, new_status)

        elif choice == "5":
            stats = handler.dm.stats()
            print("\n=== 통계 ===")
            print(f"총 리소스: {stats['total']}")
            print(f"\n아티스트별:")
            for artist, count in stats['by_artist'].items():
                print(f"  - {artist}: {count}")
            print(f"\n우선순위별:")
            for priority, count in stats['by_priority'].items():
                print(f"  - {priority}: {count}")

        elif choice == "0":
            print("\n종료합니다.")
            break


if __name__ == "__main__":
    main()
