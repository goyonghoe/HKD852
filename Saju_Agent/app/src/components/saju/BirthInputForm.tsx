"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";
import Card from "../ui/Card";
import LoadingFortune from "../ui/LoadingFortune";
import NameInput from "./NameInput";
import { NameInfo } from "@/lib/saju/types";

const CURRENT_YEAR = 2026;
const START_YEAR = 1920;

const TIME_PERIODS = [
  { value: "00:00", label: "자시 · 한밤중 (0~2시)" },
  { value: "02:00", label: "축시 · 새벽 (2~4시)" },
  { value: "04:00", label: "인시 · 이른아침 (4~6시)" },
  { value: "06:00", label: "묘시 · 아침 (6~8시)" },
  { value: "08:00", label: "진시 · 오전 (8~10시)" },
  { value: "10:00", label: "사시 · 점심전 (10~12시)" },
  { value: "12:00", label: "오시 · 낮 (12~14시)" },
  { value: "14:00", label: "미시 · 오후 (14~16시)" },
  { value: "16:00", label: "신시 · 늦은오후 (16~18시)" },
  { value: "18:00", label: "유시 · 저녁 (18~20시)" },
  { value: "20:00", label: "술시 · 밤 (20~22시)" },
  { value: "22:00", label: "해시 · 늦은밤 (22~24시)" },
];

function getDaysInMonth(year: number, month: number): number {
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

export default function BirthInputForm() {
  const router = useRouter();
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [timeKnown, setTimeKnown] = useState(false);
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [isLunar, setIsLunar] = useState(false);
  const [nameInfo, setNameInfo] = useState<NameInfo | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = useCallback((info: NameInfo | undefined) => {
    setNameInfo(info);
  }, []);

  const daysInMonth = useMemo(() => {
    return getDaysInMonth(parseInt(year) || 0, parseInt(month) || 0);
  }, [year, month]);

  // Reset day if it exceeds new month's day count
  const effectiveDay = day && parseInt(day) > daysInMonth ? "" : day;

  const birthDate = year && month && effectiveDay
    ? `${year}-${month.padStart(2, "0")}-${effectiveDay.padStart(2, "0")}`
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!birthDate) { setError("야, 생년월일 좀 알려줘"); return; }
    if (!gender) { setError("남자야 여자야? 골라봐"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/saju/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate,
          birthTime: timeKnown ? (birthTime || null) : null,
          gender,
          isLunar,
          ...(nameInfo && { nameInfo }),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "어라, 뭔가 잘못됐네"); setLoading(false); return; }
      sessionStorage.setItem(`saju-${data.orderId}`, JSON.stringify(data.sajuResult));
      if (data.shareId) {
        sessionStorage.setItem(`share-${data.orderId}`, data.shareId);
      }
      router.push(`/result?orderId=${data.orderId}`);
    } catch {
      setError("어? 연결이 끊겼네. 다시 해봐.");
      setLoading(false);
    }
  };

  if (loading) return <LoadingFortune />;

  const selectBase = "form-select w-full px-3 py-3.5 rounded-xl bg-surface-light border border-surface-border text-text-primary focus:border-teal/30 focus:ring-2 focus:ring-teal/10 outline-none transition-all text-[15px] pr-8";

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 이름 (선택) */}
        <NameInput onNameChange={handleNameChange} />

        <div className="border-t border-surface-border" />

        {/* 생년월일 */}
        <div>
          <label className="block text-[13px] font-semibold text-text-secondary mb-2">
            생년월일
          </label>
          <div className="flex gap-2">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={`flex-[1.2] min-w-0 ${selectBase}`}
            >
              <option value="">년</option>
              {Array.from({ length: CURRENT_YEAR - START_YEAR + 1 }, (_, i) => CURRENT_YEAR - i).map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={`flex-[0.8] min-w-0 ${selectBase}`}
            >
              <option value="">월</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={String(m)}>{m}월</option>
              ))}
            </select>
            <select
              value={effectiveDay}
              onChange={(e) => setDay(e.target.value)}
              className={`flex-[0.8] min-w-0 ${selectBase}`}
            >
              <option value="">일</option>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                <option key={d} value={String(d)}>{d}일</option>
              ))}
            </select>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLunar(!isLunar)}
              className={`text-[13px] px-3.5 py-1.5 rounded-full transition-all font-medium ${
                isLunar
                  ? "bg-teal text-bg"
                  : "bg-surface-light text-text-dim border border-surface-border"
              }`}
            >
              {isLunar ? "음력" : "양력"}
            </button>
            <span className="text-[11px] text-text-dim">탭해서 바꿔봐</span>
          </div>
        </div>

        {/* 시간 */}
        <div>
          <label className="block text-[13px] font-semibold text-text-secondary mb-2">
            태어난 시간
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setTimeKnown(false); setBirthTime(""); }}
              className={`py-3 rounded-xl text-[14px] font-medium transition-all border ${
                !timeKnown
                  ? "bg-surface-light text-teal border-teal/30"
                  : "bg-surface-light/50 text-text-dim border-surface-border"
              }`}
            >
              몰라 / 없어도 OK
            </button>
            <button
              type="button"
              onClick={() => setTimeKnown(true)}
              className={`py-3 rounded-xl text-[14px] font-medium transition-all border ${
                timeKnown
                  ? "bg-teal text-bg border-teal"
                  : "bg-surface-light/50 text-text-dim border-surface-border"
              }`}
            >
              알고 있어
            </button>
          </div>
          {timeKnown && (
            <select
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className={`mt-2.5 ${selectBase}`}
            >
              <option value="">시간대 선택</option>
              {TIME_PERIODS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          )}
        </div>

        {/* 성별 */}
        <div>
          <label className="block text-[13px] font-semibold text-text-secondary mb-2">
            성별
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGender("male")}
              className={`py-3.5 rounded-xl text-[15px] font-medium transition-all border ${
                gender === "male"
                  ? "bg-teal text-bg border-teal"
                  : "bg-surface-light text-text-dim border-surface-border hover:border-teal/20"
              }`}
            >
              남자
            </button>
            <button
              type="button"
              onClick={() => setGender("female")}
              className={`py-3.5 rounded-xl text-[15px] font-medium transition-all border ${
                gender === "female"
                  ? "bg-ember text-white border-ember"
                  : "bg-surface-light text-text-dim border-surface-border hover:border-ember/20"
              }`}
            >
              여자
            </button>
          </div>
        </div>

        {error && (
          <p className="text-ember text-[13px] text-center font-hand text-base">{error}</p>
        )}

        <Button type="submit" fullWidth size="lg" variant="gold" loading={loading}>
          운명 까보기 👹
        </Button>
      </form>
    </Card>
  );
}
