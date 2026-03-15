---
paths:
  - 'design/status.json'
  - 'design/specs/**'
  - 'design/levels/**'
  - 'design/ux/**'
---

# Handoff Protocol

## Design -> Implementation Flow

```
Step 1: Designer: /gd-experience → design/ux/
    ↓
Step 2: Designer: /gd-mechanic → design/specs/ (designStatus: ready)
    ↓
Step 3: Designer: /gd-verify-spec → 사전 검증 (구조/완성도)
    ↓
Step 4: Programmer: /pg-implement → src/ + tests/
    ↓
Step 5: Programmer: /pg-build-check → BUILD:PASS + TESTS:PASS
    ↓
Step 6: Programmer: /pg-wiring-check → WIRING:PASS
    ↓
Step 7: UI Designer: /ux-gate → UX-GATE:PASS
    ↓
Step 8: Programmer: /pg-deploy → Vercel
    ↓
Step 9: Programmer: /pg-playtest-trace → PLAYTEST-TRACE:PASS
    ↓
Step 10: Programmer: /design-status-sync → status.json
```

**Any FAIL at Steps 5-9 → loop back to Step 4**

## Mandatory Gate Chain (자동 체인)

배포(Step 8) 전에 아래 게이트가 **순서대로 PASS**되어야 합니다.
하나라도 FAIL이면 배포를 **거부**합니다.

```
Step 5: /pg-build-check → BUILD:PASS + TESTS:PASS
  ↓ (PASS 시 자동 진행)
Step 6: /pg-wiring-check → WIRING:PASS
  ↓ (PASS 시 자동 진행)
Step 7: /ux-gate → UX-GATE:PASS (UI 변경 시)
  ↓ (PASS 시 자동 진행)
Step 8: /pg-deploy → DEPLOY:SUCCESS
```

### 자동 진행 규칙

- Step 5 PASS → **즉시** Step 6 실행 (새 씬/플래그/모드 추가 시)
- Step 6 PASS → **즉시** Step 7 실행 (UI 변경 시)
- Step 7 PASS → **즉시** Step 8 실행
- 각 게이트에서 FAIL → **즉시 중단**, 수정 후 Step 5부터 재시작

### 게이트 생략 조건

- Step 6 (/pg-wiring-check): 씬 전환/플래그 변경 없는 순수 밸런스/텍스트 수정 시 생략 가능
- Step 7 (/ux-gate): **src/ui/ 또는 src/scenes/ 내 시각 요소 변경이 없는** 순수 로직/테스트 수정 시만 생략 가능
- Step 5 (/pg-build-check): **절대 생략 불가**

### Step 7 (/ux-gate) 필수 트리거 — M-012 방지

> 아래 파일 변경 시 `/ux-gate` 반드시 실행. verification-gates.md Gate 4 참조.

- `src/ui/*.ts` — 모든 UI 컴포넌트 (Overlay, Panel, Button 등)
- `src/scenes/*Scene.ts` — 씬 내 `.add.text()`, `.add.rectangle()`, 좌표/크기 변경
- 생략 시 `/pg-deploy` 거부

## Status Machine

```
designStatus: draft → ready → implemented
implStatus:   pending → in-progress → implemented → verified
                                    └→ revise
uxStatus:     (none) → experience-defined
```

## Key Paths

| Category        | Path                                   |
| --------------- | -------------------------------------- |
| UX Experience   | `design/ux/*-experience.md`            |
| Specs           | `design/specs/mechanics/SPEC-*.md`     |
| Level designs   | `design/levels/world-*/stage-*.md`     |
| Level JSONs     | `src/data/levels/world-*/stage-*.json` |
| Balance         | `design/balance/*.md`                  |
| Status tracking | `design/status.json`                   |
| Reference docs  | `design/reference/*.md`                |

## Parallel Work (Independent)

- **Designer** (`/gd-*`): future mechanics, level design, balance sheets
- **Programmer** (`/pg-*`): refactoring, bugs, performance, test coverage
- **Art Director** (`/art-*`): textures, particle effects, style audit
- **UI Designer** (`/ui-*`): layout improvements, animations, interactions
