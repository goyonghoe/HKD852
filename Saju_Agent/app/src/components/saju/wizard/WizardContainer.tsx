"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { HanjaCharacter, NameInfo } from "@/lib/saju/types";
import { splitKoreanName } from "@/lib/saju/hanja-mappings";
import Card from "../../ui/Card";
import WizardProgress from "./WizardProgress";
import StepGender from "./StepGender";
import StepName from "./StepName";
import StepHanja from "./StepHanja";
import StepBirthdate from "./StepBirthdate";
import StepBirthtime from "./StepBirthtime";

type WizardStep = "gender" | "name" | "hanja" | "birthdate" | "birthtime";

const STEPS_WITH_HANJA: WizardStep[] = ["gender", "name", "hanja", "birthdate", "birthtime"];
const STEPS_WITHOUT_HANJA: WizardStep[] = ["gender", "name", "birthdate", "birthtime"];

export default function WizardContainer() {
  const router = useRouter();

  // Form state
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [koreanName, setKoreanName] = useState("");
  const [selectedHanja, setSelectedHanja] = useState<(HanjaCharacter | null)[]>([]);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [isLunar, setIsLunar] = useState(false);
  const [timeKnown, setTimeKnown] = useState(false);
  const [birthTime, setBirthTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("gender");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animating, setAnimating] = useState(false);
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const hasName = koreanName.length >= 2;
  const steps = hasName ? STEPS_WITH_HANJA : STEPS_WITHOUT_HANJA;
  const currentIndex = steps.indexOf(currentStep);

  const syllables = hasName ? koreanName.split("") : [];

  const goTo = useCallback(
    (step: WizardStep, dir: "forward" | "backward") => {
      if (animating) return;
      setDirection(dir);
      setAnimating(true);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      animTimeoutRef.current = setTimeout(() => {
        setCurrentStep(step);
        setAnimating(false);
      }, 200);
    },
    [animating]
  );

  const goNext = useCallback(() => {
    const activeSteps = hasName ? STEPS_WITH_HANJA : STEPS_WITHOUT_HANJA;
    const idx = activeSteps.indexOf(currentStep);
    if (idx < activeSteps.length - 1) {
      goTo(activeSteps[idx + 1], "forward");
    }
  }, [currentStep, hasName, goTo]);

  const goBack = useCallback(() => {
    const activeSteps = hasName ? STEPS_WITH_HANJA : STEPS_WITHOUT_HANJA;
    const idx = activeSteps.indexOf(currentStep);
    if (idx > 0) {
      goTo(activeSteps[idx - 1], "backward");
    }
  }, [currentStep, hasName, goTo]);

  // Handlers
  const handleGenderSelect = (g: "male" | "female") => {
    setGender(g);
    setTimeout(() => goTo("name", "forward"), 250);
  };

  const handleNameNext = () => {
    if (hasName) {
      setSelectedHanja(new Array(koreanName.length).fill(null));
      goTo("hanja", "forward");
    }
  };

  const handleNameSkip = () => {
    setKoreanName("");
    setSelectedHanja([]);
    goTo("birthdate", "forward");
  };

  const handleHanjaNext = () => {
    goTo("birthdate", "forward");
  };

  const handleHanjaSkip = () => {
    setSelectedHanja(syllables.map(() => null));
    goTo("birthdate", "forward");
  };

  const handleBirthdateNext = () => {
    goTo("birthtime", "forward");
  };

  const handleSubmit = async () => {
    setError("");
    const effectiveDay = day && parseInt(day) > 31 ? "" : day;
    const birthDate =
      year && month && effectiveDay
        ? `${year}-${month.padStart(2, "0")}-${effectiveDay.padStart(2, "0")}`
        : "";

    if (!birthDate) {
      setError("생년월일을 입력해줘");
      return;
    }
    if (!gender) {
      setError("성별을 선택해줘");
      return;
    }

    // Build nameInfo
    let nameInfo: NameInfo | undefined;
    if (hasName) {
      const split = splitKoreanName(koreanName);
      if (split) {
        const validHanja = selectedHanja.filter(
          (h): h is HanjaCharacter => h !== null
        );
        nameInfo = {
          koreanName,
          familyName: split.familyName,
          givenNameSyllables: split.givenNameSyllables,
          selectedHanja: validHanja.length > 0 ? validHanja : undefined,
        };
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/saju/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate,
          birthTime: timeKnown ? birthTime || null : null,
          gender,
          isLunar,
          ...(nameInfo && { nameInfo }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "어라, 뭔가 잘못됐네");
        setLoading(false);
        return;
      }
      sessionStorage.setItem(`saju-${data.orderId}`, JSON.stringify(data.sajuResult));
      if (data.shareId) {
        sessionStorage.setItem(`share-${data.orderId}`, data.shareId);
      }
      router.push(`/result?orderId=${data.orderId}`);
    } catch {
      setError("연결이 끊겼네. 다시 해봐.");
      setLoading(false);
    }
  };

  const animClass = animating
    ? direction === "forward"
      ? "wizard-slide-out"
      : "wizard-slide-back-out"
    : direction === "forward"
      ? "wizard-slide-in"
      : "wizard-slide-back-in";

  return (
    <Card>
      <WizardProgress totalSteps={steps.length} currentStep={currentIndex} />

      {/* Back button */}
      {currentIndex > 0 && !animating && (
        <button
          type="button"
          onClick={goBack}
          className="mb-3 text-[13px] text-text-dim hover:text-teal transition-colors flex items-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          뒤로
        </button>
      )}

      <div className={`transition-all duration-200 ${animClass}`}>
        {currentStep === "gender" && (
          <StepGender value={gender} onSelect={handleGenderSelect} />
        )}
        {currentStep === "name" && (
          <StepName
            value={koreanName}
            onChange={setKoreanName}
            onNext={handleNameNext}
            onSkip={handleNameSkip}
          />
        )}
        {currentStep === "hanja" && (
          <StepHanja
            syllables={syllables}
            selectedHanja={selectedHanja}
            onHanjaChange={setSelectedHanja}
            onNext={handleHanjaNext}
            onSkip={handleHanjaSkip}
          />
        )}
        {currentStep === "birthdate" && (
          <StepBirthdate
            year={year}
            month={month}
            day={day}
            isLunar={isLunar}
            onYearChange={setYear}
            onMonthChange={setMonth}
            onDayChange={setDay}
            onLunarToggle={() => setIsLunar(!isLunar)}
            onNext={handleBirthdateNext}
          />
        )}
        {currentStep === "birthtime" && (
          <StepBirthtime
            timeKnown={timeKnown}
            birthTime={birthTime}
            onTimeKnownChange={setTimeKnown}
            onBirthTimeChange={setBirthTime}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}
      </div>

      {error && (
        <p className="text-ember text-[13px] text-center font-hand mt-4">{error}</p>
      )}
    </Card>
  );
}
