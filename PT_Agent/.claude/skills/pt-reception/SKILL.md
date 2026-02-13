---
name: pt-reception
description: "PT 접수 데스크 - 요구사항을 5W1H로 분석하고 스펙 문서를 생성합니다"
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, AskUserQuestion
recommended-model: haiku
model-reason: "간단한 분류/분석 작업이므로 빠른 Haiku 모델 권장"
---

# 접수 데스크 에이전트

프레젠테이션 요구사항을 접수하고 체계적으로 분석합니다.

## 모델 권장사항

이 스킬은 **Haiku** 모델을 권장합니다:
- 5W1H 분류는 단순 분석 작업
- 빠른 응답이 사용자 경험에 중요
- 토큰 효율성 극대화

---

## 입력

사용자의 프레젠테이션 요청 또는 이전 단계에서 전달받은 요청

## 5W1H 분석 프레임워크

| 항목 | 질문 | 필수 |
|------|------|:----:|
| What | 무엇을 발표하는가? | ✓ |
| Why | 발표 목적은? | ✓ |
| Who | 청중은 누구인가? | ✓ |
| When | 발표 시간/일정은? | ✓ |
| Where | 발표 환경은? | - |
| How | 어떤 형식/스타일? | - |

## 필수 정보

정보가 부족하면 **반드시** `AskUserQuestion` 도구로 질문하세요:

- 발표 목적 (설득/정보전달/보고)
- 대상 청중 (임원/팀원/고객/일반)
- 발표 시간 (분 단위)
- 핵심 메시지 (한 문장)

---

# 컬러 팔레트 자동 선택 시스템

청중과 목적을 분석하여 최적의 팔레트를 **자동 결정**합니다.

## 팔레트 선택 매트릭스

### 청중 기반 우선 선택

| 청중 유형 | 1순위 팔레트 | 2순위 팔레트 | 이유 |
|----------|-------------|-------------|------|
| 투자자/임원 | Luxury Executive | Trust Blue | 신뢰감, 고급스러움 |
| 금융/컨설팅 | Trust Blue | Mono Contrast | 안정감, 전문성 |
| 개발자/IT | Modern Slate Dark | Tech Violet | 테크 친화적 |
| AI/혁신 분야 | Tech Violet | Cyber Neon | 미래지향, 창의성 |
| ESG/환경 | Emerald Nature | Modern Slate Dark | 지속가능성 연상 |
| 스타트업 피치 | Coral Energy | Tech Violet | 에너지, 열정 |
| 패션/뷰티 | Rose Minimal | Luxury Executive | 세련됨, 부드러움 |
| 법률/공공 | Mono Contrast | Trust Blue | 권위, 명확함 |
| 여행/푸드 | Sunset Warm | Coral Energy | 따뜻함, 친근함 |
| 게임/엔터 | Cyber Neon | Tech Violet | 대담함, 에너지 |

### 목적 기반 보정

| 목적 | 권장 팔레트 조정 |
|------|-----------------|
| 설득 (피치) | 악센트 강한 팔레트 선호 (Coral, Violet, Cyber) |
| 정보 전달 | 중립적 팔레트 선호 (Slate, Blue, Mono) |
| 보고 | 신뢰 기반 팔레트 선호 (Blue, Luxury, Mono) |
| 교육 | 친근한 팔레트 선호 (Slate, Emerald, Warm) |

### 분위기 키워드 매핑

| 키워드 | 팔레트 |
|--------|--------|
| 혁신, AI, 미래, 기술 | Tech Violet |
| 신뢰, 안정, 전문성 | Trust Blue |
| 고급, 럭셔리, 프리미엄 | Luxury Executive |
| 친환경, 지속가능, 성장 | Emerald Nature |
| 열정, 도전, 에너지 | Coral Energy |
| 세련됨, 미니멀, 모던 | Rose Minimal |
| 권위, 명확, 포멀 | Mono Contrast |
| 따뜻함, 환영, 친근 | Sunset Warm |
| 대담, 파격, 게임 | Cyber Neon |
| 범용, 테크, IT | Modern Slate Dark |

## 팔레트 결정 프로세스

```
1. 청중 유형 확인 → 1순위 팔레트 후보
2. 발표 목적 확인 → 팔레트 보정
3. 키워드 매칭 → 최종 확정
4. 불명확시 → Modern Slate Dark (기본값)
```

## 팔레트 코드 참조

| ID | 팔레트명 | 배경색 | 악센트 |
|----|----------|--------|--------|
| 01 | modern_slate_dark | #0F172A | #38BDF8 |
| 02 | luxury_executive | #0C0A09 | #FCD34D |
| 03 | trust_blue | #0C1929 | #0EA5E9 |
| 04 | tech_violet | #0F0720 | #8B5CF6 |
| 05 | emerald_nature | #022C22 | #10B981 |
| 06 | coral_energy | #1C1210 | #F97316 |
| 07 | rose_minimal | #1A1318 | #F43F5E |
| 08 | mono_contrast | #09090B | #FFFFFF |
| 09 | sunset_warm | #1C1412 | #F59E0B |
| 10 | cyber_neon | #020617 | #22D3EE |

---

## 출력: 스펙 문서

```yaml
# PT 스펙 문서
프로젝트_정보:
  프로젝트명: "[PT 제목]"
  생성일: "[YYYY-MM-DD]"
  버전: "v1"

발표_개요:
  목적: "[구체적인 발표 목적]"
  핵심_메시지: "[청중이 기억해야 할 한 문장]"
  예상_시간: "[N분]"
  발표_유형: "[설득/정보전달/보고/교육]"

청중_분석:
  대상: "[청중 특성]"
  규모: "[예상 인원]"
  사전_지식_수준: "[초급/중급/고급]"
  관심사: "[청중의 주요 관심사]"
  의사결정_권한: "[있음/없음/일부]"

콘텐츠_요구사항:
  필수_포함_내용:
    - "[항목1]"
    - "[항목2]"
  제외_사항:
    - "[민감정보 등]"
  참고_자료:
    - "[자료 경로 또는 링크]"

# ★ 팔레트 자동 결정 섹션
디자인_요구사항:
  선택된_팔레트: "[팔레트 ID와 이름]"  # 예: "04_tech_violet"
  팔레트_선택_이유: "[청중/목적 기반 선택 근거]"
  테마: "dark"  # 모든 팔레트가 다크 테마
  스타일: "[심플/모던/포멀]"
  브랜드_가이드: "[있음/없음]"
  특별_요청: "[있으면 기재]"

제약_사항:
  슬라이드_수: "[최대 N장]"
  금지_표현: "[있으면 기재]"
  기타: "[추가 제약]"
```

## 다음 단계

스펙 문서 생성 완료 후 `/pt-content`로 전달합니다.
