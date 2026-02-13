#!/usr/bin/env python3
"""
완전한 3단계 파이프라인 데모
Complete 3-Step Pipeline Demo

Step 1: 요청 작성 (Input Handler)
Step 2: 검토 및 평가 (Review Agent)
Step 3: 명세서 제작 (Spec Generator)
"""
import sys
from pathlib import Path

# Add agents directory to Python path
PROJECT_ROOT = Path(__file__).parent.parent
AGENTS_CORE = PROJECT_ROOT / '2_ai_agents' / 'core'
AGENTS_UTILS = PROJECT_ROOT / '2_ai_agents' / 'utils'
sys.path.insert(0, str(AGENTS_CORE))
sys.path.insert(0, str(AGENTS_UTILS))




from input_handler import InputHandler
from review_agent import ReviewAgent
from spec_generator import SpecGenerator
from data_manager import ArtResourceDataManager

print("=" * 70)
print("  SSBL 아트 리소스 관리 - 완전한 파이프라인 데모")
print("=" * 70)
print()

# ============================================================================
# Step 1: 요청 작성 (Input Handler)
# ============================================================================
print("📝 Step 1: 요청 작성 (Input Handler)")
print("-" * 70)
print()

handler = InputHandler()
dm = ArtResourceDataManager()

# 현재 리소스 수 확인
before_count = len(dm.fetch())
print(f"🔢 현재 리소스 수: {before_count}개")
print()

# 새 리소스 추가 (빠른 입력 방식)
print("➕ 새 리소스 추가 테스트...")
print("   입력: 'TAEYANG 테스트 컨셉아트'")
print()

new_resource = handler.add_resource_quick("TAEYANG 테스트 컨셉아트")
new_id = new_resource.id

# 추가된 리소스 확인
after_count = len(dm.fetch())
print(f"✅ 추가 완료! 리소스 수: {before_count}개 → {after_count}개")
print(f"   새 리소스 ID: {new_id}")
print(f"   아티스트: {new_resource.artist}")
print(f"   리소스 타입: {new_resource.resource_type}")
print()

# ============================================================================
# Step 2: 검토 및 평가 (Review Agent)
# ============================================================================
print("=" * 70)
print("🔍 Step 2: 검토 및 평가 (Review Agent)")
print("-" * 70)
print()

reviewer = ReviewAgent()

# 방금 추가한 리소스 검토
print(f"📊 리소스 ID {new_id} 검토 중...")
print()

result = reviewer.review_one(new_id)
reviewer.print_review(result)
print()

# 전체 프로젝트 검토
print("-" * 70)
print("📈 전체 프로젝트 현황")
print("-" * 70)

project_review = reviewer.review_all()
print(f"   총 리소스: {project_review.total_resources}개")
print(f"   🟢 완료 (90% 이상): {project_review.complete_count}개")
print(f"   🟡 진행 중 (50-89%): {project_review.in_progress_count}개")
print(f"   🔴 불완전 (50% 미만): {project_review.incomplete_count}개")
print(f"   평균 완성도: {project_review.average_completeness}%")
print()

# ============================================================================
# Step 3: 명세서 제작 (Spec Generator)
# ============================================================================
print("=" * 70)
print("📄 Step 3: 명세서 제작 (Spec Generator)")
print("-" * 70)
print()

generator = SpecGenerator()

# 텍스트 리포트 생성
print("📝 텍스트 리포트 생성 중...")
report = generator.generate_text_report()
print(report)
print()

# 마크다운 명세서 생성
print("-" * 70)
print("📋 마크다운 명세서 생성 중...")
output_path = "명세서/SSBL_명세서.md"
generator.generate_markdown(output_path)
print()

# ============================================================================
# 요약
# ============================================================================
print("=" * 70)
print("  ✅ 3단계 파이프라인 완료!")
print("=" * 70)
print()
print("실행된 단계:")
print("  1️⃣ 요청 작성: 'TAEYANG 테스트 컨셉아트' 추가 완료")
print(f"     → 리소스 ID {new_id} 생성")
print()
print(f"  2️⃣ 검토 및 평가: 완성도 {result.completeness_score}% ({result.status_emoji})")
print(f"     → 누락 항목: {len(result.missing_fields)}개")
print(f"     → 다음 액션: {len(result.next_actions)}개")
print()
print(f"  3️⃣ 명세서 제작: {output_path}")
print(f"     → 전체 {project_review.total_resources}개 리소스 명세서 생성")
print()
print("=" * 70)
print()
print("💡 다음 단계:")
print("   • 생성된 명세서 확인: 명세서/SSBL_명세서.md")
print("   • 리소스 정보 보완: 사이즈, 담당자 등 입력")
print("   • 작업 상태 업데이트: status 변경")
print()
