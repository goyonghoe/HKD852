"use client";

interface StepGenderProps {
  value: "male" | "female" | "";
  onSelect: (gender: "male" | "female") => void;
}

export default function StepGender({ value, onSelect }: StepGenderProps) {
  return (
    <div className="space-y-6">
      <p className="text-[15px] text-text-secondary font-hand text-center leading-relaxed">
        먼저 말해봐. 남자야, 여자야?
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelect("male")}
          className={`py-5 rounded-xl text-[16px] font-medium transition-all border ${
            value === "male"
              ? "bg-teal text-bg border-teal"
              : "bg-surface-light text-text-dim border-surface-border hover:border-teal/20 active:scale-[0.97]"
          }`}
        >
          남자
        </button>
        <button
          type="button"
          onClick={() => onSelect("female")}
          className={`py-5 rounded-xl text-[16px] font-medium transition-all border ${
            value === "female"
              ? "bg-ember text-white border-ember"
              : "bg-surface-light text-text-dim border-surface-border hover:border-ember/20 active:scale-[0.97]"
          }`}
        >
          여자
        </button>
      </div>
    </div>
  );
}
