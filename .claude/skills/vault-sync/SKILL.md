---
name: vault-sync
description: "HKD852 에이전트 산출물을 Obsidian Vault에 동기화합니다"
user-invocable: true
argument-hint: "[daily | meeting <제목> | decision <제목> | status]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: sonnet
model-reason: "구조화된 요약 + 파일 생성 — Sonnet 최적"
---

# Vault Sync 스킬

> HKD852 에이전트 작업 결과를 CEO의 Obsidian Vault에 동기화합니다.

## Vault 경로

```
VAULT_ROOT=/Users/yong/MainFolder/My_AI_Project/HKD852_Vault
```

## 서브커맨드

### 1. `daily` — 오늘의 데일리 노트 생성/업데이트

**절차:**

1. HKD852에서 오늘의 활동 수집:
   ```bash
   # 오늘 git 변경
   git log --since="today 00:00" --oneline --all
   # 최근 산출물
   find . -name "*.md" -o -name "*.html" -mtime -1 | grep -E "outputs|pipeline"
   ```

2. Secretary_Agent 브리핑이 있으면 읽기:
   ```
   Read: Secretary_Agent/outputs/daily_brief_YYYY-MM-DD.md
   ```

3. 칸반에서 오늘 진행 중인 태스크 확인:
   ```
   Read: PMO_Agent/kanban.json → status: "in_progress" 필터
   ```

4. Vault 데일리 노트 생성 또는 업데이트:
   ```
   파일: $VAULT_ROOT/01_Daily/YYYY/MM/YYYY-MM-DD.md
   ```

   **포맷:**
   ```markdown
   ---
   date: "YYYY-MM-DD"
   type: daily
   tags: [daily]
   ---

   # YYYY-MM-DD (요일)

   ## 🏢 오늘 할 일
   - [ ]

   ## 📝 메모

   ## 🗓️ 회의

   ## 💡 아이디어 / 결정

   ---

   > 아래는 HKD852 에이전트 영역입니다. `/vault-sync daily` 실행 시 자동 업데이트됩니다.

   ## 🤖 에이전트 브리핑
   > 마지막 동기화: YYYY-MM-DD HH:MM

   ### 어제 완료
   - [에이전트명] 작업 내용 — `산출물 경로`

   ### 오늘 진행 중
   - [칸반 태스크 목록]

   ### 이슈/블로커
   - (있으면 표시)

   ## 🤖 에이전트 태스크 (칸반)
   - [태스크 목록]
   ```

   **중요 — 영역 분리 규칙:**
   - 구분선(`---`) 위쪽 = Kowloon 개인 영역 → 절대 수정하지 않음
   - 구분선 아래쪽 = 에이전트 영역 → `## 🤖 에이전트 브리핑`과 `## 🤖 에이전트 태스크` 섹션만 교체
   - 파일이 없으면 템플릿(`_templates/Daily Note.md`) 기반으로 새로 생성

---

### 2. `meeting <제목>` — 회의록 생성

**절차:**

1. 사용자가 회의 내용을 구술하거나 요약 전달
2. Vault에 회의록 생성:
   ```
   파일: $VAULT_ROOT/05_Meetings/YYYY-MM-DD-<제목>.md
   ```

   **포맷:**
   ```markdown
   ---
   date: "YYYY-MM-DD"
   type: meeting
   tags: [meeting]
   attendees: []
   ---

   # 회의: <제목>

   ## 안건
   1.

   ## 논의 내용
   (내용 정리)

   ## 결정 사항
   -

   ## Action Items
   - [ ] @담당자 — 할 일 (기한)
   ```

3. 오늘 데일리 노트에 회의록 링크 추가:
   ```markdown
   - 회의: [[YYYY-MM-DD-<제목>]]
   ```

---

### 3. `decision <제목>` — 의사결정 기록

**절차:**

1. 결정 내용, 배경, 선택지를 정리
2. Vault에 의사결정 노트 생성:
   ```
   파일: $VAULT_ROOT/03_Decisions/YYYY-MM-DD-<제목>.md
   ```

   **포맷:**
   ```markdown
   ---
   date: "YYYY-MM-DD"
   type: decision
   status: decided
   tags: [decision]
   project:
   ---

   # 의사결정: <제목>

   ## 배경
   -

   ## 선택지
   | 옵션 | 장점 | 단점 |
   |------|------|------|
   | A |  |  |
   | B |  |  |

   ## 결정
   (최종 결정 내용)

   ## 근거
   (왜 이 결정을 했는지)
   ```

3. 오늘 데일리 노트에 결정 링크 추가

---

### 4. `status` — 프로젝트 상태 동기화

**절차:**

1. 칸반에서 프로젝트별 통계 수집:
   ```
   Read: PMO_Agent/kanban.json
   → 프로젝트별 backlog/in_progress/done 카운트
   ```

2. 각 프로젝트 폴더에 `_status.md` 업데이트:
   ```
   $VAULT_ROOT/02_Projects/WanChai/_status.md
   $VAULT_ROOT/02_Projects/SSBL/_status.md
   ...
   ```

   **포맷:**
   ```markdown
   ---
   date: "YYYY-MM-DD"
   type: status
   tags: [status, auto-generated]
   ---

   # 프로젝트 현황: <프로젝트명>

   > 마지막 동기화: YYYY-MM-DD HH:MM

   ## 칸반 요약
   | 상태 | 건수 |
   |------|------|
   | Backlog | N |
   | In Progress | N |
   | Done | N |

   ## 진행 중 태스크
   - [태스크명] (담당: OOO, 우선순위: high)

   ## 최근 완료
   - [태스크명] — 완료일
   ```

---

## 인자 처리

- `$ARGUMENTS`가 비어있으면: `daily` 실행 (기본값)
- `daily`: 데일리 노트 동기화
- `meeting <제목>`: 회의록 생성
- `decision <제목>`: 의사결정 기록
- `status`: 전체 프로젝트 상태 동기화

## 주의사항

- **CEO 영역 보호**: 데일리 노트의 `## CEO 메모` 이하 섹션은 절대 덮어쓰지 않음
- **Obsidian 호환**: `[[wikilink]]` 형식으로 노트 간 연결
- **frontmatter 필수**: 모든 생성 파일에 YAML frontmatter 포함
- **한글 파일명**: 날짜 + 한글 제목 조합 (예: `2026-03-08-임원회의.md`)
