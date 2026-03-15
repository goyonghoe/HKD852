"use client";

import { useState, useCallback, useRef } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const STORAGE_KEY = "invest_coach_chat";

function loadMessages(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // storage full — silently fail
  }
}

export function useCoachChat() {
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: Message = {
        id: `u_${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      };

      const assistantMsg: Message = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const next = [...prev, userMsg, assistantMsg];
        saveMessages(next);
        return next;
      });

      setLoading(true);
      setError(null);

      abortRef.current = new AbortController();

      try {
        const history = loadMessages()
          .filter((m) => m.id !== assistantMsg.id)
          .slice(-40)
          .map((m) => ({ role: m.role, content: m.content }));

        // Remove the last entry (userMsg we just added) from history
        // since we send it as `message` separately
        const pastHistory = history.slice(0, -1);

        const res = await fetch("/api/coach/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            history: pastHistory,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "요청 실패" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("스트림을 읽을 수 없습니다.");

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                fullText += parsed.text;
                setMessages((prev) => {
                  const next = prev.map((m) =>
                    m.id === assistantMsg.id ? { ...m, content: fullText } : m,
                  );
                  return next;
                });
              }
            } catch (e) {
              if (e instanceof Error && e.message !== data) throw e;
            }
          }
        }

        // Save final state
        setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: fullText } : m,
          );
          saveMessages(next);
          return next;
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "오류가 발생했습니다.";
        setError(msg);
        // Remove empty assistant message on error
        setMessages((prev) => {
          const next = prev.filter((m) => m.id !== assistantMsg.id);
          saveMessages(next);
          return next;
        });
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [loading],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setLoading(false);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { messages, loading, error, send, clear };
}
