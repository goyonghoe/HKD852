#!/usr/bin/env python3
"""
Review Agent - 명세서 검토 에이전트

Layer 2 데이터의 품질을 검증하고 다음 액션을 제안합니다.
- 완성도 체크 (필수/선택 필드)
- 논리적 검증 (우선순위, 마감일 등)
- 다음 할일 제안
- 전체 프로젝트 통계
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from data_manager import ArtResourceDataManager, ArtResource


@dataclass
class ReviewResult:
    """개별 리소스 검토 결과"""
    resource_id: int
    resource_name: str
    completeness_score: int  # 0-100
    status_emoji: str  # 🟢🟡🔴
    missing_fields: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    next_actions: List[str] = field(default_factory=list)
    estimated_ready_days: Optional[int] = None


@dataclass
class ProjectReview:
    """전체 프로젝트 검토 결과"""
    total_resources: int
    complete_count: int  # 🟢 완료
    in_progress_count: int  # 🟡 진행중
    incomplete_count: int  # 🔴 불완전
    average_completeness: float
    critical_items: List[str]  # 긴급 처리 필요
    next_actions: List[str]  # 전체 다음 할일


class ReviewAgent:
    """명세서 검토 Agent"""

    def __init__(self):
        self.dm = ArtResourceDataManager()

        # 필수 필드
        self.required_fields = {
            "artist": "아티스트",
            "resource_type": "리소스 타입",
            "category_main": "카테고리",
        }

        # 권장 필드
        self.recommended_fields = {
            "size_width": "이미지 너비",
            "size_height": "이미지 높이",
            "owner_art": "아트 담당자",
            "priority": "우선순위",
        }

        # 선택 필드
        self.optional_fields = {
            "owner_planning": "기획 담당자",
            "due_date": "마감일",
            "detail_link": "상세 설명 링크",
        }

    def review_one(self, resource_id: int) -> ReviewResult:
        """
        개별 리소스 검토

        Returns:
            ReviewResult: 검토 결과
        """
        resource = self.dm.get_by_id(resource_id)
        if not resource:
            raise ValueError(f"리소스 ID {resource_id}를 찾을 수 없습니다.")

        # 1. 필수 필드 체크
        missing_required = []
        for field, name in self.required_fields.items():
            value = getattr(resource, field, None)
            if not value or str(value).strip() == "":
                missing_required.append(name)

        # 2. 권장 필드 체크
        missing_recommended = []
        for field, name in self.recommended_fields.items():
            value = getattr(resource, field, None)
            if not value or (isinstance(value, (int, float)) and value == 0):
                missing_recommended.append(name)

        # 3. 완성도 점수 계산
        total_fields = len(self.required_fields) + len(self.recommended_fields)
        completed_fields = total_fields - len(missing_required) - len(missing_recommended)

        # 필수 필드 누락 시 최대 50점
        if missing_required:
            score = int((completed_fields / total_fields) * 50)
        else:
            score = int((completed_fields / total_fields) * 100)

        # 4. 상태 이모지
        if score >= 90:
            status_emoji = "🟢"
        elif score >= 50:
            status_emoji = "🟡"
        else:
            status_emoji = "🔴"

        # 5. 경고 사항
        warnings = []
        if resource.priority == "high" and not resource.due_date:
            warnings.append("⚠️ 우선순위가 높지만 마감일이 설정되지 않았습니다")

        if resource.status == "in_progress" and not resource.owner_art:
            warnings.append("⚠️ 작업 중이지만 담당자가 지정되지 않았습니다")

        # 6. 다음 액션 제안
        next_actions = []

        if missing_required:
            next_actions.append(f"🔴 필수: {', '.join(missing_required)} 입력")

        if missing_recommended:
            next_actions.append(f"🟡 권장: {', '.join(missing_recommended)} 입력")

        if not missing_required and not missing_recommended:
            if resource.status == "pending":
                next_actions.append("✅ 작업 시작 가능")
            elif resource.status == "in_progress":
                next_actions.append("🔄 작업 진행 중")
            elif resource.status == "completed":
                next_actions.append("✅ 완료됨")

        # 7. 예상 준비 기간
        estimated_days = None
        if missing_required:
            estimated_days = len(missing_required) * 1  # 필수 1개당 1일
        elif missing_recommended:
            estimated_days = len(missing_recommended) * 0.5  # 권장 1개당 0.5일

        return ReviewResult(
            resource_id=resource.id,
            resource_name=f"{resource.artist} - {resource.resource_type}",
            completeness_score=score,
            status_emoji=status_emoji,
            missing_fields=missing_required + missing_recommended,
            warnings=warnings,
            next_actions=next_actions,
            estimated_ready_days=int(estimated_days) if estimated_days else 0
        )

    def review_all(self) -> ProjectReview:
        """
        전체 프로젝트 검토

        Returns:
            ProjectReview: 프로젝트 검토 결과
        """
        resources = self.dm.fetch()

        # 각 리소스 검토
        results = []
        for resource in resources:
            try:
                result = self.review_one(resource.id)
                results.append(result)
            except ValueError:
                continue

        # 통계 계산
        total = len(results)
        complete = sum(1 for r in results if r.completeness_score >= 90)
        in_progress = sum(1 for r in results if 50 <= r.completeness_score < 90)
        incomplete = sum(1 for r in results if r.completeness_score < 50)

        avg_completeness = sum(r.completeness_score for r in results) / total if total > 0 else 0

        # 긴급 처리 필요 항목 (점수 50 미만)
        critical_items = [
            f"[{r.resource_id}] {r.resource_name} ({r.completeness_score}%)"
            for r in results if r.completeness_score < 50
        ]

        # 전체 다음 할일 (상위 5개)
        all_actions = []
        for result in sorted(results, key=lambda x: x.completeness_score)[:5]:
            for action in result.next_actions[:1]:  # 첫 번째 액션만
                all_actions.append(f"[{result.resource_id}] {result.resource_name}: {action}")

        return ProjectReview(
            total_resources=total,
            complete_count=complete,
            in_progress_count=in_progress,
            incomplete_count=incomplete,
            average_completeness=round(avg_completeness, 1),
            critical_items=critical_items[:10],  # 상위 10개
            next_actions=all_actions[:5]  # 상위 5개
        )

    def get_priority_issues(self) -> List[ReviewResult]:
        """
        우선순위 높은 이슈 조회

        Returns:
            점수 낮은 순으로 정렬된 검토 결과
        """
        resources = self.dm.fetch()
        results = []

        for resource in resources:
            try:
                result = self.review_one(resource.id)
                if result.completeness_score < 90:  # 완벽하지 않은 것만
                    results.append(result)
            except ValueError:
                continue

        # 점수 낮은 순 정렬
        return sorted(results, key=lambda x: x.completeness_score)

    def print_review(self, result: ReviewResult):
        """검토 결과 출력"""
        print(f"\n{result.status_emoji} 리소스 ID {result.resource_id}: {result.resource_name}")
        print(f"   완성도: {result.completeness_score}%")

        if result.missing_fields:
            print(f"   누락 항목: {', '.join(result.missing_fields)}")

        if result.warnings:
            for warning in result.warnings:
                print(f"   {warning}")

        if result.next_actions:
            print(f"   다음 액션:")
            for action in result.next_actions:
                print(f"     • {action}")

        if result.estimated_ready_days > 0:
            print(f"   예상 준비 기간: {result.estimated_ready_days}일")

    def print_project_review(self, review: ProjectReview):
        """프로젝트 검토 결과 출력"""
        print("\n" + "=" * 70)
        print("  전체 프로젝트 검토 결과")
        print("=" * 70)

        print(f"\n📊 전체 현황:")
        print(f"   총 리소스: {review.total_resources}개")
        print(f"   🟢 완료 (90% 이상): {review.complete_count}개")
        print(f"   🟡 진행 중 (50-89%): {review.in_progress_count}개")
        print(f"   🔴 불완전 (50% 미만): {review.incomplete_count}개")
        print(f"   평균 완성도: {review.average_completeness}%")

        if review.critical_items:
            print(f"\n🔴 긴급 처리 필요 ({len(review.critical_items)}개):")
            for item in review.critical_items[:5]:
                print(f"   • {item}")
            if len(review.critical_items) > 5:
                print(f"   ... 외 {len(review.critical_items) - 5}개")

        if review.next_actions:
            print(f"\n📋 우선 처리 할일 (상위 5개):")
            for i, action in enumerate(review.next_actions, 1):
                print(f"   {i}. {action}")


# CLI 테스트
if __name__ == "__main__":
    print("=" * 70)
    print("  Review Agent - 명세서 검토")
    print("=" * 70)

    agent = ReviewAgent()

    # 1. 개별 리소스 검토
    print("\n1️⃣ 개별 리소스 검토 (ID 1)")
    print("-" * 70)
    result = agent.review_one(1)
    agent.print_review(result)

    # 2. 전체 프로젝트 검토
    print("\n2️⃣ 전체 프로젝트 검토")
    print("-" * 70)
    project_review = agent.review_all()
    agent.print_project_review(project_review)

    # 3. 우선순위 이슈
    print("\n3️⃣ 우선순위 이슈 (점수 낮은 순)")
    print("-" * 70)
    issues = agent.get_priority_issues()
    print(f"총 {len(issues)}개 이슈 발견\n")

    # 상위 5개만 표시
    for i, issue in enumerate(issues[:5], 1):
        print(f"{i}. {issue.status_emoji} [{issue.resource_id}] {issue.resource_name}")
        print(f"   완성도: {issue.completeness_score}%")
        if issue.next_actions:
            print(f"   다음: {issue.next_actions[0]}")
        print()

    print("=" * 70)
    print("✅ 검토 완료!")
    print("=" * 70)
