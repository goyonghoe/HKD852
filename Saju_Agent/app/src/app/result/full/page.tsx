"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileContainer from "@/components/layout/MobileContainer";
import FourPillarsDisplay from "@/components/saju/FourPillarsDisplay";
import SpecialStarsBadges from "@/components/saju/SpecialStarsBadges";
import ElementChart from "@/components/saju/ElementChart";
import ReadingSection from "@/components/saju/ReadingSection";
import LuckyBadge from "@/components/saju/LuckyBadge";
import ShareCard from "@/components/saju/ShareCard";
import LoadingFortune from "@/components/ui/LoadingFortune";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { SajuResult, FullReading } from "@/lib/saju/types";
import { formatDate, formatTime, formatGender } from "@/lib/utils/format";

function FullResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [sajuResult, setSajuResult] = useState<SajuResult | null>(null);
  const [reading, setReading] = useState<FullReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (!orderId) {
      router.replace("/");
      return;
    }

    const cached = sessionStorage.getItem(`saju-${orderId}`);
    if (cached) {
      setSajuResult(JSON.parse(cached) as SajuResult);
    }

    fetchFullReading(orderId);
  }, [orderId, router]);

  const fetchFullReading = async (id: string) => {
    try {
      const cached = sessionStorage.getItem(`saju-${id}`);
      const sajuResult = cached ? JSON.parse(cached) : undefined;
      const res = await fetch("/api/saju/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, type: "full", sajuResult }),
      });

      if (res.status === 403) {
        router.replace(`/result?orderId=${id}`);
        return;
      }

      const data = await res.json();
      if (data.reading) {
        setReading(data.reading);
        const sid = data.shareId || sessionStorage.getItem(`share-${id}`) || id;
        setShareUrl(`${window.location.origin}/share/${sid}`);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingFortune fullScreen />;
  }

  if (!reading) {
    return (
      <>
        <Header showBack />
        <MobileContainer>
          <Card className="text-center space-y-4 py-10">
            <p className="text-[15px] text-text-secondary font-hand">
              도깨비가 풀이를 잃어버렸어... 다시 해볼래?
            </p>
            <Button onClick={() => router.push("/")} variant="outline" size="md">
              다시 처음부터 까보기
            </Button>
          </Card>
        </MobileContainer>
        <Footer />
      </>
    );
  }

  const highlightKeys = new Set(["fortune2026", "nameFortune", "dokkaebiAdvice"]);
  const defaultExpandedKeys = new Set(["personality", "love", "fortune2026", "nameFortune"]);

  return (
    <>
      <Header showBack />
      <MobileContainer>
        {/* Birth Info */}
        {sajuResult && (
          <>
            <Card className="text-center space-y-1">
              {sajuResult.input.nameInfo && (
                <p className="font-display text-[17px] text-teal">
                  {sajuResult.input.nameInfo.koreanName}
                  {sajuResult.input.nameInfo.selectedHanja && (
                    <span className="text-[14px] text-text-dim ml-1.5 font-sans">
                      ({sajuResult.input.nameInfo.selectedHanja.map(h => h.hanja).join("")})
                    </span>
                  )}
                </p>
              )}
              <p className="text-[14px] font-medium text-text-primary">
                {formatDate(sajuResult.input.birthDate)}
                {sajuResult.input.birthTime && ` ${formatTime(sajuResult.input.birthTime)}`}
                {" · "}
                {formatGender(sajuResult.input.gender)}
              </p>
              <p className="text-[13px] text-text-dim">
                {sajuResult.zodiacAnimalKorean}띠 · {sajuResult.input.isLunar ? "음력" : "양력"}
              </p>
            </Card>

            <div className="h-4" />
            <FourPillarsDisplay
              pillars={sajuResult.fourPillars}
              tenGods={sajuResult.tenGods}
              twelveStages={sajuResult.twelveStages}
              gongmang={sajuResult.gongmang}
              specialStars={sajuResult.specialStars}
              branchRelations={sajuResult.branchRelations}
            />
            <SpecialStarsBadges
              stars={sajuResult.specialStars}
              branchRelations={sajuResult.branchRelations}
            />
            <div className="h-4" />
            <ElementChart
              distribution={sajuResult.elementDistribution}
              dominantElement={sajuResult.dominantElement}
            />
            <div className="h-5" />
          </>
        )}

        {/* Readings - dokkaebi voice */}
        <div className="space-y-3">
          {reading.sections.map((section) => (
            <ReadingSection
              key={section.key}
              icon={section.icon}
              title={section.title}
              content={section.content}
              preview={section.preview}
              highlighted={highlightKeys.has(section.key)}
              expandable
              defaultExpanded={defaultExpandedKeys.has(section.key)}
            />
          ))}
        </div>

        <div className="h-5" />

        {/* Lucky Elements */}
        <Card glow="gold">
          <h3 className="font-display text-[15px] text-gold text-center mb-4">
            도깨비가 점지한 행운
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <LuckyBadge type="color" value={reading.luckyElements.color} />
            <LuckyBadge type="number" value={reading.luckyElements.number} />
            <LuckyBadge type="direction" value={reading.luckyElements.direction} />
            <LuckyBadge type="season" value={reading.luckyElements.season} />
          </div>
        </Card>

        <div className="h-5" />

        {shareUrl && <ShareCard shareUrl={shareUrl} />}

        <div className="h-5" />

        <Button
          onClick={() => router.push("/")}
          fullWidth
          variant="outline"
          size="md"
        >
          다른 운명 까보기
        </Button>

        <div className="h-8" />
      </MobileContainer>
      <Footer />
    </>
  );
}

export default function FullResultPage() {
  return (
    <Suspense fallback={<LoadingFortune fullScreen />}>
      <FullResultContent />
    </Suspense>
  );
}
