"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";
import Card from "../ui/Card";
import LoadingFortune from "../ui/LoadingFortune";

export default function BirthInputForm() {
  const router = useRouter();
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [noTime, setNoTime] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [isLunar, setIsLunar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!birthDate) {
      setError("생년월일을 입력해주세요");
      return;
    }
    if (!gender) {
      setError("성별을 선택해주세요");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/saju/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate,
          birthTime: noTime ? null : (birthTime || null),
          gender,
          isLunar,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "오류가 발생했습니다");
        setLoading(false);
        return;
      }

      sessionStorage.setItem(`saju-${data.orderId}`, JSON.stringify(data.sajuResult));
      router.push(`/result?orderId=${data.orderId}`);
    } catch {
      setError("서버에 연결할 수 없습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingFortune />;
  }

  return (
    <Card className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 생년월일 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            🗓️ 생년월일
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            min="1920-01-01"
            max="2025-12-31"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-base"
            required
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLunar(!isLunar)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                isLunar
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {isLunar ? "🌙 음력" : "☀️ 양력"}
            </button>
            <span className="text-[10px] text-gray-400">탭하여 전환</span>
          </div>
        </div>

        {/* 태어난 시간 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            🕐 태어난 시간
          </label>
          {!noTime && (
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-base"
            />
          )}
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={noTime}
              onChange={(e) => {
                setNoTime(e.target.checked);
                if (e.target.checked) setBirthTime("");
              }}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-xs text-gray-500">
              몰라요~ 괜찮아요! (시주 없이 분석)
            </span>
          </label>
        </div>

        {/* 성별 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            성별
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGender("male")}
              className={`py-3 rounded-xl text-base font-medium transition-all flex items-center justify-center gap-1.5 ${
                gender === "male"
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <span>👦</span> 남성
            </button>
            <button
              type="button"
              onClick={() => setGender("female")}
              className={`py-3 rounded-xl text-base font-medium transition-all flex items-center justify-center gap-1.5 ${
                gender === "female"
                  ? "bg-secondary text-white shadow-md shadow-secondary/20"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <span>👧</span> 여성
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <Button type="submit" fullWidth size="lg" loading={loading}>
          내 사주 보기 ✨
        </Button>
      </form>
    </Card>
  );
}
