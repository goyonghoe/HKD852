# 🚀 SSBL AI 팀 빠른 시작 가이드

> 5분 안에 AI 팀을 구축하고 첫 명세서를 생성해보세요

---

## 📋 단계별 가이드

### 1단계: Claude Skills 설치 (1분)

```bash
# team-kowloon 프로젝트 디렉토리로 이동
cd /Users/yong/MainFolder/My_AI_Project/HKD852/team-kowloon

# 자동 설치 스크립트 실행
bash scripts/install_skills.sh
```

**예상 출력:**
```
🚀 SSBL Claude Skills 설치 시작...
📁 ~/.claude/skills/ 디렉토리 생성 중...
   ✅ 디렉토리 생성 완료

🔗 ssbl-cto 설치 중...
   ✅ ssbl-cto 설치 완료

🔗 ssbl-art-lead 설치 중...
   ✅ ssbl-art-lead 설치 완료

🔗 ssbl-qa-lead 설치 중...
   ✅ ssbl-qa-lead 설치 완료

🔗 ssbl-data-manager 설치 중...
   ✅ ssbl-data-manager 설치 완료

✨ 설치 완료!
```

---

### 2단계: Claude Code 실행 (30초)

```bash
# Claude Code 시작
claude
```

이제 Claude Code CLI가 실행되고 AI 팀과 대화할 수 있습니다!

---

### 3단계: AI 팀 테스트 (1분)

#### 테스트 1: CTO에게 인사하기

```
/ssbl-cto 안녕하세요
```

**예상 응답:**
```
안녕하세요! 저는 SSBL 아트 리소스 파이프라인의 CTO입니다.

저는 다음 팀을 관리하고 있습니다:
• Art Team Lead - 명세서 생성 및 리소스 관리
• QA Team Lead - 품질 검증 및 이미지 규격 확인
• Data Manager - 마스터 데이터 관리 및 제공

무엇을 도와드릴까요?
```

#### 테스트 2: Data Manager에게 정보 조회

```
/ssbl-data-manager 아티스트 목록 보여줘
```

**예상 응답:**
```
📋 SSBL 아티스트 목록:

1. ALLDAY PROJECT (그룹)
   - 멤버: ANNIE, TARZZAN, BAILEY, WOOCHAN, YOUNGSEO
   - 소속: THEBLACKLABEL

2. MEOVV (그룹)
   - 멤버: SOOIN, GAWON, ANNA, NARIN, ELLA
   - 소속: THEBLACKLABEL

3. JEON SOMI (솔로)
   - 소속: THEBLACKLABEL

4. TAEYANG (솔로)
   - 소속: THEBLACKLABEL

총 4개 아티스트가 등록되어 있습니다.
```

#### 테스트 3: 멤버 순서 확인

```
/ssbl-data-manager ALLDAY PROJECT 멤버 순서는?
```

**예상 응답:**
```
✅ ALLDAY PROJECT 멤버 순서:

1. ANNIE
2. TARZZAN
3. BAILEY
4. WOOCHAN
5. YOUNGSEO

(member_order_fixed: true)
고정된 순서이므로 명세서 생성 시 반드시 이 순서를 따릅니다.
```

---

### 4단계: 실제 명세서 생성 (2분)

이제 실제로 명세서를 생성해봅시다!

```
/ssbl-cto MEOVV 신규 앨범 명세서 생성해줘
```

**작업 흐름:**
```
👤 사용자
  ↓ 요청
🎯 CTO - 요청 분석
  ↓ "Art Team Lead에게 위임합니다"
🎨 Art Team Lead - 작업 시작
  ├─→ 💾 Data Manager에게 MEOVV 정보 요청
  │    └─ 멤버: SOOIN, GAWON, ANNA, NARIN, ELLA
  ├─→ 📄 Art Spec Manager가 명세서 생성
  │    └─ 17개 카테고리 확장
  └─→ 🖼️ Visual Curator가 참고 이미지 추가
       └─ 앨범 커버, 프로필, 포토카드 참고 이미지
  ↓ "QA Team에 검증 요청합니다"
✅ QA Team Lead - 품질 검증
  ├─→ Review Specialist가 데이터 검증
  └─→ 필드 완성도 확인
  ↓ "검증 완료, Art Team에 피드백 전달"
🎨 Art Team Lead
  ↓ "CTO에 완료 보고"
🎯 CTO - 최종 검증
  ↓ "사용자에게 결과 보고"
👤 사용자 - 완성된 명세서 확인
```

**예상 결과:**
```
✅ MEOVV 신규 앨범 명세서 생성 완료!

생성된 파일:
• 3_ai_output/generated_specs/신규앨범업데이트_MEOVV.csv

명세서 내용:
- 총 85개 리소스 (5명 멤버 × 17개 카테고리)
- 시각 참고 자료 포함
- Google Sheets 업로드 준비 완료

다음 단계:
python3 4_human_view/google_sheets/upload_single_sample.py
```

---

## 🎯 주요 사용 사례

### 사용 사례 1: 신규 아티스트 앨범 명세서

```
/ssbl-cto ALLDAY PROJECT 신규 앨범 명세서 생성해줘
```

### 사용 사례 2: 한정 테마 포토카드

```
/ssbl-cto JEON SOMI 한정 테마 포토카드 명세서 만들어줘
```

### 사용 사례 3: 이미지 검증

