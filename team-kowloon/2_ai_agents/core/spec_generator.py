#!/usr/bin/env python3
"""
Spec Generator - 명세서 생성기

Layer 2 데이터를 기반으로 인간 친화적인 명세서를 생성합니다.
- 프로젝트 요약 (통계, 진행률)
- 아티스트별 상세 명세서
- 우선순위별 정렬
- 마크다운/텍스트 형식 지원
"""

from typing import List, Dict
from datetime import datetime
from pathlib import Path
from data_manager import ArtResourceDataManager, ArtResource
from review_agent import ReviewAgent, ReviewResult


class SpecGenerator:
    """명세서 생성기"""

    def __init__(self):
        self.dm = ArtResourceDataManager()
        self.reviewer = ReviewAgent()

    def generate_markdown(self, output_path: str):
        """
        마크다운 명세서 생성

        Args:
            output_path: 출력 파일 경로
        """
        resources = self.dm.fetch()
        project_review = self.reviewer.review_all()

        # 마크다운 생성
        md_lines = []

        # 헤더
        md_lines.append("# SSBL 아트 리소스 제작 명세서")
        md_lines.append(f"\n**생성일:** {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        md_lines.append(f"**총 리소스:** {project_review.total_resources}개")
        md_lines.append("")

        # 1. 프로젝트 요약
        md_lines.extend(self._generate_summary_section(project_review))

        # 2. 아티스트별 상세
        md_lines.extend(self._generate_artist_sections(resources))

        # 3. 우선순위별 정렬
        md_lines.extend(self._generate_priority_section(resources))

        # 4. 미완료 항목
        md_lines.extend(self._generate_incomplete_section())

        # 파일 저장
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(md_lines))

        print(f"✅ 명세서 생성 완료: {output_path}")
        return output_path

    def _generate_summary_section(self, review) -> List[str]:
        """프로젝트 요약 섹션"""
        lines = []
        lines.append("---")
        lines.append("")
        lines.append("## 📊 프로젝트 요약")
        lines.append("")

        # 진행률
        total = review.total_resources
        complete = review.complete_count
        in_progress = review.in_progress_count
        incomplete = review.incomplete_count

        lines.append("### 전체 진행 현황")
        lines.append("")
        lines.append(f"- **총 리소스:** {total}개")
        lines.append(f"- 🟢 **완료** (90% 이상): {complete}개 ({complete/total*100:.1f}%)")
        lines.append(f"- 🟡 **진행 중** (50-89%): {in_progress}개 ({in_progress/total*100:.1f}%)")
        lines.append(f"- 🔴 **불완전** (50% 미만): {incomplete}개 ({incomplete/total*100:.1f}%)")
        lines.append(f"- **평균 완성도:** {review.average_completeness}%")
        lines.append("")

        # 진행률 바
        progress = int((complete + in_progress * 0.5) / total * 20)
        bar = "█" * progress + "░" * (20 - progress)
        lines.append(f"```\n진행률: {bar} {(complete + in_progress * 0.5) / total * 100:.1f}%\n```")
        lines.append("")

        # 아티스트별 통계
        stats = self.dm.stats()
        lines.append("### 아티스트별 현황")
        lines.append("")
        lines.append("| 아티스트 | 리소스 수 |")
        lines.append("|---------|----------|")

        for artist, count in stats['by_artist'].items():
            if artist != "(empty)":
                lines.append(f"| {artist} | {count}개 |")

        lines.append("")

        # 우선순위별 통계
        lines.append("### 우선순위별 현황")
        lines.append("")
        lines.append("| 우선순위 | 개수 |")
        lines.append("|---------|------|")

        for priority, count in stats['by_priority'].items():
            emoji = "🔴" if priority == "high" else "🟡"
            lines.append(f"| {emoji} {priority.upper()} | {count}개 |")

        lines.append("")

        # 긴급 처리 필요
        if review.critical_items:
            lines.append("### 🔴 긴급 처리 필요")
            lines.append("")
            for item in review.critical_items[:10]:
                lines.append(f"- {item}")
            lines.append("")

        return lines

    def _generate_artist_sections(self, resources: List[ArtResource]) -> List[str]:
        """아티스트별 상세 섹션"""
        lines = []
        lines.append("---")
        lines.append("")
        lines.append("## 🎨 아티스트별 상세")
        lines.append("")

        # 아티스트별 그룹화
        by_artist = {}
        for resource in resources:
            artist = resource.artist if resource.artist else "(미지정)"
            if artist not in by_artist:
                by_artist[artist] = []
            by_artist[artist].append(resource)

        # 각 아티스트별 섹션
        for artist in sorted(by_artist.keys()):
            if artist == "(미지정)":
                continue

            artist_resources = by_artist[artist]
            lines.append(f"### {artist}")
            lines.append("")
            lines.append(f"**총 {len(artist_resources)}개 리소스**")
            lines.append("")

            # 테이블
            lines.append("| ID | 카테고리 | 리소스 타입 | 사이즈 | 상태 | 담당자 | 완성도 |")
            lines.append("|----|---------|-----------|-------|------|-------|--------|")

            for r in artist_resources:
                # 완성도 계산
                result = self.reviewer.review_one(r.id)
                completeness = f"{result.status_emoji} {result.completeness_score}%"

                size = f"{r.size_width}x{r.size_height}" if r.size_width and r.size_height else r.size_note or "-"
                status = r.status
                owner = r.owner_art or "-"

                lines.append(
                    f"| {r.id} | {r.category_main} | {r.resource_type} | "
                    f"{size} | {status} | {owner} | {completeness} |"
                )

            lines.append("")

        return lines

    def _generate_priority_section(self, resources: List[ArtResource]) -> List[str]:
        """우선순위별 섹션"""
        lines = []
        lines.append("---")
        lines.append("")
        lines.append("## 🔥 우선순위별 작업 목록")
        lines.append("")

        # 우선순위별 그룹화
        by_priority = {"high": [], "medium": [], "low": []}
        for resource in resources:
            priority = resource.priority if resource.priority else "medium"
            if priority in by_priority:
                by_priority[priority].append(resource)

        # High Priority
        if by_priority["high"]:
            lines.append("### 🔴 High Priority (긴급)")
            lines.append("")
            lines.append(f"**총 {len(by_priority['high'])}개**")
            lines.append("")
            lines.append("| ID | 아티스트 | 리소스 타입 | 상태 | 마감일 | 완성도 |")
            lines.append("|----|---------|-----------|------|-------|--------|")

            for r in sorted(by_priority["high"], key=lambda x: x.id):
                result = self.reviewer.review_one(r.id)
                completeness = f"{result.status_emoji} {result.completeness_score}%"
                due = r.due_date if r.due_date else "-"

                lines.append(
                    f"| {r.id} | {r.artist} | {r.resource_type} | "
                    f"{r.status} | {due} | {completeness} |"
                )

            lines.append("")

        # Medium Priority
        if by_priority["medium"]:
            lines.append("### 🟡 Medium Priority (보통)")
            lines.append("")
            lines.append(f"**총 {len(by_priority['medium'])}개**")
            lines.append("")
            lines.append("<details>")
            lines.append("<summary>목록 보기 (클릭)</summary>")
            lines.append("")
            lines.append("| ID | 아티스트 | 리소스 타입 | 상태 |")
            lines.append("|----|---------|-----------|------|")

            for r in sorted(by_priority["medium"], key=lambda x: x.id)[:20]:  # 최대 20개
                lines.append(f"| {r.id} | {r.artist} | {r.resource_type} | {r.status} |")

            if len(by_priority["medium"]) > 20:
                lines.append(f"\n... 외 {len(by_priority['medium']) - 20}개")

            lines.append("")
            lines.append("</details>")
            lines.append("")

        return lines

    def _generate_incomplete_section(self) -> List[str]:
        """미완료 항목 섹션"""
        lines = []
        lines.append("---")
        lines.append("")
        lines.append("## ⚠️ 미완료 항목 (조치 필요)")
        lines.append("")

        # 우선순위 이슈 조회
        issues = self.reviewer.get_priority_issues()

        # 완성도 낮은 순으로 상위 20개
        lines.append("### 완성도 낮은 순")
        lines.append("")
        lines.append("| ID | 리소스 | 완성도 | 누락 항목 | 다음 액션 |")
        lines.append("|----|-------|--------|----------|----------|")

        for issue in issues[:20]:
            missing = ", ".join(issue.missing_fields[:3]) if issue.missing_fields else "-"
            if len(issue.missing_fields) > 3:
                missing += f" 외 {len(issue.missing_fields) - 3}개"

            next_action = issue.next_actions[0] if issue.next_actions else "-"

            lines.append(
                f"| {issue.resource_id} | {issue.resource_name} | "
                f"{issue.status_emoji} {issue.completeness_score}% | "
                f"{missing} | {next_action} |"
            )

        if len(issues) > 20:
            lines.append("")
            lines.append(f"*... 외 {len(issues) - 20}개 항목*")

        lines.append("")

        return lines

    def generate_album_sheets(self, output_dir: str = "명세서"):
        """
        카테고리 + 앨범 단위로 상세 명세서 시트 생성

        각 카테고리+앨범별로 별도 시트 생성:
        - 신규앨범업데이트_TAEYANG_Quintessence.csv
        - 한정테마포토카드업데이트_TAEYANG_Quintessence.csv
        - 이벤트패스_TAEYANG_Quintessence.csv

        각 시트에는 해당 카테고리+앨범의 모든 리소스 상세 정보 포함
        """
        import csv

        resources = self.dm.fetch()
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # 카테고리 + 앨범별로 리소스 그룹화
        by_category_album = {}
        for resource in resources:
            # 카테고리 정규화
            category = resource.category_main.replace(" ", "").replace("-", "") if resource.category_main else "기타"
            # 앨범명 정규화 (파일명에 사용 가능하게)
            album = f"{resource.artist}_{resource.album}".replace(" ", "").replace("-", "") if resource.album else resource.artist

            # 카테고리 + 앨범 조합 키
            key = f"{category}_{album}"

            if not key or key == "_":
                key = "기타_기타"

            if key not in by_category_album:
                by_category_album[key] = {
                    'category': resource.category_main,
                    'artist': resource.artist,
                    'album': resource.album,
                    'resources': []
                }
            by_category_album[key]['resources'].append(resource)

        # 각 카테고리+앨범별로 시트 생성
        generated_files = []

        for key, data in sorted(by_category_album.items()):
            if not data['resources']:
                continue

            filename = output_path / f"{key}.csv"

            with open(filename, 'w', encoding='utf-8-sig', newline='') as f:
                writer = csv.writer(f)

                # 헤더 정보
                writer.writerow([f"카테고리: {data['category']}"])
                writer.writerow([f"앨범: {data['artist']} - {data['album']}"])
                writer.writerow([f"생성일: {datetime.now().strftime('%Y-%m-%d %H:%M')}"])
                writer.writerow([f"총 리소스: {len(data['resources'])}개"])
                writer.writerow([])

                # 테이블 헤더
                writer.writerow([
                    '리소스 타입',
                    '규격 (W x H)',
                    '파일 형식',
                    '게임 내 위치\n(이미지 URL)',
                    '규격 설명\n(이미지 URL)',
                    '작업 체크리스트',
                    '주의사항',
                    '참고 자료',
                    '담당자',
                    '상태',
                    '완성도',
                    '다음 액션'
                ])

                # 각 리소스 상세 정보
                for r in sorted(data['resources'], key=lambda x: x.id):
                    result = self.reviewer.review_one(r.id)

                    # 규격 정보
                    size = f"{r.size_width} x {r.size_height}" if r.size_width and r.size_height else r.size_note or "미정"
                    file_format = self._get_file_format(r.resource_type)

                    # 체크리스트
                    checklist = self._get_checklist(r.resource_type)

                    # 주의사항
                    notes = self._get_work_notes(r.resource_type)

                    # 이미지 placeholder
                    location_image = "[게임 내 위치 스크린샷 URL]"
                    spec_image = "[규격 설명 이미지 URL]"

                    # 참고 자료
                    references = []
                    if r.detail_link:
                        references.append(r.detail_link)
                    reference_str = "\n".join(references) if references else "-"

                    # 다음 액션
                    next_action = result.next_actions[0] if result.next_actions else "-"

                    writer.writerow([
                        r.resource_type,
                        size,
                        file_format,
                        location_image,
                        spec_image,
                        checklist,
                        notes,
                        reference_str,
                        r.owner_art or "미정",
                        r.status,
                        f"{result.completeness_score}%",
                        next_action
                    ])

            print(f"✅ {filename}")
            generated_files.append(str(filename))

        return generated_files

    def _get_file_format(self, resource_type: str) -> str:
        """리소스 타입에 따른 권장 파일 형식"""
        resource_type_lower = resource_type.lower()

        if "초상" in resource_type_lower or "프로필" in resource_type_lower:
            return "PNG (투명 배경)"
        elif "배경" in resource_type_lower:
            return "JPG 또는 PNG"
        elif "엠블럼" in resource_type_lower or "아이콘" in resource_type_lower:
            return "PNG (투명 배경)"
        elif "배너" in resource_type_lower:
            return "JPG 또는 PNG"
        else:
            return "PNG"

    def _get_checklist(self, resource_type: str) -> str:
        """리소스 타입에 따른 작업 체크리스트"""
        resource_type_lower = resource_type.lower()

        if "초상" in resource_type_lower or "포토카드" in resource_type_lower:
            return """☐ 원본 이미지 수급
☐ 배경 제거 작업
☐ 사이즈 조정
☐ 색보정 및 후처리
☐ PNG 파일 내보내기
☐ 기획팀 검수
☐ 최종 승인"""

        elif "엠블럼" in resource_type_lower or "아이콘" in resource_type_lower:
            return """☐ 디자인 시안 작성
☐ 피드백 반영
☐ 최종안 확정
☐ 벡터화 작업
☐ 사이즈별 내보내기
☐ 검수 및 승인"""

        elif "배경" in resource_type_lower:
            return """☐ 컨셉 스케치
☐ 상세 작업
☐ 색감 조정
☐ 해상도 확인
☐ 최적화
☐ 검수 및 승인"""

        elif "배너" in resource_type_lower:
            return """☐ 레이아웃 기획
☐ 디자인 작업
☐ 텍스트 삽입
☐ 사이즈별 제작
☐ 다국어 버전 제작
☐ 검수 및 승인"""

        else:
            return """☐ 작업 시작
☐ 초안 작성
☐ 피드백 반영
☐ 최종 완성
☐ 검수
☐ 승인"""

    def _get_work_notes(self, resource_type: str) -> str:
        """리소스 타입에 따른 작업 주의사항"""
        resource_type_lower = resource_type.lower()

        if "초상" in resource_type_lower or "포토카드" in resource_type_lower:
            return """- 머리카락 끝부분까지 깔끔하게 따기
- 좌우 여백 최소 20px 확보
- 얼굴이 중앙에 위치하도록 배치
- 색감은 원본 유지
- 투명 배경 필수"""

        elif "엠블럼" in resource_type_lower or "아이콘" in resource_type_lower:
            return """- 단순하고 명확한 형태
- 작은 사이즈에서도 식별 가능하게
- 브랜드 아이덴티티 유지
- 벡터 원본 보관 필수"""

        elif "배경" in resource_type_lower:
            return """- 고해상도 유지
- 캐릭터가 돋보이도록 채도 조절
- 반복 패턴 확인
- 파일 용량 최적화"""

        elif "배너" in resource_type_lower:
            return """- 텍스트 가독성 최우선
- 다국어 버전 레이아웃 고려
- 모바일 화면 대응
- 클릭 영역 충분히 확보"""

        else:
            return """- 기획 의도 정확히 파악
- 스타일 가이드 준수
- 일정 준수"""

    def generate_csv_for_sheets(self, output_dir: str = "명세서"):
        """
        Google Sheets용 CSV 파일들 생성

        생성되는 파일:
        - 명세서_요약.csv: 프로젝트 요약 통계
        - 명세서_전체목록.csv: 전체 리소스 상세 목록
        - 명세서_우선순위.csv: 우선순위별 정렬
        """
        import csv

        resources = self.dm.fetch()
        project_review = self.reviewer.review_all()
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # 1. 요약 시트
        summary_file = output_path / "명세서_요약.csv"
        with open(summary_file, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['항목', '값'])
            writer.writerow(['생성일', datetime.now().strftime('%Y-%m-%d %H:%M')])
            writer.writerow(['총 리소스', f'{project_review.total_resources}개'])
            writer.writerow(['완료 (90% 이상)', f'{project_review.complete_count}개'])
            writer.writerow(['진행 중 (50-89%)', f'{project_review.in_progress_count}개'])
            writer.writerow(['불완전 (50% 미만)', f'{project_review.incomplete_count}개'])
            writer.writerow(['평균 완성도', f'{project_review.average_completeness}%'])
            writer.writerow([])
            writer.writerow(['아티스트별 통계'])
            stats = self.dm.stats()
            for artist, count in stats['by_artist'].items():
                if artist != "(empty)":
                    writer.writerow([artist, f'{count}개'])

        print(f"✅ {summary_file}")

        # 2. 전체 목록 시트
        full_list_file = output_path / "명세서_전체목록.csv"
        with open(full_list_file, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                'ID', '아티스트', '앨범', '카테고리', '리소스 타입',
                '사이즈', '상태', '우선순위', '아트 담당자', '기획 담당자',
                '완성도', '누락 항목', '다음 액션'
            ])

            for r in sorted(resources, key=lambda x: x.id):
                result = self.reviewer.review_one(r.id)
                size = f"{r.size_width}x{r.size_height}" if r.size_width and r.size_height else r.size_note or "-"
                missing = ", ".join(result.missing_fields[:3]) if result.missing_fields else "-"
                next_action = result.next_actions[0] if result.next_actions else "-"

                writer.writerow([
                    r.id,
                    r.artist or "-",
                    r.album or "-",
                    r.category_main or "-",
                    r.resource_type or "-",
                    size,
                    r.status,
                    r.priority or "medium",
                    r.owner_art or "-",
                    r.owner_planning or "-",
                    f"{result.completeness_score}%",
                    missing,
                    next_action
                ])

        print(f"✅ {full_list_file}")

        # 3. 우선순위별 시트
        priority_file = output_path / "명세서_우선순위.csv"
        with open(priority_file, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                '우선순위', 'ID', '아티스트', '리소스 타입',
                '상태', '마감일', '완성도', '다음 액션'
            ])

            # High priority 먼저
            for r in sorted(resources, key=lambda x: (
                0 if x.priority == "high" else 1 if x.priority == "medium" else 2,
                x.id
            )):
                result = self.reviewer.review_one(r.id)
                next_action = result.next_actions[0] if result.next_actions else "-"

                writer.writerow([
                    (r.priority or "medium").upper(),
                    r.id,
                    r.artist or "-",
                    r.resource_type or "-",
                    r.status,
                    r.due_date or "-",
                    f"{result.completeness_score}%",
                    next_action
                ])

        print(f"✅ {priority_file}")

        return {
            'summary': str(summary_file),
            'full_list': str(full_list_file),
            'priority': str(priority_file)
        }

    def generate_text_report(self) -> str:
        """간단한 텍스트 리포트 생성 (콘솔 출력용)"""
        project_review = self.reviewer.review_all()

        report = []
        report.append("=" * 70)
        report.append("  SSBL 아트 리소스 제작 명세서")
        report.append("=" * 70)
        report.append(f"생성일: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        report.append("")

        # 요약
        report.append("📊 프로젝트 요약")
        report.append("-" * 70)
        report.append(f"총 리소스: {project_review.total_resources}개")
        report.append(f"  🟢 완료: {project_review.complete_count}개")
        report.append(f"  🟡 진행 중: {project_review.in_progress_count}개")
        report.append(f"  🔴 불완전: {project_review.incomplete_count}개")
        report.append(f"평균 완성도: {project_review.average_completeness}%")
        report.append("")

        # 긴급 항목
        if project_review.critical_items:
            report.append("🔴 긴급 처리 필요:")
            for item in project_review.critical_items[:5]:
                report.append(f"  • {item}")
            report.append("")

        # 다음 할일
        if project_review.next_actions:
            report.append("📋 우선 처리 할일:")
            for action in project_review.next_actions[:5]:
                report.append(f"  • {action}")
            report.append("")

        report.append("=" * 70)

        return "\n".join(report)


# CLI 테스트
if __name__ == "__main__":
    print("=" * 70)
    print("  Spec Generator - 명세서 생성기")
    print("=" * 70)
    print()

    generator = SpecGenerator()

    # 1. 텍스트 리포트
    print("1️⃣ 텍스트 리포트 생성")
    print("-" * 70)
    report = generator.generate_text_report()
    print(report)
    print()

    # 2. 마크다운 명세서
    print("\n2️⃣ 마크다운 명세서 생성")
    print("-" * 70)
    output_path = "명세서/SSBL_명세서.md"
    generator.generate_markdown(output_path)
    print()

    # 3. CSV 명세서 (Google Sheets용)
    print("3️⃣ Google Sheets용 CSV 생성")
    print("-" * 70)
    csv_files = generator.generate_csv_for_sheets()
    print()

    # 4. 앨범별 상세 명세서
    print("4️⃣ 앨범별 상세 명세서 생성")
    print("-" * 70)
    album_files = generator.generate_album_sheets()
    print()

    print("=" * 70)
    print("✅ 명세서 생성 완료!")
    print("=" * 70)
    print()
    print(f"생성된 파일:")
    print(f"\n[기본 명세서]")
    print(f"  • {output_path}")
    print(f"  • {csv_files['summary']}")
    print(f"  • {csv_files['full_list']}")
    print(f"  • {csv_files['priority']}")
    print(f"\n[앨범별 상세 명세서] ({len(album_files)}개)")
    for album_file in album_files[:5]:  # 처음 5개만 표시
        print(f"  • {album_file}")
    if len(album_files) > 5:
        print(f"  ... 외 {len(album_files) - 5}개")
    print()
    print("💡 Google Sheets 업로드 방법:")
    print("   1. Google Sheets 열기")
    print("   2. 파일 > 가져오기")
    print("   3. 앨범별 CSV 파일들을 각각 새 탭으로 가져오기")
    print()
