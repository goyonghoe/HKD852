"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileContainer from "@/components/layout/MobileContainer";
import FourPillarsDisplay from "@/components/saju/FourPillarsDisplay";
import SpecialStarsBadges from "@/components/saju/SpecialStarsBadges";
import ElementChart from "@/components/saju/ElementChart";
import LoadingFortune from "@/components/ui/LoadingFortune";
import ShareCard from "@/components/saju/ShareCard";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DokkaebiIcon from "@/components/ui/DokkaebiIcon";
import { SajuResult, TeaserReading } from "@/lib/saju/types";
import { formatDate, formatTime, formatGender } from "@/lib/utils/format";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [sajuResult, setSajuResult] = useState<SajuResult | null>(null);
  const [teaser, setTeaser] = useState<TeaserReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [teaserLoading, setTeaserLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (!orderId) {
      router.replace("/");
      return;
    }

    const cached = sessionStorage.getItem(`saju-${orderId}`);
    if (cached) {
      const result = JSON.parse(cached) as SajuResult;
      setSajuResult(result);
      setLoading(false);
      fetchTeaser(orderId);
      const shareId = sessionStorage.getItem(`share-${orderId}`);
      if (shareId) {
        setShareUrl(`${window.location.origin}/share/${shareId}`);
      }
    } else {
      setLoading(false);
      router.replace("/");
    }
  }, [orderId, router]);

  const fetchTeaser = async (id: string) => {
    setTeaserLoading(true);
    try {
      const cached = sessionStorage.getItem(`saju-${id}`);
      const sajuResult = cached ? JSON.parse(cached) : undefined;
      const res = await fetch("/api/saju/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, type: "teaser", sajuResult }),
      });
      const data = await res.json();
      if (data.reading) {
        setTeaser(data.reading);
      }
    } catch {
      // Teaser is optional
    } finally {
      setTeaserLoading(false);
    }
  };

  if (loading || !sajuResult) {
    return <LoadingFortune fullScreen />;
  }

  return (
    <>
      <Header showBack />
      <MobileContainer>
        {/* Birth Info */}
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
          animated
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

        {/* Teaser - Dokkaebi's first impression */}
        {teaserLoading ? (
          <Card className="text-center">
            <LoadingFortune />
          </Card>
        ) : teaser ? (
          <Card glow="teal">
            <div className="text-center mb-3">
              <DokkaebiIcon size={36} className="mx-auto mb-2" />
              <h3 className="font-display text-base text-teal">
                도깨비가 슬쩍 본 너
              </h3>
            </div>
            <p className="text-[14px] text-text-secondary leading-[1.85] font-hand">
              {teaser.personality}
            </p>
            <div className="mt-4 bg-teal-dim rounded-xl p-4 space-y-3">
              <p className="text-[13px] text-teal-light leading-relaxed">
                {teaser.elementInsight}
              </p>
              {teaser.nameHint && (
                <p className="text-[13px] text-teal-light/80 leading-relaxed border-t border-teal/10 pt-3">
                  {teaser.nameHint}
                </p>
              )}
            </div>
          </Card>
        ) : (
          <Card className="text-center space-y-3 fade-in">
            <DokkaebiIcon size={36} className="mx-auto" />
            <p className="text-[14px] text-text-secondary font-hand">
              도깨비가 잠깐 딴짓했네. 새로고침 해봐.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-[13px] text-teal underline underline-offset-4"
            >
              새로고침
            </button>
          </Card>
        )}

        <div className="h-8" />

        {/* CTA - Dokkaebi upsell */}
        <Card glow="gold" className="text-center space-y-4">
          <div className="space-y-2">
            <h3 className="font-display text-lg text-gold">
              더 까볼래?
            </h3>
            <p className="text-[13px] text-text-dim font-hand">
              성격 · 재물 · 적성 · 연애 · 대인관계 · 건강 · 올해운 · 변화운 · 숨은재능{sajuResult.input.nameInfo ? " · 이름풀이" : ""} · 도깨비 조언
            </p>
          </div>
          <Button
            onClick={() => router.push(`/result/full?orderId=${orderId}`)}
            fullWidth
            size="lg"
            variant="gold"
          >
            운명 전체 까보기 👹
          </Button>
        </Card>

        {shareUrl && (
          <>
            <div className="h-5" />
            <ShareCard shareUrl={shareUrl} />
          </>
        )}

        <div className="h-8" />
      </MobileContainer>
      <Footer />
    </>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<LoadingFortune fullScreen />}>
      <ResultContent />
    </Suspense>
  );
}
