"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDarkMode } from "@/hooks/useDarkMode";

/* ── Section Data ──────────────────────────────────────────────── */

const SECTIONS = [
  { id: "overview", label: "개요" },
  { id: "quickstart", label: "시작하기" },
  { id: "views", label: "뷰 모드" },
  { id: "core", label: "핵심 기능" },
  { id: "productivity", label: "생산성 도구" },
  { id: "mobile", label: "모바일" },
  { id: "dashboard", label: "대시보드" },
  { id: "notifications", label: "알림" },
  { id: "darkmode", label: "다크모드" },
  { id: "activity", label: "활동 기록" },
  { id: "settings", label: "설정" },
  { id: "telegram", label: "텔레그램 비서" },
  { id: "tips", label: "활용 팁" },
] as const;

/* ── Keyboard Shortcut Data ────────────────────────────────────── */

const SHORTCUTS = [
  { keys: ["t", "n"], desc: "새 태스크 빠른 추가" },
  { keys: ["/"], desc: "검색창 포커스" },
  { keys: ["r"], desc: "새로고침" },
  { keys: ["Esc"], desc: "모달 닫기 / 선택 해제" },
];

/* ── Accordion State Type ──────────────────────────────────────── */

type AccordionKey = string;

/* ── Component ─────────────────────────────────────────────────── */

