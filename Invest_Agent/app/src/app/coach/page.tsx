"use client";

import Header from "@/components/layout/Header";
import ChatContainer from "@/components/coach/ChatContainer";

export default function CoachPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-[900px] mx-auto px-6 py-5">
        <ChatContainer />
      </main>
    </div>
  );
}
