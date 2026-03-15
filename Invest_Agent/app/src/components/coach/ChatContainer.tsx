"use client";

import { useState, useRef, useEffect } from "react";
import { useCoachChat, type Message } from "@/hooks/useCoachChat";

const QUICK_QUESTIONS = [
  "종목 분석은 어떻게 해?",
  "손절 기준이 뭐야?",
  "배당주는 어떻게 찾아?",
  "투자 일지 어떻게 써?",
];

const WELCOME_MESSAGE = `안녕하세요! 저는 당신의 **투자 러닝메이트**입니다.

주식이 처음이어도 괜찮아요. 어려운 용어는 쉽게 풀어드리고, 감정에 휘둘리지 않는 **기계적인 매매 습관**을 함께 만들어 갈 거예요.

무엇이든 물어보세요:
- "삼성전자 지금 사도 돼?" → 매수 전 체크리스트 안내
- "PBR이 뭐야?" → 쉬운 비유로 설명
- "내 주식이 -15%야" → 손절 규칙 점검
- "수익 나는데 팔까?" → 익절 타이밍 안내`;

function formatContent(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary">$1</strong>')
    .replace(/\n/g, "<br />");
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-accent/20 text-text-primary rounded-br-md"
            : "bg-surface-light text-text-secondary rounded-bl-md"
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div
            className="text-sm leading-relaxed [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-surface-light rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-text-dim animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-text-dim animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-text-dim animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export default function ChatContainer() {
  const { messages, loading, error, send, clear } = useCoachChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    send(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickQuestion = (q: string) => {
    if (loading) return;
    send(q);
  };

  const isEmpty = messages.length === 0;
  const isStreaming =
    loading &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].content.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">투자 코치</h2>
          <p className="text-xs text-text-dim">
            주식 생초보를 위한 AI 러닝메이트
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clear}
            className="text-xs px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors"
          >
            새 대화
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-1 pb-4 scrollbar-thin"
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="max-w-lg w-full">
              {/* Welcome */}
              <div className="bg-surface-light rounded-2xl rounded-bl-md px-5 py-4 mb-6">
                <div
                  className="text-sm text-text-secondary leading-relaxed [&_strong]:font-semibold [&_strong]:text-text-primary"
                  dangerouslySetInnerHTML={{
                    __html: formatContent(WELCOME_MESSAGE),
                  }}
                />
              </div>
              {/* Quick questions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuickQuestion(q)}
                    className="text-xs px-3 py-2 rounded-full bg-surface border border-surface-border text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {loading && !isStreaming && <TypingIndicator />}
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-1 mb-2 px-3 py-2 bg-loss-dim text-loss text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Quick questions (when chat has messages) */}
      {!isEmpty && !loading && (
        <div className="flex flex-wrap gap-1.5 px-1 mb-2">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleQuickQuestion(q)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-surface-light text-text-dim hover:text-text-secondary transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 px-1">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="무엇이든 물어보세요..."
            rows={1}
            className="w-full px-4 py-3 bg-surface border border-surface-border rounded-xl text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent resize-none transition-colors"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-3 bg-accent text-white text-sm font-medium rounded-xl disabled:opacity-40 hover:bg-accent/80 transition-colors shrink-0"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
