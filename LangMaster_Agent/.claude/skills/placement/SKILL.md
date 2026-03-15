---
name: placement
description: "HSK 3.0 (9급) 대응 적응형 배치 테스트 생성"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Placement — HSK 배치 테스트 스킬

## 역할

신규 유저의 중국어 수준을 빠르게 진단하여 HSK 3.0 기준 적정 레벨(1-9급)에 배치한다.

## 테스트 설계

### 적응형 테스트 (CAT: Computerized Adaptive Testing)

```
시작: HSK 4 중간 난이도 문제 (9급 체계의 중간)
  ↓
정답 → 난이도 +1 (다음 HSK 레벨)
오답 → 난이도 -1 (이전 HSK 레벨)
  ↓
연속 3문제 결과로 수렴 판단
  ↓
초급(1-3) 판정: 12~15문제
중급(4-6) 판정: 15~20문제
고급(7-9) 판정: 20~25문제 (번역/문맥 문제 포함)
```

### 문제 유형 — 단계별

#### 초급 (HSK 1-3) 문제 유형

| 유형           | 비율 | 측정      |
| -------------- | ---- | --------- |
| 한자→뜻 선택   | 40%  | 어휘 인식 |
| 문장 빈칸      | 25%  | 문법+맥락 |
| 병음→한자 매칭 | 20%  | 발음 지식 |
| 문장 순서 배열 | 15%  | 구문 이해 |

#### 중급 (HSK 4-6) 추가 유형

| 유형        | 비율 | 측정      |
| ----------- | ---- | --------- |
| 장문 독해   | 20%  | 읽기 이해 |
| 유의어 구별 | 15%  | 어휘 깊이 |
| 문맥 추론   | 15%  | 문맥 파악 |

#### 고급 (HSK 7-9) 추가 유형

| 유형             | 비율 | 측정      |
| ---------------- | ---- | --------- |
| 한→중 번역 선택  | 20%  | 번역 능력 |
| 학술 텍스트 독해 | 15%  | 전문 읽기 |
| 성어/관용어 맥락 | 10%  | 고급 표현 |

### 배치 결과

```json
{
  "user_id": "user_001",
  "test_date": "2026-03-06",
  "hsk_version": "3.0",
  "questions_answered": 22,
  "result": {
    "overall_level": "HSK5",
    "stage": "intermediate",
    "sub_scores": {
      "vocabulary": "HSK5",
      "grammar": "HSK4",
      "reading": "HSK5",
      "translation": "HSK4",
      "context": "HSK5"
    },
    "recommended_start": "HSK4-Stage60",
    "weak_areas": ["grammar", "translation"],
    "strong_areas": ["vocabulary", "reading"],
    "confidence": 0.89,
    "legacy_equivalent": "구 HSK 4급"
  }
}
```

### 출력

- 테스트 문제 세트: `LangMaster_Agent/data/assessments/placement_v{n}.json`
- 결과: `LangMaster_Agent/data/profiles/{user_id}.json`