export default function WikiPage() {
  const router = useRouter();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [activeSection, setActiveSection] = useState("overview");
  const [openAccordions, setOpenAccordions] = useState<Set<AccordionKey>>(
    new Set(),
  );
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Intersection observer for active section tracking
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const ids = SECTIONS.map((s) => s.id);

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        { rootMargin: "-120px 0px -60% 0px", threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Scroll active tab into view in tab bar
  useEffect(() => {
    if (!tabBarRef.current) return;
    const activeTab = tabBarRef.current.querySelector(
      `[data-tab="${activeSection}"]`,
    );
    if (activeTab) {
      (activeTab as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeSection]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const toggleAccordion = useCallback((key: AccordionKey) => {
    setOpenAccordions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#0f0f0f] pb-20 sm:pb-0">
      {/* Mobile back button */}
      <div className="sm:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
        <button
          onClick={() => router.back()}
          className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          뒤로
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          위키
        </span>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-4">
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
            Ultra Task Board
          </h1>
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <Link
              href="/tree"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Tree
            </Link>
            <Link
              href="/"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Board
            </Link>
            <Link
              href="/table"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Table
            </Link>
            <Link
              href="/timeline"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Timeline
            </Link>
            <Link
              href="/calendar"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Calendar
            </Link>
            <Link
              href="/list"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              List
            </Link>
            <Link
              href="/stats"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Stats
            </Link>
            <Link
              href="/activity"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Activity
            </Link>
            <Link
              href="/wiki"
              className="px-2 sm:px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
            >
              Wiki
            </Link>
            <Link
              href="/settings"
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="설정"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Link>
          </nav>
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="다크모드 전환"
        >
          {isDark ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
      </header>

      {/* Horizontal Scroll Tab Bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] shrink-0">
        <div
          ref={tabBarRef}
          className="flex gap-1.5 px-3 py-2 overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              data-tab={s.id}
              onClick={() => scrollTo(s.id)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                activeSection === s.id
                  ? "bg-blue-500 text-white font-medium shadow-sm"
                  : "bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#303030]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 pb-20">
          {/* ── 1. 개요 ──────────────────────────────────── */}
          <section id="overview" className="scroll-mt-28">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl px-4 py-5 sm:p-8 border border-blue-100 dark:border-blue-900/40">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                TaskBoard
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                개인용 칸반 태스크 매니저입니다. 6단계 컬럼(Backlog부터
                Done까지)으로 업무를 관리하며, 드래그 앤 드롭, 실시간 동기화,
                캘린더 스케줄링, 분석 대시보드, 모바일 최적화를 지원하는
                PWA입니다.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "칸반 보드",
                  "캘린더 뷰",
                  "실시간 동기화",
                  "PWA / 오프라인",
                  "다크모드",
                  "분석 대시보드",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ── 2. 시작하기 ──────────────────────────────── */}
          <section id="quickstart" className="scroll-mt-28">
            <SectionHeading>시작하기</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StepCard
                step={1}
                title="태스크 만들기"
                desc="오른쪽 하단 파란색 + 버튼을 탭하거나 키보드에서 T를 누르세요. 제목을 입력하고 Enter를 누르면 오늘 컬럼에 추가됩니다."
              />
              <StepCard
                step={2}
                title="정리하기"
                desc="태스크를 컬럼 간에 드래그하세요. Backlog, 이번 주, 오늘, 진행 중, 대기, 완료 6단계입니다. 모바일에서는 스와이프로 완료/삭제할 수 있습니다."
              />
              <StepCard
                step={3}
                title="리뷰하기"
                desc="Stats에서 분석 확인, Calendar에서 시간 블록 스케줄링, Activity에서 변경 이력을 추적하세요."
              />
            </div>
          </section>

          {/* ── 3. 뷰 모드 ──────────────────────────────── */}
          <section id="views" className="scroll-mt-28">
            <SectionHeading>뷰 모드</SectionHeading>
            <div className="space-y-2.5">
              <ViewCard
                name="Board"
                path="/"
                desc="메인 칸반 보드입니다. 6개 컬럼에 드래그 앤 드롭, WIP 제한, 인라인 태스크 생성, 모바일 스와이프를 지원합니다."
              />
              <ViewCard
                name="Calendar"
                path="/calendar"
                desc="주간 캘린더 그리드(월-일, 8:00-22:00)입니다. 날짜만 설정하면 종일 이벤트, 시작/종료 시간을 설정하면 타임 블록으로 표시됩니다."
              />
              <ViewCard
                name="List"
                path="/list"
                desc="전체 태스크를 테이블 형태로 봅니다. 제목/상태/우선순위 등 정렬 가능하며, 선택 모드와 핀 고정을 지원합니다."
              />
              <ViewCard
                name="Stats"
                path="/stats"
                desc="8가지 차트: 상태 도넛, 주간 완료 추이, 스프린트 번다운, 벨로시티, 완료 시간 분포, 예측 정확도, 우선순위 분포, 태그 클라우드."
              />
              <ViewCard
                name="Activity"
                path="/activity"
                desc="모든 태스크 변경 이력을 시간순으로 보여줍니다. 생성/수정/이동/완료/삭제/복원 내역과 필드별 변경 내용을 확인할 수 있습니다."
              />
              <ViewCard
                name="Settings"
                path="/settings"
                desc="일일 용량, 예측 보정 계수, 컬럼별 WIP 제한, 다크모드, 데이터 내보내기(JSON), 완료 태스크 일괄 삭제를 설정합니다."
              />
            </div>
          </section>

          {/* ── 4. 핵심 기능 ─────────────────────────────── */}
          <section id="core" className="scroll-mt-28">
            <SectionHeading>핵심 기능</SectionHeading>
            <div className="space-y-2">
              <Accordion
                title="태스크 관리"
                isOpen={openAccordions.has("task-mgmt")}
                onToggle={() => toggleAccordion("task-mgmt")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    어떤 컬럼에서든 인라인으로 생성하거나, Quick Add FAB, 또는{" "}
                    <Kbd>t</Kbd> 키로 빠르게 추가
                  </li>
                  <li>
                    <Bullet />
                    태스크를 탭하면 상세 모달에서 모든 필드 편집 가능
                  </li>
                  <li>
                    <Bullet />
                    컬럼 간 드래그 앤 드롭으로 상태 변경 (데스크톱 및 모바일)
                  </li>
                  <li>
                    <Bullet />
                    호버 시 화살표 버튼으로 인접 컬럼 이동
                  </li>
                  <li>
                    <Bullet />x 버튼으로 삭제, 5초 이내 토스트에서 되돌리기 가능
                  </li>
                  <li>
                    <Bullet />
                    자동 타임스탬프: 진행 중으로 이동 시 started_at, 완료 시
                    completed_at 기록
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="하위 태스크 & 체크리스트"
                isOpen={openAccordions.has("subtasks")}
                onToggle={() => toggleAccordion("subtasks")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    카드의 &quot;+ sub&quot; 버튼 또는 태스크 모달에서 하위
                    태스크 추가
                  </li>
                  <li>
                    <Bullet />
                    부모 카드에 진행률 배지 표시 (예: 2/5)
                  </li>
                  <li>
                    <Bullet />
                    체크박스로 완료/미완료 전환
                  </li>
                  <li>
                    <Bullet />
                    하위 태스크는 메인 컬럼 뷰에 표시되지 않음 (부모만 노출)
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="우선순위 시스템"
                isOpen={openAccordions.has("priority")}
                onToggle={() => toggleAccordion("priority")}
              >
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    4단계 우선순위, 각각 고유 색상 배지:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <PriorityBadge
                      level="critical"
                      color="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                    />
                    <PriorityBadge
                      level="high"
                      color="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                    />
                    <PriorityBadge
                      level="mid"
                      color="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                    />
                    <PriorityBadge
                      level="low"
                      color="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    태스크 모달이나 일괄 작업에서 설정할 수 있습니다.
                  </p>
                </div>
              </Accordion>

              <Accordion
                title="태그"
                isOpen={openAccordions.has("tags")}
                onToggle={() => toggleAccordion("tags")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    태스크 모달에서 쉼표로 구분하여 태그 입력 (예:
                    &quot;frontend, bug&quot;)
                  </li>
                  <li>
                    <Bullet />
                    태스크 카드에 파란색 칩으로 표시
                  </li>
                  <li>
                    <Bullet />
                    검색 필터 패널에서 태그별 필터링
                  </li>
                  <li>
                    <Bullet />
                    여러 태스크에 일괄 태그 추가 가능
                  </li>
                  <li>
                    <Bullet />
                    Stats 대시보드에서 태그 클라우드 시각화
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="스케줄링"
                isOpen={openAccordions.has("scheduling")}
                onToggle={() => toggleAccordion("scheduling")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    태스크 모달에서 마감일, 시작/종료 시간 설정
                  </li>
                  <li>
                    <Bullet />
                    마감일 배지:{" "}
                    <span className="text-red-600 font-medium">지남</span>
                    (빨강),{" "}
                    <span className="text-amber-600 font-medium">오늘</span>
                    (주황), <span className="text-blue-500">내일</span>(파랑)
                  </li>
                  <li>
                    <Bullet />
                    날짜만 설정하면 캘린더에서 종일 이벤트로 표시
                  </li>
                  <li>
                    <Bullet />
                    시작+종료 시간을 설정하면 타임 블록으로 표시
                  </li>
                  <li>
                    <Bullet />
                    .ics 파일로 내보내기하여 Apple Calendar / Google Calendar와
                    동기화
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="반복 태스크"
                isOpen={openAccordions.has("recurring")}
                onToggle={() => toggleAccordion("recurring")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    태스크 모달에서 매일/매주/매월 반복 설정
                  </li>
                  <li>
                    <Bullet />
                    카드에 반복 배지 표시:{" "}
                    <span className="text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded text-xs border border-purple-200 dark:border-purple-800">
                      D
                    </span>{" "}
                    <span className="text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded text-xs border border-purple-200 dark:border-purple-800">
                      W
                    </span>{" "}
                    <span className="text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded text-xs border border-purple-200 dark:border-purple-800">
                      M
                    </span>
                  </li>
                  <li>
                    <Bullet />
                    반복 태스크 완료 시, 다음 날짜로 새 복사본이 오늘 컬럼에
                    자동 생성
                  </li>
                  <li>
                    <Bullet />
                    완료된 인스턴스는 추적을 위해 Done에 유지
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="태스크 의존성"
                isOpen={openAccordions.has("deps")}
                onToggle={() => toggleAccordion("deps")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    태스크 모달의 &quot;차단 조건&quot;에서 다른 태스크를 검색
                    및 선택
                  </li>
                  <li>
                    <Bullet />
                    차단된 태스크는 빨간 잠금 배지와 60% 투명도로 표시
                  </li>
                  <li>
                    <Bullet />
                    모달에서 차단 조건을 제거 가능한 칩으로 표시
                  </li>
                  <li>
                    <Bullet />
                    모든 차단 태스크가 Done으로 이동하면 자동 차단 해제
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="즐겨찾기 / 핀 고정"
                isOpen={openAccordions.has("favorites")}
                onToggle={() => toggleAccordion("favorites")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    태스크 카드의 별 아이콘을 클릭하여 컬럼 상단에 고정
                  </li>
                  <li>
                    <Bullet />
                    고정된 태스크는 항상 최상단에 정렬
                  </li>
                  <li>
                    <Bullet />
                    Board와 List 뷰 모두에서 동작
                  </li>
                  <li>
                    <Bullet />핀 상태는 데이터베이스에 저장되어 세션 간 유지
                  </li>
                </ul>
              </Accordion>
            </div>
          </section>

          {/* ── 5. 생산성 도구 ──────────────────────────── */}
          <section id="productivity" className="scroll-mt-28">
            <SectionHeading>생산성 도구</SectionHeading>
            <div className="space-y-2">
              <Accordion
                title="키보드 단축키"
                isOpen={openAccordions.has("shortcuts")}
                onToggle={() => toggleAccordion("shortcuts")}
              >
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                  입력 필드에 포커스된 상태에서는 비활성화됩니다.
                </p>
                <div className="space-y-2">
                  {SHORTCUTS.map((s) => (
                    <div
                      key={s.keys.join("-")}
                      className="flex items-center gap-3"
                    >
                      <span className="flex gap-1.5 shrink-0">
                        {s.keys.map((k) => (
                          <Kbd key={k}>{k}</Kbd>
                        ))}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {s.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </Accordion>

              <Accordion
                title="검색 & 필터"
                isOpen={openAccordions.has("search")}
                onToggle={() => toggleAccordion("search")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    검색창에 입력하거나 <Kbd>/</Kbd> 키로 포커스하여 제목 필터링
                  </li>
                  <li>
                    <Bullet />
                    필터 패널 확장 시 다중 조건 필터링:
                  </li>
                  <li className="pl-4">
                    <Bullet />
                    우선순위: critical, high, mid, low (토글 칩)
                  </li>
                  <li className="pl-4">
                    <Bullet />
                    상태: backlog, 이번 주, 오늘, 진행 중, 대기, 완료
                  </li>
                  <li className="pl-4">
                    <Bullet />
                    태그: 모든 사용 중인 태그
                  </li>
                  <li>
                    <Bullet />
                    활성 필터 수가 필터 버튼 배지에 표시
                  </li>
                  <li>
                    <Bullet />한 번의 클릭으로 모든 필터 초기화
                  </li>
                  <li>
                    <Bullet />
                    검색은 150ms 디바운스 적용으로 부드러운 입력
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="일괄 작업"
                isOpen={openAccordions.has("bulk")}
                onToggle={() => toggleAccordion("bulk")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    헤더의 클립보드 아이콘으로 선택 모드 전환
                  </li>
                  <li>
                    <Bullet />
                    체크박스를 클릭해 여러 태스크 선택
                  </li>
                  <li>
                    <Bullet />
                    하단에 플로팅 액션 바 표시:
                  </li>
                  <li className="pl-4">
                    <Bullet />
                    <strong>이동</strong> -- 선택한 태스크를 특정 컬럼으로 일괄
                    이동
                  </li>
                  <li className="pl-4">
                    <Bullet />
                    <strong>우선순위 설정</strong> -- 선택 항목 전체에 우선순위
                    적용
                  </li>
                  <li className="pl-4">
                    <Bullet />
                    <strong>태그 추가</strong> -- 선택 항목 전체에 태그 추가
                  </li>
                  <li className="pl-4">
                    <Bullet />
                    <strong>삭제</strong> -- 확인 후 일괄 삭제
                  </li>
                  <li>
                    <Bullet />
                    <Kbd>Esc</Kbd>로 선택 모드 종료
                  </li>
                  <li>
                    <Bullet />
                    List 뷰에서는 헤더 체크박스로 전체 선택/해제
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="템플릿"
                isOpen={openAccordions.has("templates")}
                onToggle={() => toggleAccordion("templates")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    헤더의 템플릿 아이콘으로 서랍 열기
                  </li>
                  <li>
                    <Bullet />
                    <strong>템플릿 만들기</strong>: 이름, 설명, 항목 목록(제목,
                    우선순위, 예상 시간, 태그) 정의
                  </li>
                  <li>
                    <Bullet />
                    <strong>보드 저장</strong>: 활성 태스크(완료 제외)를
                    템플릿으로 스냅샷
                  </li>
                  <li>
                    <Bullet />
                    <strong>템플릿 적용</strong>: 대상 컬럼을 선택하여
                    템플릿에서 태스크 생성
                  </li>
                  <li>
                    <Bullet />
                    반복 워크플로에 유용 (주간 계획, 스프린트 설정, 온보딩
                    체크리스트)
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="내보내기"
                isOpen={openAccordions.has("export")}
                onToggle={() => toggleAccordion("export")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    <strong>CSV 내보내기</strong>: 모든 태스크를 스프레드시트용
                    CSV 파일로 다운로드
                  </li>
                  <li>
                    <Bullet />
                    <strong>캘린더 내보내기 (.ics)</strong>: 스케줄된 태스크를
                    iCalendar 파일로 내보내기 (Apple Calendar, Google Calendar,
                    Outlook 호환)
                  </li>
                  <li>
                    <Bullet />
                    <strong>JSON 내보내기</strong>: 설정 페이지에서 전체
                    데이터베이스를 JSON 백업으로 저장
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="WIP 제한"
                isOpen={openAccordions.has("wip")}
                onToggle={() => toggleAccordion("wip")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />각 컬럼 헤더의 톱니바퀴 아이콘으로 WIP 제한 설정
                  </li>
                  <li>
                    <Bullet />
                    컬럼이 WIP 제한을 초과하면:
                  </li>
                  <li className="pl-4">
                    <Bullet />
                    컬럼 헤더가 빨간색으로 변경
                  </li>
                  <li className="pl-4">
                    <Bullet />
                    카운트 배지에 현재/제한 표시 (예: &quot;5/3&quot;)
                  </li>
                  <li className="pl-4">
                    <Bullet />
                    컬럼 상단에 경고 배너 표시
                  </li>
                  <li>
                    <Bullet />
                    설정 페이지에서 전역 설정도 가능
                  </li>
                  <li>
                    <Bullet />0 설정 시 무제한
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="되돌리기"
                isOpen={openAccordions.has("undo")}
                onToggle={() => toggleAccordion("undo")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    태스크 완료 또는 삭제 시 하단에 토스트 알림 표시
                  </li>
                  <li>
                    <Bullet />
                    5초 이내에 &quot;되돌리기&quot;를 클릭하여 작업 취소
                  </li>
                  <li>
                    <Bullet />
                    되돌리기 시 이전 상태로 복원, 삭제된 태스크는 모든 속성과
                    함께 재생성
                  </li>
                  <li>
                    <Bullet />
                    토스트는 5초 후 자동 사라짐
                  </li>
                </ul>
              </Accordion>
            </div>
          </section>

          {/* ── 6. 모바일 ────────────────────────────────── */}
          <section id="mobile" className="scroll-mt-28">
            <SectionHeading>모바일</SectionHeading>
            <div className="space-y-2">
              <Accordion
                title="PWA 설치"
                isOpen={openAccordions.has("pwa")}
                onToggle={() => toggleAccordion("pwa")}
              >
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    TaskBoard는 PWA입니다. 홈 화면에 설치하면 네이티브 앱처럼
                    사용할 수 있습니다.
                  </p>
                  <div className="bg-gray-50 dark:bg-[#141414] rounded-lg p-3 border border-gray-200 dark:border-[#2a2a2a]">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                      iOS (Safari)
                    </p>
                    <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                      <li>Safari에서 TaskBoard 열기</li>
                      <li>공유 버튼 탭 (네모에서 화살표)</li>
                      <li>&quot;홈 화면에 추가&quot; 탭</li>
                      <li>&quot;추가&quot; 탭</li>
                    </ol>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#141414] rounded-lg p-3 border border-gray-200 dark:border-[#2a2a2a]">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                      Android (Chrome)
                    </p>
                    <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                      <li>Chrome에서 TaskBoard 열기</li>
                      <li>점 세 개 메뉴 탭</li>
                      <li>
                        &quot;앱 설치&quot; 또는 &quot;홈 화면에 추가&quot; 탭
                      </li>
                    </ol>
                  </div>
                </div>
              </Accordion>

              <Accordion
                title="스와이프 제스처"
                isOpen={openAccordions.has("swipe")}
                onToggle={() => toggleAccordion("swipe")}
              >
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <p>태스크 카드에서 터치 스와이프 동작:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <p className="font-medium text-green-700 dark:text-green-400 text-xs mb-1">
                        오른쪽 끝까지
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500">
                        완료 처리
                      </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                      <p className="font-medium text-red-700 dark:text-red-400 text-xs mb-1">
                        왼쪽 끝까지
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-500">
                        삭제
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800 col-span-2 sm:col-span-1">
                      <p className="font-medium text-blue-700 dark:text-blue-400 text-xs mb-1">
                        오른쪽 절반
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-500">
                        상태 빠른 선택 메뉴
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    임계값: 절반 스와이프 = 50px, 전체 스와이프 = 100px. 8px
                    이동 후 1.5:1 비율로 방향 고정.
                  </p>
                </div>
              </Accordion>

              <Accordion
                title="당겨서 새로고침"
                isOpen={openAccordions.has("pull")}
                onToggle={() => toggleAccordion("pull")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    보드 상단에서 아래로 당겨 전체 태스크 새로고침
                  </li>
                  <li>
                    <Bullet />
                    새로고침 중 스피너 애니메이션 표시
                  </li>
                  <li>
                    <Bullet />
                    당기기 임계값: 80px
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="터치 드래그 앤 드롭"
                isOpen={openAccordions.has("touch-dnd")}
                onToggle={() => toggleAccordion("touch-dnd")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    카드를 200ms 길게 터치하면 드래그 시작
                  </li>
                  <li>
                    <Bullet />
                    드래그 오버레이에 카드 미리보기가 회전되어 표시
                  </li>
                  <li>
                    <Bullet />
                    원하는 컬럼에 놓아서 태스크 이동
                  </li>
                  <li>
                    <Bullet />
                    카드를 올리면 해당 컬럼이 하이라이트
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="빠른 추가 버튼 (FAB)"
                isOpen={openAccordions.has("fab")}
                onToggle={() => toggleAccordion("fab")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    오른쪽 하단에 고정된 파란색 &quot;+&quot; 플로팅 버튼
                  </li>
                  <li>
                    <Bullet />
                    탭하면 자동 포커스된 입력창이 있는 빠른 추가 팝업 표시
                  </li>
                  <li>
                    <Bullet />새 태스크는 기본적으로 &quot;오늘&quot; 컬럼에
                    추가
                  </li>
                  <li>
                    <Bullet />
                    Enter로 추가, Escape로 취소
                  </li>
                  <li>
                    <Bullet />
                    팝업이 열리면 버튼이 45도 회전
                  </li>
                </ul>
              </Accordion>
            </div>
          </section>

          {/* ── 7. 대시보드 ──────────────────────────────── */}
          <section id="dashboard" className="scroll-mt-28">
            <SectionHeading>대시보드</SectionHeading>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Stats 페이지에서 8가지 시각화 위젯으로 생산성 패턴을 분석합니다:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <MiniCard
                icon="#"
                title="요약 카드"
                desc="활성 태스크, 주간 완료, 완료율(%), 평균 실제 소요 시간"
              />
              <MiniCard
                icon="O"
                title="상태 분포"
                desc="컬럼별 태스크 수를 보여주는 인터랙티브 도넛 차트"
              />
              <MiniCard
                icon="|"
                title="주간 완료 추이"
                desc="최근 4주간 주별 완료 태스크 수 바 차트"
              />
              <MiniCard
                icon="/"
                title="스프린트 번다운"
                desc="이상적 vs 실제 완료를 비교하는 라인 차트 (월-일)"
              />
              <MiniCard
                icon="="
                title="벨로시티"
                desc="최근 8주간 주별 완료 수 + 평균선"
              />
              <MiniCard
                icon="H"
                title="완료 시간 분포"
                desc="완료까지 걸린 시간: <1h, 1-4h, 4-8h, 1-3d, 3-7d, >7d"
              />
              <MiniCard
                icon="%"
                title="예측 정확도"
                desc="실제 vs 예상 시간 비율. 과소/과대 추정 경향 파악"
              />
              <MiniCard
                icon="P"
                title="우선순위 분포"
                desc="우선순위별 활성 태스크 수 가로 바 차트"
              />
            </div>
            <div className="mt-2">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] px-4 py-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">
                  태그 클라우드
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  빈도에 따라 크기가 달라지는 인터랙티브 워드 클라우드. 태그를
                  클릭하면 해당 태스크를 필터링합니다.
                </p>
              </div>
            </div>
          </section>

          {/* ── 8. 알림 ──────────────────────────────────── */}
          <section id="notifications" className="scroll-mt-28">
            <SectionHeading>알림 & 동기화</SectionHeading>
            <div className="space-y-2">
              <Accordion
                title="브라우저 푸시 알림"
                isOpen={openAccordions.has("notif-push")}
                onToggle={() => toggleAccordion("notif-push")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    헤더의 벨 아이콘을 클릭하여 마감/지연 태스크 확인
                  </li>
                  <li>
                    <Bullet />
                    드롭다운에서 브라우저 알림 활성화
                  </li>
                  <li>
                    <Bullet />
                    15분마다 오늘 마감 또는 지연된 태스크 자동 확인
                  </li>
                  <li>
                    <Bullet />각 태스크는 세션당 한 번만 알림 (중복 방지)
                  </li>
                  <li>
                    <Bullet />
                    알림 클릭 시 TaskBoard 창으로 포커스 이동
                  </li>
                  <li>
                    <Bullet />벨 아이콘 배지에 마감 태스크 수 표시
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="실시간 동기화"
                isOpen={openAccordions.has("realtime")}
                onToggle={() => toggleAccordion("realtime")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    Supabase Realtime (PostgreSQL 변경 알림) 기반
                  </li>
                  <li>
                    <Bullet />
                    tasks 테이블의 INSERT, UPDATE, DELETE가 자동 새로고침 트리거
                  </li>
                  <li>
                    <Bullet />
                    여러 기기/탭에서 TaskBoard를 열면 변경 사항이 즉시 반영
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="오프라인 지원"
                isOpen={openAccordions.has("offline")}
                onToggle={() => toggleAccordion("offline")}
              >
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    서비스 워커가 앱 셸을 캐시하여 오프라인에서도 로딩 가능
                  </li>
                  <li>
                    <Bullet />
                    연결이 끊기면 노란색 &quot;오프라인&quot; 배너 표시
                  </li>
                  <li>
                    <Bullet />
                    연결 복구 시 배너 자동 사라짐
                  </li>
                  <li>
                    <Bullet />
                    다시 온라인이 되면 변경 사항 동기화
                  </li>
                </ul>
              </Accordion>
            </div>
          </section>

          {/* ── 9. 다크모드 ──────────────────────────────── */}
          <section id="darkmode" className="scroll-mt-28">
            <SectionHeading>다크모드</SectionHeading>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm px-4 py-5">
              <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Bullet />
                  헤더의 해/달 아이콘으로 다크모드 전환
                </li>
                <li>
                  <Bullet />
                  설정 페이지에서도 토글 스위치로 전환 가능
                </li>
                <li>
                  <Bullet />
                  선택한 테마는 localStorage에 저장되어 세션 간 유지
                </li>
                <li>
                  <Bullet />
                  저장된 설정이 없으면 시스템 설정(prefers-color-scheme)을 따름
                </li>
                <li>
                  <Bullet />
                  시스템 테마 변경을 실시간 감지 (수동 설정이 없는 경우만)
                </li>
                <li>
                  <Bullet />
                  모든 뷰, 모달, 서랍, 토스트가 양쪽 테마를 지원
                </li>
              </ul>
            </div>
          </section>

          {/* ── 10. 활동 기록 ─────────────────────────────── */}
          <section id="activity" className="scroll-mt-28">
            <SectionHeading>활동 기록</SectionHeading>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm px-4 py-5">
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  모든 태스크 변경 사항은 액션 유형, 태스크 제목, 필드별 변경
                  내용, 타임스탬프와 함께 기록됩니다.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      action: "생성",
                      color:
                        "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
                    },
                    {
                      action: "수정",
                      color:
                        "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
                    },
                    {
                      action: "이동",
                      color:
                        "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
                    },
                    {
                      action: "완료",
                      color:
                        "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400",
                    },
                    {
                      action: "삭제",
                      color:
                        "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
                    },
                    {
                      action: "복원",
                      color:
                        "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400",
                    },
                  ].map(({ action, color }) => (
                    <span
                      key={action}
                      className={`text-xs font-medium px-2 py-0.5 rounded ${color}`}
                    >
                      {action}
                    </span>
                  ))}
                </div>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Bullet />
                    수직 연결선이 있는 타임라인 뷰
                  </li>
                  <li>
                    <Bullet />
                    상태 이동 시 이전 상태에서 새 상태로 화살표 표시
                  </li>
                  <li>
                    <Bullet />
                    필드 업데이트 시 변경된 필드명과 이전/이후 값 표시
                  </li>
                  <li>
                    <Bullet />
                    상대적 타임스탬프 (방금, 5분 전, 2시간 전, 3일 전)
                  </li>
                  <li>
                    <Bullet />
                    &quot;더 보기&quot; 버튼으로 페이지네이션 (페이지당 20건)
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* ── 11. 설정 ─────────────────────────────────── */}
          <section id="settings" className="scroll-mt-28">
            <SectionHeading>설정</SectionHeading>
            <div className="space-y-2">
              <SettingRow
                name="일일 용량"
                desc="하루 사용 가능 시간 설정 (기본: 8시간). 용량 계획 계산에 사용됩니다."
              />
              <SettingRow
                name="보정 계수"
                desc="태스크 익숙도에 따른 시간 예측 배수. 익숙하지 않음(1.5배), 익숙함(1.2배), 루틴(1.0배). 개인의 예측 패턴에 맞게 조정하세요."
              />
              <SettingRow
                name="WIP 제한"
                desc="컬럼별 최대 태스크 수 설정. 제한 초과 시 빨간색으로 강조 표시. 0으로 설정하면 무제한."
              />
              <SettingRow
                name="다크모드"
                desc="라이트/다크 테마 전환 스위치. 모든 페이지의 헤더 아이콘에서도 전환 가능."
              />
              <SettingRow
                name="데이터 내보내기"
                desc="모든 태스크를 전체 메타데이터가 포함된 JSON 백업 파일로 다운로드."
              />
              <SettingRow
                name="완료 항목 삭제"
                desc="'완료' 상태의 모든 태스크를 영구 삭제합니다. 확인 필요. 되돌릴 수 없습니다."
              />
            </div>
          </section>

          {/* ── 12. 텔레그램 비서 연동 ────────────────────── */}
          <section id="telegram" className="scroll-mt-28">
            <SectionHeading>텔레그램 비서 연동</SectionHeading>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm px-4 py-5 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                TaskBoard와 같은 Supabase DB를 공유하는 텔레그램 봇이 하루를
                구조화해 줍니다. 아침 9시 브리핑으로 하루 시작, 2시간마다 넛지로
                진행 체크, 저녁 7시에 회고 리포트를 받습니다.
              </p>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  5명의 페르소나
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <PersonaCard
                    emoji="📋"
                    name="비서실장"
                    desc="아침 9시 브리핑. 오늘/이번 주 태스크 요약, 지연 항목 경고."
                  />
                  <PersonaCard
                    emoji="🚧"
                    name="관리관"
                    desc="태스크 상태 변경, 새 태스크 추가, 마감일 설정 대행."
                  />
                  <PersonaCard
                    emoji="⏰"
                    name="넛지"
                    desc="2시간마다 진행 체크. 진행 중 태스크가 없으면 리마인더."
                  />
                  <PersonaCard
                    emoji="📊"
                    name="분석관"
                    desc="주간 통계 요약. 완료율, 벨로시티, 병목 컬럼 분석."
                  />
                  <PersonaCard
                    emoji="☕"
                    name="감시관"
                    desc="저녁 7시 회고. 오늘 완료 항목, 내일 계획 점검."
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  <strong>DB 공유 구조:</strong> 텔레그램 봇과 TaskBoard 웹앱은
                  동일한 Supabase PostgreSQL을 읽고 씁니다. 텔레그램에서
                  태스크를 완료하면 웹에 실시간 반영되고, 웹에서 추가한 태스크는
                  다음 브리핑에 포함됩니다.
                </p>
              </div>
            </div>
          </section>

          {/* ── 13. 활용 팁 ──────────────────────────────── */}
          <section id="tips" className="scroll-mt-28">
            <SectionHeading>활용 팁</SectionHeading>
            <div className="space-y-2">
              {[
                {
                  num: 1,
                  title: "데일리 플래닝",
                  tip: '매일 아침 "이번 주"에서 "오늘"로 태스크를 이동하세요. 오늘 집중할 항목만 보는 뷰를 만들 수 있습니다.',
                  color: "border-l-blue-400",
                },
                {
                  num: 2,
                  title: "시간 예측",
                  tip: "예상 시간을 입력하면 정확도 추적이 됩니다. Stats에서 예측 비율을 확인하고 점차 보정하세요.",
                  color: "border-l-green-400",
                },
                {
                  num: 3,
                  title: "핀 고정 활용",
                  tip: "상위 3개 우선순위를 핀으로 고정하세요. 컬럼 상단에 항상 노출됩니다.",
                  color: "border-l-yellow-400",
                },
                {
                  num: 4,
                  title: "주간 리뷰",
                  tip: "매주 Stats 대시보드를 점검하세요. 완료율 추세, 벨로시티 변화, 가장 시간이 많이 드는 태그를 파악할 수 있습니다.",
                  color: "border-l-purple-400",
                },
                {
                  num: 5,
                  title: "WIP 규율",
                  tip: "WIP 제한으로 과부하를 방지하세요. 추천: 오늘 3개, 진행 중 2개. 빨간 경고가 집중에 도움됩니다.",
                  color: "border-l-red-400",
                },
                {
                  num: 6,
                  title: "템플릿 활용",
                  tip: "반복 워크플로에 템플릿을 사용하세요. 주간 계획이나 스프린트 셋업을 템플릿으로 저장하고 한 번의 클릭으로 적용하세요.",
                  color: "border-l-indigo-400",
                },
                {
                  num: 7,
                  title: "캘린더 동기화",
                  tip: ".ics 파일을 내보내 Apple Calendar나 Google Calendar와 동기화하세요. 시작/종료 시간을 설정하면 타임 블록 스케줄링이 가능합니다.",
                  color: "border-l-pink-400",
                },
                {
                  num: 8,
                  title: "태그 전략",
                  tip: "프로젝트나 맥락별로 태그를 사용하세요 (예: #frontend, #meeting, #personal). 태그 필터로 컬럼 간 크로스 뷰를 볼 수 있습니다.",
                  color: "border-l-teal-400",
                },
              ].map(({ num, title, tip, color }) => (
                <div
                  key={num}
                  className={`bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] border-l-4 ${color} px-4 py-3 shadow-sm`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                      {String(num).padStart(2, "0")}
                    </span>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {title}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div className="pt-6 pb-4 border-t border-gray-200 dark:border-[#2a2a2a] text-center">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              TaskBoard Wiki -- Next.js, Tailwind CSS, Supabase, dnd-kit으로
              제작되었습니다.
            </p>
          </div>
        </div>
      </main>

      {/* Hide scrollbar for tab bar */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-[#2a2a2a]">
      {children}
    </h2>
  );
}

function StepCard({
  step,
  title,
  desc,
}: {
  step: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm px-4 py-4">
      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold mb-2">
        {step}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function ViewCard({
  name,
  path,
  desc,
}: {
  name: string;
  path: string;
  desc: string;
}) {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm px-4 py-3 flex gap-3 items-start">
      <Link
        href={path}
        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0 w-16"
      >
        {name}
      </Link>
      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function Accordion({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <svg
          className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && <div className="px-4 pb-4 pt-0">{children}</div>}
    </div>
  );
}

function MiniCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm px-3 py-3">
      <div className="w-6 h-6 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold mb-1.5">
        {icon}
      </div>
      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-0.5">
        {title}
      </p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function SettingRow({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm px-4 py-3">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">
        {name}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
    </div>
  );
}

function PersonaCard({
  emoji,
  name,
  desc,
}: {
  emoji: string;
  name: string;
  desc: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-[#141414] rounded-lg p-3 border border-gray-200 dark:border-[#2a2a2a]">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">{emoji}</span>
        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
          {name}
        </span>
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function PriorityBadge({ level, color }: { level: string; color: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${color}`}>
      {level}
    </span>
  );
}

function Bullet() {
  return (
    <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 mr-2 relative top-[-1px]" />
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 border-b-2 text-[11px] font-mono font-medium text-gray-700 dark:text-gray-300 shadow-sm">
      {children}
    </kbd>
  );
}
