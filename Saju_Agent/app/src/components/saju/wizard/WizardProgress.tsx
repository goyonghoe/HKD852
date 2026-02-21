"use client";

interface WizardProgressProps {
  totalSteps: number;
  currentStep: number;
}

export default function WizardProgress({ totalSteps, currentStep }: WizardProgressProps) {
  return (
    <div className="flex justify-center gap-2 py-3">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i < currentStep
              ? "bg-teal"
              : i === currentStep
                ? "bg-teal scale-125 ring-2 ring-teal/30"
                : "bg-surface-border"
          }`}
        />
      ))}
    </div>
  );
}
