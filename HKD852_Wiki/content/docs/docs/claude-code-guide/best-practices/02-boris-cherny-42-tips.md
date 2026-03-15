# Claude Code 실전 팁 — HKD852 채택 가이드

> **출처**: [How Boris Uses Claude Code](https://howborisusesclaudecode.com/) — Boris Cherny, Anthropic Head of Claude Code (Claude Code 창시자)
>
> **핵심 철학**: "Claude Code를 사용하는 '하나의 정답'은 없다. 각자 실험하며 자신에게 맞는 방식을 찾아라."

### CEO 비판적 평가

42개 팁 중 실질적 팁은 15개 내외. 나머지는 기능 소개를 팁으로 포장. **이해충돌 주의**: Boris는 Claude Code 창시자이자 Anthropic 직원 = 자기 제품 마케팅. 비용 이야기가 단 한 줄도 없음. Anthropic 내부 = 무제한 API → "항상 Opus", "항상 High effort"는 Anthropic 매출 증가를 돕는 권고. "SQL 6개월 안 씀" = 역량 퇴화를 자랑으로 포장. HKD852는 비용 제약이 실재하므로 비판적으로 선택 적용한다.

---

## 채택 (5개) — 상세

### 1. PostToolUse 포맷팅 훅 (원본 #9)

**왜 좋은가**: 비용 0, 효과 확실. Claude 코드의 90%는 잘 포맷되지만 나머지 10%가 CI 실패를 유발. 훅이 자동으로 잡아준다.

**적용 방법**: `.claude/settings.json`에 추가.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bun run format || true"
          }
        ]
      }
    ]
  }
}
```

**HKD852 적용**: Next.js 프로젝트(PMO_Agent, Invest_Agent, Saju_Agent)에서 `prettier --write` 또는 `eslint --fix`로 교체.

---

### 2. 세밀한 권한 관리 (원본 #10)

**왜 좋은가**: 보안 강화, 비용 0. `--dangerously-skip-permissions` 대신 필요한 명령어만 사전 허용.

**적용 방법**: `/permissions`로 설정하거나 `.claude/settings.json`에 직접 추가.

```json
{
  "permissions": {
    "allow": [
      "Bash(bun run build:*)",
      "Bash(bun run lint:file:*)",
      "Bash(bun run test:*)",
      "Bash(bun run typecheck:*)",
      "Bash(find:*)"
    ]
  }
}
```

**HKD852 적용**: 에이전트별 허용 명령어 범위를 `.claude/settings.json`에 명시. 팀 공유 → git 체크인.

---

### 3. 실수→CLAUDE.md 축적 (원본 #16)

**왜 좋은가**: 이미 하고 있지만 더 체계적으로. Claude는 자신을 위한 규칙 작성에 뛰어남.

**적용 방법**: 매 수정 후 마무리 멘트를 습관화.

```
"Update your CLAUDE.md so you don't make that mistake again."
```

**HKD852 적용**: 에이전트별 CLAUDE.md에 실수 패턴 즉시 기록. MEMORY.md의 "자주 하는 실수 목록"과 연동. PR 리뷰에서 발견한 규칙도 CLAUDE.md에 추가.

---

### 4. Plan 모드 워크플로우 (원본 #6)

**왜 좋은가**: 1회 완성률 향상. 계획 단계에서 문제를 발견하면 구현 비용이 0.

**적용 방법**:

1. Plan 모드 진입 (Shift+Tab 2회)
2. Claude와 계획 반복 수정 → 만족스러우면
3. 자동 수락(auto-accept) 모드 전환 → Claude가 한 번에 구현

```
> i want to improve X feature.
▮▮ plan mode on (shift+tab to cycle)
```

**HKD852 적용**: Agent Teams에서 plan_mode_required 설정. 복잡한 기능(WanChai 게임 시스템, API 라우트 설계)은 반드시 Plan 모드 먼저.

---

### 5. 검증 루프 (원본 #13)

**왜 좋은가**: 가장 보편적인 진리. Claude에게 자신의 작업을 검증할 방법을 주면 품질이 2~3배 향상.

**적용 방법**: 도메인별 검증 수단을 항상 제공.

| 도메인            | 검증 수단                            |
| ----------------- | ------------------------------------ |
| Next.js           | `npm run build && npm test -- --run` |
| WanChai (Phaser)  | `npm run build` (TypeScript 컴파일)  |
| Python 파이프라인 | `python3 script.py --dry-run`        |
| API               | `curl` 또는 테스트 스크립트          |

**HKD852 적용**: Quality Gate + RedTeam 파이프라인이 이미 이 원칙. 작업 지시 시 "빌드+테스트 통과 후 완료 처리" 명시.

---

## 조건부 참고 (10개) — 비용/환경 조건 충족 시에만

| #   | 팁                     | 조건                                                    |
| --- | ---------------------- | ------------------------------------------------------- |
| 1   | 터미널 5탭 병렬 실행   | API 비용 여유 있을 때만. 5배 토큰 소모                  |
| 5   | PR @claude 태그        | GitHub Action 설치 비용 검토 후 적용                    |
| 14  | Git Worktree 병렬      | Agent Teams 사용 시 worktree 격리 고려                  |
| 17  | 반복 작업→Skill 변환   | 이미 112개 스킬 운영 중. 하루 1회 이상 작업 대상만 추가 |
| 18  | Slack MCP 버그 수정    | MCP 연동 안정화 후 적용                                 |
| 19  | 프롬프팅 수준 상향     | "prove it works", "grill me" 패턴 — 고품질 필요 시      |
| 21  | 서브에이전트 병렬 탐색 | 컨텍스트 보호 목적으로는 유효. 비용 감안                |
| 29  | 샌드박스               | 보안 민감 작업에 한해 활성화                            |
| 30  | 상태 라인              | `/statusline`으로 컨텍스트/비용 실시간 모니터링 — 권장  |
| 41  | /simplify              | 코드 변경 후 품질 개선. 비용 대비 효과 검토             |

---

## 무시 (27개) — 이유 포함

| #   | 팁                         | 무시 이유                                                    |
| --- | -------------------------- | ------------------------------------------------------------ |
| 2   | 웹/모바일 세션 병렬        | claude.ai/code 유료 플랜 필요, 비용 배증                     |
| 3   | 항상 Opus + High effort    | Anthropic 매출용 권고. Haiku/Sonnet으로 충분한 작업이 대부분 |
| 7   | 슬래시 커맨드 소개         | 이미 112개 운영. 기능 소개일 뿐 새 팁 아님                   |
| 8   | 서브에이전트 소개          | 이미 활용 중. 기능 소개                                      |
| 11  | MCP 소개                   | 이미 Slack/Jira MCP 연동. 기능 소개                          |
| 20  | Ghostty 터미널 추천        | 터미널 교체 필요, 현재 환경 충분                             |
| 22  | "SQL 6개월 안 씀"          | 역량 퇴화 자랑. Anthropic 무제한 API 환경의 착각             |
| 23  | Claude로 배우기            | 학습 목적 사용 — 생산성 작업이 우선                          |
| 24  | 터미널 테마/알림           | 개인 취향, 생산성 무관                                       |
| 25  | 항상 High effort           | 비용 고려 없는 권고. 작업별 모델 선택 유지                   |
| 26  | 플러그인 마켓플레이스      | 기능 소개                                                    |
| 27  | 커스텀 에이전트 소개       | 이미 활용 중. 기능 소개                                      |
| 28  | 권한 와일드카드 소개       | #10(채택)과 중복                                             |
| 31  | 키바인딩 커스터마이즈      | 개인 취향, 생산성 무관                                       |
| 32  | 훅 라이프사이클 소개       | #9(채택)으로 커버. 중복                                      |
| 33  | Spinner 동사 스타트렉 테마 | 장난 수준. 생산성 무관                                       |
| 34  | 출력 스타일 설정           | 개인 취향                                                    |
| 35  | 37가지 설정/84개 환경변수  | 기능 목록 나열. 팁 아님                                      |
| 36  | `claude --worktree` 소개   | 기능 소개. 필요 시 문서 참조                                 |
| 37  | Desktop Worktree 모드      | 기능 소개                                                    |
| 38  | 서브에이전트 Worktree 격리 | 대규모 마이그레이션 전용. HKD852 현재 불필요                 |
| 39  | 커스텀 에이전트에 Worktree | 기능 소개                                                    |
| 40  | 비 Git VCS 지원            | git 사용 중. 해당 없음                                       |
| 41  | /batch 소개                | 기능 소개. 필요 시 사용                                      |
| 4   | 팀 공유 CLAUDE.md 소개     | 이미 운영 중. 기능 소개                                      |
| 15  | 복잡한 작업 Plan 모드      | #6(채택)과 중복                                              |
| 42  | /simplify 소개             | 조건부 참고로 이동                                           |

---

## 출처

- [How Boris Uses Claude Code — 공식 42 Tips](https://howborisusesclaudecode.com/)
- [litmers — 한글 해설](https://litmers.com/blog/claude-code%EB%A5%BC-%EB%8D%9C-%EC%93%B0%EA%B3%A0-%EB%8D%94-%EB%A7%8E%EC%9D%B4-%EC%93%B0%EB%8A%94-%EB%B2%95-%ED%81%B4%EB%A1%9C%EB%93%9C%EC%BD%94%EB%93%9C-%EC%B0%BD%EC%8B%9C%EC%9E%90%EA%B0%80-%EC%95%8C%EB%A0%A4%EC%A3%BC%EB%8A%94-%EC%82%AC%EC%9A%A9-%EB%B2%95)
- [Boris Cherny Threads](https://www.threads.com/@boris_cherny/post/DTBVlMIkpcm)
- [Lenny's Newsletter — Head of Claude Code 인터뷰](https://www.lennysnewsletter.com/p/head-of-claude-code-what-happens)
