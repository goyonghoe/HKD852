#!/usr/bin/env python3
"""
Team Kowloon 폴더 재구조화 스크립트
"""

import os
import shutil
from pathlib import Path

# 현재 디렉토리
ROOT = Path(__file__).parent

# 새 폴더 구조 생성
NEW_STRUCTURE = {
    "0_organization": [],
    "1_human_control/reference_sheets": [],
    "1_human_control/config": [],
    "1_human_control/credentials": [],
    "2_ai_agents/core": [],
    "2_ai_agents/utils": [],
    "2_ai_agents/mcp_servers": [],
    "3_ai_output/layer2_data": [],
    "3_ai_output/generated_specs/요약": [],
    "3_ai_output/generated_specs/신규앨범업데이트": [],
    "3_ai_output/generated_specs/한정테마포토카드업데이트": [],
    "3_ai_output/generated_specs/이벤트패스": [],
    "3_ai_output/generated_specs/픽업뽑기상점": [],
    "3_ai_output/generated_specs/신규유저뽑기이벤트": [],
    "4_human_view/google_sheets": [],
    "docs/guides": [],
    "docs/architecture": [],
    "docs/analysis": [],
    "scripts": [],
}

# 파일 이동 매핑
FILE_MOVES = {
    # 0_organization/
    "PIPELINE_DESIGN.md": "0_organization/",
    "SYSTEM_DIAGRAM.md": "0_organization/",

    # 1_human_control/
    "ref_Constant.csv": "1_human_control/reference_sheets/",
    "ref_신규앨범_ADP.csv": "1_human_control/reference_sheets/",
    "ref_한정테마_ADP.csv": "1_human_control/reference_sheets/",
    "config.json": "1_human_control/config/",
    "service_account_key.json": "1_human_control/credentials/",

    # 2_ai_agents/
    "input_handler.py": "2_ai_agents/core/",
    "review_agent.py": "2_ai_agents/core/",
    "spec_generator.py": "2_ai_agents/core/",
    "data_manager.py": "2_ai_agents/utils/",

    # 3_ai_output/
    "명세서/SSBL_Layer2_새시트.csv": "3_ai_output/layer2_data/",
    "명세서/SSBL_명세서.md": "3_ai_output/generated_specs/",
    "명세서/명세서_요약.csv": "3_ai_output/generated_specs/요약/",
    "명세서/명세서_전체목록.csv": "3_ai_output/generated_specs/요약/",
    "명세서/명세서_우선순위.csv": "3_ai_output/generated_specs/요약/",

    # 4_human_view/
    "auto_upload_to_sheets.py": "4_human_view/google_sheets/",
    "upload_to_sheets.py": "4_human_view/google_sheets/",

    # docs/
    "README.md": "docs/",
    "CLAUDE.md": "docs/",
    "GOOGLE_SHEETS_UPLOAD.md": "docs/guides/",
    "JSON_KEY_다운로드_가이드.md": "docs/guides/",
    "SERVICE_ACCOUNT_SETUP.md": "docs/guides/",
    "NEXT_STEPS.md": "docs/guides/",
    "data-architecture.md": "docs/architecture/",
    "layer2-schema.md": "docs/architecture/",
    "ANALYSIS_레퍼런스시트_분석.md": "docs/analysis/",
    "FOLDER_RESTRUCTURE_PLAN.md": "docs/",

    # scripts/
    "complete_pipeline_demo.py": "scripts/",
    "demo.py": "scripts/",
    "convert_to_layer2.py": "scripts/",
}

# 패턴 기반 이동 (명세서 폴더 내 CSV들)
PATTERN_MOVES = {
    "명세서/신규앨범업데이트_*.csv": "3_ai_output/generated_specs/신규앨범업데이트/",
    "명세서/한정테마포토카드업데이트_*.csv": "3_ai_output/generated_specs/한정테마포토카드업데이트/",
    "명세서/이벤트패스_*.csv": "3_ai_output/generated_specs/이벤트패스/",
    "명세서/픽업뽑기상점_*.csv": "3_ai_output/generated_specs/픽업뽑기상점/",
    "명세서/신규유저뽑기이벤트_*.csv": "3_ai_output/generated_specs/신규유저뽑기이벤트/",
}


