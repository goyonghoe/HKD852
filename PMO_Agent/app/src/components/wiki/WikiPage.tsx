"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import WikiSidebar, { WikiIndex } from "./WikiSidebar";

type Mode = "view" | "edit";

export default function WikiPage() {
  const [index, setIndex] = useState<WikiIndex | null>(null);
  const [activePage, setActivePage] = useState("overview");
  const [content, setContent] = useState<string>("");
  const [editContent, setEditContent] = useState<string>("");
  const [mode, setMode] = useState<Mode>("view");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load index
  useEffect(() => {
    fetch("/api/wiki?index=true")
      .then((r) => r.json())
      .then((d: WikiIndex) => setIndex(d))
      .catch(() => setError("위키 목차 로딩 실패"));
  }, []);

  // Load page content
  const loadPage = useCallback((slug: string) => {
    setLoading(true);
    setError(null);
    setMode("view");
    fetch(`/api/wiki?page=${encodeURIComponent(slug)}`)
      .then(async (r) => {
        if (r.ok) return r.text();
        if (r.status === 404)
          return `# 페이지 없음\n\n이 페이지는 아직 작성되지 않았습니다.\n\n**편집** 버튼을 눌러 내용을 추가하세요.`;
        throw new Error(`${r.status} ${r.statusText}`);
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadPage(activePage);
  }, [activePage, loadPage]);

  const handleEdit = () => {
    setEditContent(content);
    setMode("edit");
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleCancel = () => {
    setMode("view");
    setEditContent("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/wiki", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: activePage, content: editContent }),
      });
      if (!res.ok) throw new Error(`저장 실패: ${res.status}`);
      setContent(editContent);
      setMode("view");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSaving(false);
    }
  };

  // Get current page title from index
  const currentTitle =
    index?.sections.flatMap((s) => s.pages).find((p) => p.slug === activePage)
      ?.title ?? activePage;

  return (
    <div className="flex h-[calc(100vh-97px)] bg-bg">
      {/* Sidebar */}
      {index && (
        <WikiSidebar
          index={index}
          activePage={activePage}
          onSelect={(slug) => {
            setActivePage(slug);
          }}
          isMobileOpen={mobileDrawerOpen}
          onMobileClose={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-surface-border bg-bg-elevated shrink-0">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 rounded hover:bg-surface-light text-text-dim mr-1"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <span className="text-sm font-semibold text-text-primary truncate">
              {currentTitle}
            </span>
            {mode === "edit" && (
              <span className="text-2xs text-accent bg-accent/10 px-1.5 py-0.5 rounded font-medium">
                편집 중
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {mode === "view" && !loading && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                편집
              </button>
            )}
            {mode === "edit" && (
              <>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 rounded text-xs font-medium text-text-secondary hover:bg-surface-light border border-surface-border transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    "저장"
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-3 px-3 py-2 rounded bg-st-red/10 text-st-red text-xs flex items-center gap-2">
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-text-dim text-sm">로딩 중...</span>
            </div>
          </div>
        )}

        {/* View mode */}
        {!loading && mode === "view" && (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6">
              <div
                className="prose prose-sm max-w-none
                  prose-headings:font-bold prose-headings:text-text-primary
                  prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-0
                  prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-6
                  prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-5
                  prose-p:text-text-secondary prose-p:text-base prose-p:leading-relaxed
                  prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-text-primary prose-strong:font-semibold
                  prose-code:bg-surface-light prose-code:text-text-primary prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:font-mono
                  prose-pre:bg-surface-light prose-pre:rounded-lg prose-pre:border prose-pre:border-surface-border
                  prose-blockquote:border-l-accent prose-blockquote:text-text-secondary prose-blockquote:bg-accent/5 prose-blockquote:rounded-r
                  prose-table:text-sm
                  prose-th:text-text-primary prose-th:font-semibold prose-th:bg-surface-light
                  prose-td:text-text-secondary
                  prose-hr:border-surface-border
                  prose-li:text-text-secondary prose-li:text-base
                  prose-ul:my-3 prose-ol:my-3
                "
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Edit mode: split view */}
        {!loading && mode === "edit" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Editor pane */}
            <div className="flex-1 flex flex-col border-r border-surface-border min-w-0">
              <div className="px-4 py-1.5 border-b border-surface-border bg-surface-light">
                <span className="text-2xs font-medium text-text-dim uppercase tracking-wider">
                  마크다운 편집
                </span>
              </div>
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 w-full p-4 text-sm font-mono text-text-primary bg-bg-elevated resize-none focus:outline-none leading-relaxed"
                placeholder="마크다운으로 내용을 입력하세요..."
                spellCheck={false}
              />
            </div>

            {/* Preview pane (hidden on mobile) */}
            <div className="hidden sm:flex flex-1 flex-col min-w-0">
              <div className="px-4 py-1.5 border-b border-surface-border bg-surface-light">
                <span className="text-2xs font-medium text-text-dim uppercase tracking-wider">
                  미리보기
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-none px-4 sm:px-6 py-4">
                  <div
                    className="prose prose-sm max-w-none
                      prose-headings:font-bold prose-headings:text-text-primary
                      prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-0
                      prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-6
                      prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-5
                      prose-p:text-text-secondary prose-p:text-base prose-p:leading-relaxed
                      prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-text-primary prose-strong:font-semibold
                      prose-code:bg-surface-light prose-code:text-text-primary prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:font-mono
                      prose-pre:bg-surface-light prose-pre:rounded-lg prose-pre:border prose-pre:border-surface-border
                      prose-blockquote:border-l-accent prose-blockquote:text-text-secondary prose-blockquote:bg-accent/5 prose-blockquote:rounded-r
                      prose-table:text-sm
                      prose-th:text-text-primary prose-th:font-semibold prose-th:bg-surface-light
                      prose-td:text-text-secondary
                      prose-hr:border-surface-border
                      prose-li:text-text-secondary prose-li:text-base
                    "
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {editContent}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
