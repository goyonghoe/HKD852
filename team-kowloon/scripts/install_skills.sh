#!/bin/bash
# SSBL Claude Skills 자동 설치 스크립트
# 사용법: bash scripts/install_skills.sh

set -e  # 오류 시 즉시 종료

echo "🚀 SSBL Claude Skills 설치 시작..."
echo ""

# 1. Claude Skills 디렉토리 생성
echo "📁 ~/.claude/skills/ 디렉토리 생성 중..."
mkdir -p ~/.claude/skills
echo "   ✅ 디렉토리 생성 완료"
echo ""

# 2. 프로젝트 경로
PROJECT_ROOT="/Users/yong/MainFolder/My_AI_Project/HKD852/team-kowloon"
SKILLS_SOURCE="$PROJECT_ROOT/skills"

echo "📦 프로젝트 경로: $PROJECT_ROOT"
echo ""

# 3. 각 스킬 심볼릭 링크 생성
SKILLS=("ssbl-cto" "ssbl-art-lead" "ssbl-qa-lead" "ssbl-data-manager")

for skill in "${SKILLS[@]}"; do
    echo "🔗 $skill 설치 중..."

    # 소스 파일 존재 확인
    if [ ! -d "$SKILLS_SOURCE/$skill" ]; then
        echo "   ❌ 오류: $SKILLS_SOURCE/$skill 폴더를 찾을 수 없습니다"
        exit 1
    fi

    # 기존 링크/폴더 제거
    if [ -e ~/.claude/skills/$skill ]; then
        echo "   기존 $skill 제거 중..."
        rm -rf ~/.claude/skills/$skill
    fi

    # 심볼릭 링크 생성
    ln -s "$SKILLS_SOURCE/$skill" ~/.claude/skills/$skill
    echo "   ✅ $skill 설치 완료"
    echo ""
done

echo ""
echo "✨ 설치 완료!"
echo ""
echo "📋 설치된 스킬:"
ls -la ~/.claude/skills/ | grep ssbl
echo ""

# 검증
echo "🔍 설치 검증 중..."
for skill in "${SKILLS[@]}"; do
    if [ -f ~/.claude/skills/$skill/skill.py ]; then
        echo "   ✅ $skill/skill.py 존재"
    else
        echo "   ❌ $skill/skill.py 없음"
    fi
done
echo ""

echo "🎯 다음 단계:"
echo "1. 'claude' 명령어로 Claude Code 실행"
echo "2. 다음 명령어로 테스트:"
echo "   /ssbl-cto 안녕하세요"
echo "   /ssbl-data-manager 아티스트 목록"
echo ""
echo "📖 자세한 사용법:"
echo "   cat $PROJECT_ROOT/docs/guides/SKILLS_INSTALLATION_GUIDE.md"
echo ""
echo "✅ 모든 작업 완료!"