def create_structure():
    """새 폴더 구조 생성"""
    print("📁 새 폴더 구조 생성 중...")
    for folder in NEW_STRUCTURE.keys():
        folder_path = ROOT / folder
        folder_path.mkdir(parents=True, exist_ok=True)
        print(f"  ✅ {folder}/")


def move_files():
    """파일 이동"""
    print("\n📦 파일 이동 중...")

    # 개별 파일 이동
    for src, dst_dir in FILE_MOVES.items():
        src_path = ROOT / src
        dst_path = ROOT / dst_dir / Path(src).name

        if src_path.exists():
            dst_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src_path), str(dst_path))
            print(f"  ✅ {src} → {dst_dir}")
        else:
            print(f"  ⚠️  {src} (파일 없음)")

    # 패턴 기반 이동
    import glob
    for pattern, dst_dir in PATTERN_MOVES.items():
        files = glob.glob(str(ROOT / pattern))
        for file in files:
            file_path = Path(file)
            dst_path = ROOT / dst_dir / file_path.name
            dst_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(file_path), str(dst_path))
            print(f"  ✅ {file_path.name} → {dst_dir}")


def create_readme_files():
    """각 폴더에 README.md 생성"""
    print("\n📝 README 파일 생성 중...")

    readmes = {
        "0_organization/README.md": """# AI 에이전트 조직도

## 🎯 핵심 목표
SSBL 게임 아트 리소스 제작 명세서를 자동화하고 체계적으로 관리

## 🤖 에이전트 구성

### 1. Input Handler (입력 처리 에이전트)
- **역할**: 원본 CSV 데이터 수신 및 정제
- **페르소나**: 꼼꼼한 데이터 검증자
- **입력**: SSBL_Layer1.csv
- **출력**: 검증된 데이터

### 2. Review Agent (검토 에이전트)
- **역할**: 데이터 완성도 검토 및 이슈 발견
- **페르소나**: 엄격한 품질 관리자
- **입력**: 검증된 데이터
- **출력**: 완성도 점수, 이슈 리스트

### 3. Spec Generator (명세서 생성 에이전트)
- **역할**: 아티스트별/카테고리별 명세서 생성
- **페르소나**: 친절한 문서 작성자
- **입력**: 검토 결과
- **출력**: CSV/MD 명세서

## 🔄 파이프라인 흐름
원본 데이터 → Input Handler → Review Agent → Spec Generator → Google Sheets

자세한 내용은 [PIPELINE_DESIGN.md](PIPELINE_DESIGN.md) 참고
""",

        "1_human_control/README.md": """# 사람이 관리하는 영역

## 📂 구조

### reference_sheets/
레퍼런스 시트 (템플릿)
- ref_Constant.csv: 리소스 타입별 규격 정의
- ref_신규앨범_ADP.csv: 신규 앨범 명세서 템플릿
- ref_한정테마_ADP.csv: 한정 테마 명세서 템플릿

### config/
설정 파일
- config.json: 시스템 설정

### credentials/
인증 정보 (gitignore)
- service_account_key.json: Google Sheets API 인증키

## ⚠️ 주의사항
- credentials/ 폴더는 Git에 커밋되지 않습니다
- reference_sheets/는 명세서 생성 템플릿으로 사용됩니다
""",

        "2_ai_agents/README.md": """# AI 에이전트 코드

## 📂 구조

### core/
핵심 에이전트
- input_handler.py: 입력 처리
- review_agent.py: 검토
- spec_generator.py: 명세서 생성

### utils/
유틸리티
- data_manager.py: 데이터 관리

### mcp_servers/
MCP 서버 (향후 확장)

## 🔧 사용법

```python
from core.input_handler import InputHandler
from core.review_agent import ReviewAgent
from core.spec_generator import SpecGenerator

# 파이프라인 실행
handler = InputHandler()
reviewer = ReviewAgent()
generator = SpecGenerator()
```

import 경로가 변경되었으니 주의하세요!
""",

        "3_ai_output/README.md": """# AI 작업 결과물

## 📂 구조

### layer2_data/
Layer2 변환 데이터
- SSBL_Layer2_새시트.csv

### generated_specs/
생성된 명세서 (카테고리별 폴더 구분)
- 요약/
- 신규앨범업데이트/
- 한정테마포토카드업데이트/
- 이벤트패스/
- 픽업뽑기상점/
- SSBL_명세서.md

## 🔄 자동 생성
이 폴더의 파일들은 AI 에이전트가 자동으로 생성합니다.
수동으로 수정하지 마세요 (덮어씌워질 수 있음).
""",

        "4_human_view/README.md": """# 인간용 시각화

## 📂 구조

### google_sheets/
Google Sheets 업로드 스크립트
- auto_upload_to_sheets.py: 자동 업로드
- upload_to_sheets.py: 수동 업로드

## 🚀 사용법

```bash
# Google Sheets에 자동 업로드
cd 4_human_view/google_sheets
python3 auto_upload_to_sheets.py
```

## 🔗 Google Sheets URL
업로드 후 URL을 여기에 기록하세요
- 메인 시트: (입력 필요)
""",
    }

    for path, content in readmes.items():
        readme_path = ROOT / path
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ {path}")


