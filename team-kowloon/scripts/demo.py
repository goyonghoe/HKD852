#!/usr/bin/env python3
"""
간단한 데모: SSBL 아트 리소스 관리 시스템 테스트

이 스크립트를 실행하면 모든 기능을 한 번에 볼 수 있습니다.
"""
import sys
from pathlib import Path

# Add agents directory to Python path
PROJECT_ROOT = Path(__file__).parent.parent
AGENTS_CORE = PROJECT_ROOT / '2_ai_agents' / 'core'
AGENTS_UTILS = PROJECT_ROOT / '2_ai_agents' / 'utils'
sys.path.insert(0, str(AGENTS_CORE))
sys.path.insert(0, str(AGENTS_UTILS))




from data_manager import ArtResourceDataManager
from input_handler import InputHandler

def main():
    print("=" * 70)
    print("  SSBL 아트 리소스 관리 시스템 - 간단 테스트")
    print("=" * 70)
    print()

    # 초기화
    dm = ArtResourceDataManager()
    handler = InputHandler()

    # ============================================================
    # 1. 현재 데이터 조회
    # ============================================================
    print("📊 1. 현재 Google Sheets에서 데이터 읽어오기")
    print("-" * 70)

    resources = dm.fetch(from_source="sheets")
    print(f"✅ 총 {len(resources)}개의 리소스를 읽었습니다.\n")

    # ============================================================
    # 2. 통계 보기
    # ============================================================
    print("📈 2. 통계 보기")
    print("-" * 70)

    stats = dm.stats()
    print(f"총 리소스: {stats['total']}개")
    print("\n아티스트별:")
    for artist, count in stats['by_artist'].items():
        if artist != "(empty)":
            print(f"  • {artist}: {count}개")

    print("\n우선순위별:")
    for priority, count in stats['by_priority'].items():
        print(f"  • {priority}: {count}개")
    print()

    # ============================================================
    # 3. 특정 아티스트 리소스 조회
    # ============================================================
    print("🔍 3. TAEYANG 아티스트의 리소스만 조회")
    print("-" * 70)

    taeyang_resources = dm.filter(artist="TAEYANG")
    print(f"✅ {len(taeyang_resources)}개 발견\n")

    # 처음 3개만 표시
    print("처음 3개 리소스:")
    for i, r in enumerate(taeyang_resources[:3], 1):
        print(f"  {i}. [{r.id}] {r.resource_type} ({r.size_width}x{r.size_height})")
    print()

    # ============================================================
    # 4. 텍스트 검색
    # ============================================================
    print("🔎 4. '포토카드' 검색")
    print("-" * 70)

    results = dm.search("포토카드")
    print(f"✅ {len(results)}개 발견")

    # 처음 3개만 표시
    print("처음 3개 결과:")
    for i, r in enumerate(results[:3], 1):
        print(f"  {i}. [{r.id}] {r.artist} - {r.resource_type}")
    print()

    # ============================================================
    # 5. 새 리소스 추가 (빠른 입력)
    # ============================================================
    print("➕ 5. 새 리소스 추가하기 (빠른 입력)")
    print("-" * 70)

    new_resource = handler.add_resource_quick("TAEYANG 데모테스트리소스")
    print(f"\n추가된 리소스 정보:")
    print(f"  • ID: {new_resource.id}")
    print(f"  • 아티스트: {new_resource.artist}")
    print(f"  • 리소스: {new_resource.resource_type}")
    print(f"  • 상태: {new_resource.status}")
    print(f"  • 우선순위: {new_resource.priority}")
    print()

    # ============================================================
    # 6. 상태 변경
    # ============================================================
    print("🔄 6. 리소스 상태 변경하기")
    print("-" * 70)

    print(f"리소스 ID {new_resource.id}의 상태를 변경합니다:")
    print(f"  {new_resource.status} → in_progress")

    handler.update_status(new_resource.id, "in_progress")

    # 변경 확인
    updated = dm.get_by_id(new_resource.id)
    print(f"\n✅ 변경 완료! 현재 상태: {updated.status}")
    print()

    # ============================================================
    # 7. 담당자 지정
    # ============================================================
    print("👤 7. 담당자 지정하기")
    print("-" * 70)

    handler.assign_owner(new_resource.id, "홍길동", "art")

    # 변경 확인
    updated = dm.get_by_id(new_resource.id)
    print(f"✅ 아트 담당자: {updated.owner_art}")
    print()

    # ============================================================
    # 8. ID로 특정 리소스 조회
    # ============================================================
    print("🔍 8. ID로 특정 리소스 조회")
    print("-" * 70)

    resource = dm.get_by_id(1)  # ID 1번 조회
    if resource:
        print(f"ID 1번 리소스:")
        print(f"  • 아티스트: {resource.artist}")
        print(f"  • 앨범: {resource.album}")
        print(f"  • 리소스: {resource.resource_type}")
        print(f"  • 사이즈: {resource.size_width}x{resource.size_height}")
        print(f"  • 상태: {resource.status}")
    print()

    # ============================================================
    # 9. 리소스 목록 표시 (테이블 형식)
    # ============================================================
    print("📋 9. TAEYANG 리소스 목록 (테이블 형식)")
    print("-" * 70)

    handler.show_resources({"artist": "TAEYANG"})
    print()

    # ============================================================
    # 10. 정리 (추가한 테스트 리소스 삭제)
    # ============================================================
    print("🗑️  10. 테스트 리소스 삭제 (Soft Delete)")
    print("-" * 70)

    dm.delete(new_resource.id, soft_delete=True)
    deleted = dm.get_by_id(new_resource.id)
    print(f"✅ 삭제 완료! 상태: {deleted.status}")
    print()

    # ============================================================
    # 마무리
    # ============================================================
    print("=" * 70)
    print("  ✅ 모든 테스트 완료!")
    print("=" * 70)
    print()
    print("다음 명령어로 각 기능을 직접 사용해보세요:")
    print("  • Data Manager: python3 data_manager.py")
    print("  • Input Handler (대화형): python3 input_handler.py")
    print()


if __name__ == "__main__":
    main()