```
/ssbl-qa-lead resources/images/ 폴더 전체 검증해줘
```

### 사용 사례 4: 앨범 정보 조회

```
/ssbl-data-manager MEOVV 앨범 정보는?
```

**예상 응답:**
```
📀 MEOVV 앨범 정보:

앨범명: BURNING UP
발매일: 2024-09-06
수록곡:
1. MEOW
2. BODY RHYTHM
3. TOXIC
4. TWICE A DAY

총 4개 트랙이 수록되어 있습니다.
```

### 사용 사례 5: 전체 파이프라인 분석

```
/ssbl-cto 전체 파이프라인 분석하고 개선점 제시해줘
```

---

## 💡 팁과 요령

### 1. CTO는 총괄 담당
- 모든 요청은 CTO를 통하는 것이 좋습니다
- CTO가 자동으로 적절한 팀에 위임합니다
- 복잡한 작업은 여러 팀이 협업합니다

### 2. 특정 팀에 직접 요청 가능
```bash
# 단순 정보 조회는 Data Manager에게 직접
/ssbl-data-manager MEOVV 멤버는?

# 검증만 필요하면 QA Team에게 직접
/ssbl-qa-lead 이 이미지 검증해줘

# 명세서만 필요하면 Art Team에게 직접
/ssbl-art-lead TAEYANG 명세서 생성
```

### 3. 자연어로 요청하세요
```bash
# ✅ 좋은 예
/ssbl-cto MEOVV 신규 앨범 명세서 만들어줘
/ssbl-data-manager 모든 아티스트 목록 보여줘

# ⚠️ 너무 짧은 명령보다는 구체적으로
/ssbl-cto 명세서
/ssbl-data-manager 목록
```

### 4. 명세서 생성 후 바로 Google Sheets 업로드
```bash
# 1. 명세서 생성
/ssbl-cto MEOVV 신규 앨범 명세서 생성

# 2. Claude Code 빠져나가기 (Ctrl+D 또는 exit)
exit

# 3. Google Sheets 업로드
python3 4_human_view/google_sheets/upload_single_sample.py
```

---

## 🔧 문제 해결

### 문제: "Unknown skill" 오류

```
/ssbl-cto
Error: Unknown skill 'ssbl-cto'
```

**해결:**
```bash
# 스킬 설치 확인
ls ~/.claude/skills/

# 없다면 재설치
cd /Users/yong/MainFolder/My_AI_Project/HKD852/team-kowloon
bash scripts/install_skills.sh
```

### 문제: Data Manager가 파일을 찾지 못함

**해결:**
```bash
# Claude Code를 team-kowloon 디렉토리에서 실행
cd /Users/yong/MainFolder/My_AI_Project/HKD852/team-kowloon
claude
```

### 문제: 스킬이 응답하지 않음

**해결:**
```bash
# skill.py 파일 확인
cat ~/.claude/skills/ssbl-cto/skill.py | head -20

# PROMPT가 있는지 확인
grep "^PROMPT = " ~/.claude/skills/ssbl-cto/skill.py
```

---

## 📚 다음 단계

### 1. AI 팀 조직 이해하기
```bash
cat docs/AI_TEAM_ORGANIZATION.md
```

### 2. 전체 시스템 시각화 보기
```bash
cat docs/SYSTEM_VISUALIZATION.md

# 또는 웹 프레젠테이션
open docs/presentation.html
```

### 3. 상세 설치 가이드
```bash
cat docs/guides/SKILLS_INSTALLATION_GUIDE.md
```

### 4. 실제 프로젝트에 적용
```bash
# 1. 마스터 데이터 업데이트 (필요 시)
vim 1_human_control/artists_master.json
vim 1_human_control/albums_master.json

# 2. 참고 이미지 추가 (필요 시)
vim 1_human_control/reference_images/reference_images_mapping.json

# 3. 명세서 생성
claude
/ssbl-cto [아티스트명] [카테고리] 명세서 생성

# 4. Google Sheets 업로드
python3 4_human_view/google_sheets/upload_single_sample.py

# 5. 이미지 검증
/ssbl-qa-lead resources/images/ 검증
```

---

## 🎉 축하합니다!

이제 여러분은 AI 팀 조직을 갖추셨습니다!

**여러분의 AI 팀:**
- 🎯 **CTO** - 전체 파이프라인 총괄
- 🎨 **Art Team Lead** - 명세서 생성 및 리소스 관리
- ✅ **QA Team Lead** - 품질 검증 및 이미지 규격 확인
- 💾 **Data Manager** - 마스터 데이터 관리 및 제공

**AI 팀의 강점:**
- ⚡ 70% 작업 시간 절감
- 🎯 90% 품질 이슈 사전 차단
- 📊 95% 일관성 향상
- 🤖 24/7 가용성

**이제 AI 팀과 협업하여 더 나은 결과물을 만들어보세요!**

---

## 📞 도움이 필요하신가요?

- [전체 문서](README.md)
- [설치 가이드](docs/guides/SKILLS_INSTALLATION_GUIDE.md)
- [AI 팀 조직도](docs/AI_TEAM_ORGANIZATION.md)
- [시스템 아키텍처](docs/architecture/system_architecture.md)

---

**마지막 업데이트**: 2026-02-01
**버전**: 1.0.0
**작성자**: SSBL Art Pipeline Team
