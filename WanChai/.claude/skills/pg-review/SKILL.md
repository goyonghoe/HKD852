---
name: pg-review
description: '코드 품질, 타입 안전성, 테스트 커버리지, 아키텍처 준수 리뷰'
user-invocable: true
argument-hint: '[scope] e.g. all, core, scenes, recent'
allowed-tools: Read, Bash, Glob, Grep
model: opus
---

# /pg-review — 코드 리뷰

## 역할

Programmer로서 코드 품질을 점검합니다.

## 체크리스트

### 아키텍처

- [ ] `core/`에 Phaser import 없음
- [ ] EventBus 이벤트 핸들러 누수 없음 (등록/해제 매칭)
- [ ] 씬 간 데이터 전달이 init() 파라미터 통해서만

### 타입 안전성

- [ ] `npm run build` (tsc --noEmit) 오류 없음
- [ ] `any` 타입 사용 없음
- [ ] 타입 단언(as) 최소화

### 테스트

- [ ] 모든 core/ 모듈에 테스트 존재
- [ ] `npm test` 전체 통과
- [ ] 새 기능에 대응하는 테스트 있음

### 밸런스 상수

- [ ] 매직 넘버 대신 `balance.ts` 상수 사용
- [ ] 색상 값은 `colors.ts` 참조

### 성능

- [ ] 불필요한 오브젝트 생성 루프 없음
- [ ] 씬 전환 시 리소스 정리

## 실행

```bash
npm run build 2>&1    # TS 컴파일 체크
npm test 2>&1         # 테스트 실행
```

## 산출물

리뷰 결과를 요약하여 사용자에게 보고.
