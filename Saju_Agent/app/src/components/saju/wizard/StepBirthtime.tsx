"use client";

const TIME_PERIODS = [
  { value: "00:00", label: "자시 (0~2시)" },
  { value: "02:00", label: "축시 (2~4시)" },
  { value: "04:00", label: "인시 (4~6시)" },
  { value: "06:00", label: "묘시 (6~8시)" },
  { value: "08:00", label: "진시 (8~10시)" },
  { value: "10:00", label: "사시 (10~12시)" },
  { value: "12:00", label: "오시 (12~14시)" },
  { value: "14:00", label: "미시 (14~16시)" },
  { value: "16:00", label: "신시 (16~18시)" },
  { value: "18:00", label: "유시 (18~20시)" },
  { value: "20:00", label: "술시 (20~22시)" },
  { value: "22:00", label: "해시 (22~24시)" },
];

interface StepBirthtimeProps {
  timeKnown: boolean;
  birthTime: string;
  onTimeKnownChange: (known: boolean) => void;
  onBirthTimeChange: (time: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function StepBirthtime({
  timeKnown,
  birthTime,
  onTimeKnownChange,
  onBirthTimeChange,
  onSubmit,
  loading,
}: StepBirthtimeProps) {
  const selectBase =
    "form-select w-full px-3 py-3.5 rounded-xl bg-surface-light border border-surface-border text-text-primary focus:border-teal/30 focus:ring-2 focus:ring-teal/10 outline-none transition-all text-[15px] pr-8";

  const canSubmit = !timeKnown || birthTime;

  return (
    <div className="space-y-5">
      <p className="text-[15px] text-text-secondary font-hand text-center leading-relaxed">
        태어난 시간도 알아? 몰라도 괜찮아.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            onTimeKnownChange(false);
            onBirthTimeChange("");
          }}
          className={`py-3.5 rounded-xl text-[14px] font-medium transition-all border ${
            !timeKnown
              ? "bg-surface-light text-teal border-teal/30"
              : "bg-surface-light/50 text-text-dim border-surface-border"
          }`}
        >
          몰라 / 괜찮아
        </button>
        <button
          type="button"
          onClick={() => onTimeKnownChange(true)}
          className={`py-3.5 rounded-xl text-[14px] font-medium transition-all border ${
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
          onChange={(e) => onBirthTimeChange(e.target.value)}
          className={selectBase}
        >
          <option value="">시간대 선택</option>
          {TIME_PERIODS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || loading}
        className={`w-full py-4 rounded-xl text-[16px] font-bold transition-all active:scale-[0.97] ${
          canSubmit && !loading
            ? "bg-gradient-to-r from-teal to-gold text-bg border-0"
            : "bg-surface-light text-text-dim/40 border border-surface-border cursor-not-allowed"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
            도깨비가 보는 중...
          </span>
        ) : (
          "운명 까보기 👹"
        )}
      </button>
    </div>
  );
}
