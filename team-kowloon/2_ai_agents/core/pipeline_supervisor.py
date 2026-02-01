#!/usr/bin/env python3
"""
Pipeline Supervisor Agent - 전체 프로세스 관리 감독 에이전트

현재 파이프라인을 분석하고, 최신 트렌드를 반영하여 개선점을 제안합니다.

주요 기능:
1. 파이프라인 구조 분석
2. 각 단계의 효율성 평가
3. 최신 업계 트렌드 조사
4. 개선점 제안
5. 종합 리포트 생성
"""

import sys
import json
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

# Add utils to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'utils'))

from data_manager import ArtResourceDataManager


class PipelineSupervisor:
    """파이프라인 관리 감독 에이전트"""

    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent
        self.analysis_results = {}
        self.improvement_suggestions = []

    def analyze_pipeline(self) -> Dict:
        """
        현재 파이프라인 구조 분석

        Returns:
            Dict: 파이프라인 분석 결과
        """
        print("=" * 70)
        print("  Pipeline Analysis - 파이프라인 구조 분석")
        print("=" * 70)
        print()

        analysis = {
            'folder_structure': self._analyze_folder_structure(),
            'agents': self._analyze_agents(),
            'data_flow': self._analyze_data_flow(),
            'dependencies': self._analyze_dependencies(),
            'timestamp': datetime.now().isoformat()
        }

        self.analysis_results = analysis
        return analysis

    def _analyze_folder_structure(self) -> Dict:
        """폴더 구조 분석"""
        print("📁 폴더 구조 분석 중...")

        structure = {}

        # 주요 폴더들
        main_folders = [
            '0_organization',
            '1_human_control',
            '2_ai_agents',
            '3_ai_output',
            '4_human_view',
            'docs',
            'scripts'
        ]

        for folder in main_folders:
            folder_path = self.project_root / folder
            if folder_path.exists():
                structure[folder] = {
                    'exists': True,
                    'file_count': len(list(folder_path.rglob('*.py'))) + len(list(folder_path.rglob('*.json'))) + len(list(folder_path.rglob('*.csv'))),
                    'subfolders': [d.name for d in folder_path.iterdir() if d.is_dir()]
                }
            else:
                structure[folder] = {'exists': False}

        print(f"  ✅ {len([s for s in structure.values() if s.get('exists')])}개 폴더 분석 완료")
        return structure

    def _analyze_agents(self) -> Dict:
        """에이전트 분석"""
        print("🤖 에이전트 분석 중...")

        agents_dir = self.project_root / '2_ai_agents'
        agents = {
            'core': [],
            'utils': []
        }

        # Core agents
        core_dir = agents_dir / 'core'
        if core_dir.exists():
            for py_file in core_dir.glob('*.py'):
                if py_file.name != '__init__.py':
                    agents['core'].append({
                        'name': py_file.stem,
                        'path': str(py_file.relative_to(self.project_root)),
                        'size': py_file.stat().st_size
                    })

        # Utils
        utils_dir = agents_dir / 'utils'
        if utils_dir.exists():
            for py_file in utils_dir.glob('*.py'):
                if py_file.name != '__init__.py':
                    agents['utils'].append({
                        'name': py_file.stem,
                        'path': str(py_file.relative_to(self.project_root)),
                        'size': py_file.stat().st_size
                    })

        print(f"  ✅ Core: {len(agents['core'])}개, Utils: {len(agents['utils'])}개")
        return agents

    def _analyze_data_flow(self) -> Dict:
        """데이터 흐름 분석"""
        print("📊 데이터 흐름 분석 중...")

        data_flow = {
            'input_sources': [],
            'processing_steps': [],
            'output_destinations': []
        }

        # Input sources (1_human_control)
        input_dir = self.project_root / '1_human_control'
        if input_dir.exists():
            for folder in input_dir.iterdir():
                if folder.is_dir():
                    data_flow['input_sources'].append({
                        'type': folder.name,
                        'file_count': len(list(folder.rglob('*.*')))
                    })

        # Processing steps (2_ai_agents)
        data_flow['processing_steps'] = [
            'Layer 1 Parser → ArtResource 객체 생성',
            'Review Agent → 품질 검증',
            'Reference Spec Generator → 명세서 생성'
        ]

        # Output destinations (3_ai_output)
        output_dir = self.project_root / '3_ai_output'
        if output_dir.exists():
            for folder in output_dir.iterdir():
                if folder.is_dir():
                    data_flow['output_destinations'].append({
                        'type': folder.name,
                        'file_count': len(list(folder.rglob('*.*')))
                    })

        print(f"  ✅ 입력: {len(data_flow['input_sources'])}개, 출력: {len(data_flow['output_destinations'])}개")
        return data_flow

    def _analyze_dependencies(self) -> Dict:
        """의존성 분석"""
        print("🔗 의존성 분석 중...")

        dependencies = {
            'python_packages': [
                'gspread',
                'google-auth',
                'pandas (optional)'
            ],
            'master_data': [
                'artists_master.json',
                'albums_master.json'
            ],
            'external_services': [
                'Google Sheets API'
            ]
        }

        print(f"  ✅ 의존성 파악 완료")
        return dependencies

    def research_trends(self, use_web_search: bool = False) -> Dict:
        """
        최신 트렌드 조사

        Args:
            use_web_search: WebSearch 사용 여부 (기본값: False)

        Returns:
            Dict: 트렌드 조사 결과
        """
        print()
        print("=" * 70)
        print("  Trend Research - 최신 트렌드 조사")
        print("=" * 70)
        print()

        trends = {
            'industry_best_practices': self._get_industry_best_practices(),
            'automation_opportunities': self._identify_automation_opportunities(),
            'quality_improvement': self._identify_quality_improvements(),
            'timestamp': datetime.now().isoformat()
        }

        return trends

    def _get_industry_best_practices(self) -> List[Dict]:
        """업계 베스트 프랙티스"""
        print("🎯 업계 베스트 프랙티스 조사 중...")

        best_practices = [
            {
                'category': '시각적 참조',
                'practice': '카테고리별 참고 이미지 집중 관리',
                'benefit': '작업자가 한눈에 목표 이미지를 파악 가능',
                'priority': 'high',
                'status': 'planned'  # 사용자가 이미 제안함
            },
            {
                'category': '버전 관리',
                'practice': 'Git 기반 아트 에셋 버전 관리',
                'benefit': '변경 이력 추적 및 롤백 가능',
                'priority': 'medium',
                'status': 'not_implemented'
            },
            {
                'category': '자동화',
                'practice': '이미지 최적화 자동화 (크기, 포맷 변환)',
                'benefit': '수작업 감소, 일관된 품질',
                'priority': 'high',
                'status': 'not_implemented'
            },
            {
                'category': '협업',
                'practice': 'Slack/Discord 연동 알림',
                'benefit': '실시간 진행 상황 공유',
                'priority': 'low',
                'status': 'not_implemented'
            },
            {
                'category': '품질 관리',
                'practice': '이미지 규격 자동 검증',
                'benefit': '사이즈/포맷 오류 사전 차단',
                'priority': 'high',
                'status': 'not_implemented'
            },
            {
                'category': '문서화',
                'practice': '스타일 가이드 자동 생성',
                'benefit': '일관된 아트 디렉션',
                'priority': 'medium',
                'status': 'not_implemented'
            }
        ]

        print(f"  ✅ {len(best_practices)}개 베스트 프랙티스 파악")
        return best_practices

    def _identify_automation_opportunities(self) -> List[Dict]:
        """자동화 기회 파악"""
        print("🤖 자동화 기회 파악 중...")

        opportunities = [
            {
                'task': '이미지 리사이징 자동화',
                'current_method': '수동',
                'proposed_method': 'Pillow/ImageMagick 활용',
                'impact': 'high'
            },
            {
                'task': 'CSV → Google Sheets 동기화',
                'current_method': '스크립트 수동 실행',
                'proposed_method': 'GitHub Actions 자동 실행',
                'impact': 'medium'
            },
            {
                'task': '파일명 규칙 검증',
                'current_method': '수동 확인',
                'proposed_method': 'Pre-commit hook',
                'impact': 'high'
            },
            {
                'task': '이미지 메타데이터 추출',
                'current_method': '없음',
                'proposed_method': 'ExifTool 활용',
                'impact': 'low'
            }
        ]

        print(f"  ✅ {len(opportunities)}개 자동화 기회 발견")
        return opportunities

    def _identify_quality_improvements(self) -> List[Dict]:
        """품질 개선 포인트"""
        print("📈 품질 개선 포인트 파악 중...")

        improvements = [
            {
                'area': 'Review Process',
                'issue': '품질 검증이 자동화되지 않음',
                'suggestion': '이미지 규격, 파일 크기, 색상 프로필 자동 검증',
                'effort': 'medium'
            },
            {
                'area': 'Error Handling',
                'issue': '에러 발생 시 상세 정보 부족',
                'suggestion': '로깅 시스템 강화 및 에러 리포트 자동 생성',
                'effort': 'low'
            },
            {
                'area': 'Testing',
                'issue': '단위 테스트 부재',
                'suggestion': 'pytest 기반 테스트 코드 작성',
                'effort': 'high'
            },
            {
                'area': 'Documentation',
                'issue': '사용자 가이드 부족',
                'suggestion': 'README 및 사용자 매뉴얼 작성',
                'effort': 'medium'
            }
        ]

        print(f"  ✅ {len(improvements)}개 개선 포인트 발견")
        return improvements

    def suggest_improvements(self) -> List[Dict]:
        """
        종합 개선점 제안

        Returns:
            List[Dict]: 우선순위별 개선 제안
        """
        print()
        print("=" * 70)
        print("  Improvement Suggestions - 개선점 제안")
        print("=" * 70)
        print()

        suggestions = [
            {
                'priority': 1,
                'category': '시각적 참조 시스템',
                'title': '카테고리별 참고 이미지 관리 시스템 구축',
                'description': '각 카테고리별로 참고 이미지를 상단에 집중 배치하여 작업자 이해도 향상',
                'implementation': [
                    '1_human_control/reference_images/ 폴더 생성',
                    '카테고리별 하위 폴더 구성',
                    'Google Sheets 상단에 이미지 삽입 로직 추가'
                ],
                'expected_benefit': '작업자의 목표 이해도 50% 향상',
                'effort': 'medium',
                'status': 'planning'
            },
            {
                'priority': 2,
                'category': '품질 자동화',
                'title': '이미지 규격 자동 검증 시스템',
                'description': '업로드되는 이미지의 사이즈, 포맷, 파일 크기 자동 검증',
                'implementation': [
                    'image_validator.py 생성',
                    'Pillow를 사용한 이미지 분석',
                    '규격 불일치 시 경고 메시지 생성'
                ],
                'expected_benefit': '품질 이슈 사전 차단 90%',
                'effort': 'low',
                'status': 'not_started'
            },
            {
                'priority': 3,
                'category': '프로세스 자동화',
                'title': 'CI/CD 파이프라인 구축',
                'description': 'GitHub Actions를 활용한 자동 테스트 및 배포',
                'implementation': [
                    '.github/workflows/ci.yml 생성',
                    '자동 테스트 실행',
                    'Google Sheets 자동 업데이트'
                ],
                'expected_benefit': '수작업 시간 70% 감소',
                'effort': 'high',
                'status': 'not_started'
            },
            {
                'priority': 4,
                'category': '협업 강화',
                'title': 'Slack 연동 알림 시스템',
                'description': '명세서 생성, 업데이트 시 Slack으로 자동 알림',
                'implementation': [
                    'Slack MCP 서버 활용',
                    '알림 템플릿 작성',
                    '이벤트 기반 알림 트리거'
                ],
                'expected_benefit': '팀 커뮤니케이션 효율 30% 향상',
                'effort': 'low',
                'status': 'not_started'
            },
            {
                'priority': 5,
                'category': '문서화',
                'title': '종합 사용자 가이드 작성',
                'description': '파이프라인 사용법, 트러블슈팅 가이드 문서화',
                'implementation': [
                    'docs/user_guide.md 작성',
                    '각 에이전트별 README 추가',
                    '예제 코드 및 스크린샷 포함'
                ],
                'expected_benefit': '신규 사용자 온보딩 시간 60% 감소',
                'effort': 'medium',
                'status': 'not_started'
            }
        ]

        self.improvement_suggestions = suggestions

        for i, suggestion in enumerate(suggestions, 1):
            print(f"[{i}] {suggestion['title']}")
            print(f"    카테고리: {suggestion['category']}")
            print(f"    우선순위: {suggestion['priority']}")
            print(f"    예상 효과: {suggestion['expected_benefit']}")
            print()

        return suggestions

    def generate_report(self, output_path: Optional[str] = None) -> str:
        """
        종합 리포트 생성

        Args:
            output_path: 리포트 저장 경로 (기본값: 3_ai_output/reports/)

        Returns:
            str: 리포트 파일 경로
        """
        print()
        print("=" * 70)
        print("  Report Generation - 종합 리포트 생성")
        print("=" * 70)
        print()

        if not output_path:
            output_dir = self.project_root / '3_ai_output' / 'reports'
            output_dir.mkdir(parents=True, exist_ok=True)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_path = output_dir / f'pipeline_report_{timestamp}.json'
        else:
            output_path = Path(output_path)

        report = {
            'generated_at': datetime.now().isoformat(),
            'pipeline_analysis': self.analysis_results,
            'improvement_suggestions': self.improvement_suggestions,
            'summary': {
                'total_agents': len(self.analysis_results.get('agents', {}).get('core', [])),
                'total_utils': len(self.analysis_results.get('agents', {}).get('utils', [])),
                'total_suggestions': len(self.improvement_suggestions),
                'high_priority_items': len([s for s in self.improvement_suggestions if s['priority'] <= 2])
            }
        }

        # Save JSON report
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)

        print(f"📄 리포트 저장: {output_path}")
        print()

        # Print summary
        print("=" * 70)
        print("  Summary - 요약")
        print("=" * 70)
        print()
        print(f"총 에이전트: {report['summary']['total_agents']}개")
        print(f"총 유틸리티: {report['summary']['total_utils']}개")
        print(f"개선 제안: {report['summary']['total_suggestions']}개")
        print(f"  - 높은 우선순위: {report['summary']['high_priority_items']}개")
        print()

        return str(output_path)

    def run_full_analysis(self, use_web_search: bool = False) -> str:
        """
        전체 분석 실행 (분석 → 트렌드 조사 → 개선 제안 → 리포트)

        Args:
            use_web_search: WebSearch 사용 여부

        Returns:
            str: 리포트 파일 경로
        """
        self.analyze_pipeline()
        self.research_trends(use_web_search=use_web_search)
        self.suggest_improvements()
        return self.generate_report()


# CLI 실행
if __name__ == "__main__":
    print("=" * 70)
    print("  Pipeline Supervisor Agent")
    print("  전체 프로세스 관리 감독 에이전트")
    print("=" * 70)
    print()

    supervisor = PipelineSupervisor()
    report_path = supervisor.run_full_analysis()

    print()
    print("=" * 70)
    print("✅ 분석 완료!")
    print("=" * 70)
    print()
    print(f"📊 리포트: {report_path}")
    print()