def cleanup():
    """빈 폴더 정리"""
    print("\n🧹 정리 중...")

    # 빈 명세서 폴더 삭제
    old_specs = ROOT / "명세서"
    if old_specs.exists() and not any(old_specs.iterdir()):
        old_specs.rmdir()
        print("  ✅ 빈 '명세서' 폴더 삭제")


def update_gitignore():
    """gitignore 업데이트"""
    print("\n🔒 .gitignore 업데이트 중...")

    gitignore_path = ROOT / ".gitignore"

    new_entries = [
        "# Credentials",
        "1_human_control/credentials/",
        "service_account_key.json",
        "",
        "# Python",
        "__pycache__/",
        "*.pyc",
        "*.pyo",
        "",
        "# OS",
        ".DS_Store",
        "",
        "# AI Output (optional - 필요시 주석 해제)",
        "# 3_ai_output/",
    ]

    # 기존 내용 읽기
    existing = []
    if gitignore_path.exists():
        with open(gitignore_path, 'r', encoding='utf-8') as f:
            existing = f.read().splitlines()

    # 중복 제거하고 추가
    combined = existing + [e for e in new_entries if e not in existing]

    with open(gitignore_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(combined))

    print("  ✅ .gitignore 업데이트 완료")


def create_agents_roles():
    """AGENTS_ROLES.md 생성"""
    print("\n📋 AGENTS_ROLES.md 생성 중...")

    content = """# AI 에이전트 역할 및 페르소나 정의

## 🎯 프로젝트 목표
SSBL 게임 아트 리소스 제작 프로세스를 자동화하고,
아티스트와 기획자가 협업할 수 있는 명세서를 자동 생성한다.

---

## 🤖 에이전트 1: Input Handler

### 역할
원본 CSV 데이터를 받아서 검증하고 정제하는 입력 게이트키퍼

### 페르소나
**"꼼꼼한 데이터 검증자"**
- 누락된 필수 항목을 발견하는 예리한 눈
- 데이터 형식 오류를 절대 놓치지 않음
- 다음 단계로 넘어가기 전 완벽한 검증 수행

### 핵심 기능
- CSV 파일 파싱
- 필수 컬럼 검증 (artist, category_main, resource_type, etc.)
- 데이터 타입 검증 (size_width/height는 숫자형)
- Layer2 형식으로 변환

### 입력
- `SSBL_Layer1.csv` (원본 데이터)

### 출력
- 검증된 ArtResource 객체 리스트
- 검증 오류 리포트

---

## 🤖 에이전트 2: Review Agent

### 역할
리소스 데이터의 완성도를 평가하고 이슈를 발견하는 품질 관리자

### 페르소나
**"엄격한 품질 관리자"**
- 완성도를 정량적으로 평가
- 우선순위와 마감일을 놓치지 않음
- 다음 액션을 명확하게 제시

### 핵심 기능
- 완성도 점수 계산 (0-100%)
- 누락 항목 발견
- 우선순위 이슈 탐지
- 다음 액션 제안

### 입력
- ArtResource 객체 리스트

### 출력
- ReviewResult (완성도 점수, 이슈 리스트, 다음 액션)

---

## 🤖 에이전트 3: Spec Generator

### 역할
검토된 데이터를 바탕으로 인간 친화적인 명세서를 생성하는 문서 작성자

### 페르소나
**"친절한 문서 작성자"**
- 아티스트가 이해하기 쉬운 명세서 작성
- 시각적으로 보기 좋은 포맷 (마크다운, CSV)
- 우선순위와 완성도를 한눈에 파악 가능하게

### 핵심 기능
- 마크다운 명세서 생성
- CSV 명세서 생성 (Google Sheets용)
- 카테고리+앨범별 상세 시트 생성
- 요약, 우선순위별 정렬

### 입력
- ArtResource 객체 리스트
- ReviewResult

### 출력
- `SSBL_명세서.md` (마크다운)
- `명세서_요약.csv`, `명세서_전체목록.csv`, `명세서_우선순위.csv`
- 카테고리+앨범별 상세 CSV

---

## 🔄 에이전트 협업 흐름

```
[원본 데이터]
    ↓
[Input Handler] ──→ "데이터 정제 완료!"
    ↓
[Review Agent] ──→ "완성도 70%, 이슈 5건 발견"
    ↓
[Spec Generator] ──→ "명세서 20개 생성 완료!"
    ↓
[Google Sheets]
```

---

## 🎨 확장 가능성

### 향후 추가 에이전트
1. **Image Validator**: 이미지 파일 검증 (해상도, 포맷, 용량)
2. **Asset Packager**: 리소스 패키징 및 배포
3. **Notification Agent**: Slack/Discord 알림
4. **Dashboard Generator**: 실시간 진행률 대시보드

---

## 📊 성공 지표

- **정확도**: 데이터 검증 오류율 < 1%
- **완성도**: 평균 완성도 > 80%
- **효율성**: 수동 작업 대비 90% 시간 단축
- **만족도**: 아티스트/기획자 만족도 > 4.5/5

"""

    path = ROOT / "0_organization" / "AGENTS_ROLES.md"
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✅ 0_organization/AGENTS_ROLES.md")


def main():
    """메인 실행"""
    print("=" * 70)
    print("  Team Kowloon 폴더 재구조화")
    print("=" * 70)
    print()

    try:
        create_structure()
        move_files()
        create_readme_files()
        create_agents_roles()
        cleanup()
        update_gitignore()

        print("\n" + "=" * 70)
        print("  ✅ 재구조화 완료!")
        print("=" * 70)
        print()
        print("📂 새 폴더 구조:")
        print("  0_organization/      - AI 조직도")
        print("  1_human_control/     - 사람 관리 영역")
        print("  2_ai_agents/         - AI 에이전트 코드")
        print("  3_ai_output/         - AI 결과물")
        print("  4_human_view/        - 시각화")
        print("  docs/                - 문서")
        print("  scripts/             - 스크립트")
        print()
        print("⚠️  다음 단계:")
        print("  1. Python import 경로 수정 필요")
        print("  2. 스크립트 테스트 실행")
        print()

    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
