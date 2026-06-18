# 🔁 세션 핸드오프 — 네오플 오버킬 포폴 (2026-06-18 작업 마감)

> 새 세션은 이 문서부터 읽고 이어가면 됩니다. (이전 세션이 길어져 컨텍스트 압축 목적)

## 프로젝트

- **네오플 Overkill UI/UX 기획자 지원 포트폴리오** (슬라이드 덱 + 심화문서 2개), Vercel 배포.
- 폴더: `/Users/yong/MainFolder/My_AI_Project/HKD852/neople-portfolio/`
- 공개 URL(난수, 이것만 공유): **https://kp-portfolio-538759.vercel.app**

## ⚠️ 배포 루틴 (매번 이 3단계 — 빠뜨리면 안 됨)

```
vercel deploy --prod --yes
vercel alias set <새deployment> kp-portfolio-538759.vercel.app
vercel alias rm neople-portfolio.vercel.app --yes   # 매 배포마다 재생성되니 매번 제거(예측 도메인 차단)
```

브라우저 확인은 항상 `open -a Safari <url>` (기본=크롬이라 `open <url>` 금지).

## 파일 구조

- `index.html` — **10슬라이드 덱**(아래 구조). git 추적됨.
- `arpg-teardown.html` — UX 분석(PoE2↔D4 디렉터 발언 기준 7영역 비교). support.js 하네스.
- `ux-principles.html` — UX 원칙 가이드(오버킬 7원칙+하이브리드 매트릭스+안티패턴). support.js 하네스.
- `support.js` — 위 두 문서의 x-dc/helmet/data-reveal/progress 렌더 하네스(건드리지 말 것).
- `screenshots/` — 슈퍼스타(sm*\*/black*_), 복싱스타(bs\__), Match3(match3\_\*) 등.
- `_research_dossier.md` — **검증된 디렉터 발언 근거**(배포 제외). 인용 채울 때 여기서.
- `_REPORT_slide5.md` — 5페이지 자율작업 결과 리포트(채용담당자 3인 평결 포함).

## 10슬라이드 구조 (현재)

1. 헤드라인 — "시스템 기획·아트·개발의 언어를 UX로 번역" + 리드(골드 좌측바) + 불릿3
2. 핵심역량 — 5카드(부서간소통/시스템이해/UX판단/원칙과속도/글로벌리서치), 커스텀 SVG 아이콘
3. **대표경험·슈퍼스타**(달콤소프트) — case-hero(로비 분해) + 받침3쌍 + 색상 사고흐름(이슈/진단/기준/적용출시) + **줌 라이트박스 모달**
4. **대표경험·복싱스타→Match3**(챔피언스튜디오) — 앱아이콘 비교 + 4케이스 2×2(로비/UI컴포넌트/코스튬&인벤토리/코어컨셉) + **우측 세로 사고흐름** + 모달
5. 깊이보기 — 2카드: "게임 UX 분석"→arpg-teardown.html / "UX 원칙 가이드"→ux-principles.html
6. 디렉터 인용 ✎(미검증) · 7. 경력요약 ✎ · 8. 함께일하면 ✎ · 9. 제주정착 ✎ ← **뒷부분 빈칸(아래 TODO)**

## 디자인 시스템

- **덱(index.html)**: Pretendard, 다크+골드(#c9a227), 16:9 카드(scroll-snap, 다음장 엿보기), 폰트 floor 15px(1920 적응형 clamp). 라이트박스 모달=`img[data-group]/data-role` + JS의 `GROUP_LABEL/GROUP_DESC/GROUP_SIDES`(bs\* 그룹은 "Boxing Star→BS PvP Match3" 라벨). 앱아이콘 알파 마스크로 라운딩 일치.
- **심화문서**: x-dc+support.js+data-reveal, Pretendard/Nanum Myeongjo/JetBrains Mono, #14110c/#ece6d8/#a9a08c/#6f6755/#d8b15a/#c63f33.

## ✅ 이번 세션에 완료

- 슬라이드 1~4 레드팀 폴리싱(좌우구도/위계/색·라벨 통일/어포던스/여백).
- 슬라이드 5 심화문서 2종 **완성**(리서치 검증 + 레드팀 4라운드 + ui-craft + 3인 평결). 카드 미리보기 정합.
- 4페이지 케이스 매핑 확정(bs_X↔match3_X), 라벨 "UI 컴포넌트" 등.
- 공개용 "스캐폴드 v0" 자백 푸터 제거.

## 🎯 다음 우선순위 (채용담당자 3인 만장일치 — 합격선)

**덱 뒷부분 빈칸이 첫인상을 깎음. 심화문서는 강함. → 덱 빈칸을 大哥 본인 콘텐츠로 채우는 게 1순위.**

1. **07 경력 요약** — "7년+ 타임라인" ✎ (가장 치명적: 7년+ 채용인데 경력칸이 빔)
2. **08 함께 일하면** — 주장 3개의 "근거 한 줄" ✎×3
3. **06 디렉터 인용** — 미검증("⚠ 출처 확인 필요" 화면 노출). `_research_dossier.md`의 검증 근거로 교체.
4. **05 분석 격자** — 표 칸 ✎
5. **두 심화문서 스크린샷** — ✎ 점선 슬롯에 D4/PoE2(+오버킬 참고) 캡처.
   > ※ 경력·판단·점수는 **大哥 콘텐츠** — AI가 지어내면 안 됨(이력 신뢰 핵심).

## 🚫 함정/규칙 (반드시 지킬 것)

- index.html **git 추적됨** — 슬라이드 **덮어쓰기 금지, 새로 추가**. 큰 변경 전 커밋(과거 데이터 유실 사고 있었음 → [[protect-portfolio-work]] 메모리).
- 한국어 톤: 번역투·과시 회피, 사실로 담백·겸손, 자연스러운 한국어.
- 콘텐츠 아이콘에 이모지 금지(커스텀 SVG). 단 발사대 카드 이모지는 기존 유지 중.
- 디렉터 인용은 **검증된 것만**(가짜 verbatim=즉사). 영어 verbatim 인용 주의.
- 큰 산출물 작업은 워크플로우/레드팀(네오플 채용담당자 관점) 활용 가능.

## git 안전망

- 태그: `slide5-done`(최종) · `slide5-build-done` · `slide5-task-start` · `redteam-baseline`.
- 브랜치: `claude/create-test-claude-folder-yif6f` (origin 동기화됨).
- 최근 커밋 흐름: 슬라이드1~4 폴리싱 → 슬라이드5 문서(695945b0) → 2차폴리싱(34f3067d) → 푸터제거(cfce0972) → UI컴포넌트(b808942b).
