"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileContainer from "@/components/layout/MobileContainer";
import FourPillarsDisplay from "@/components/saju/FourPillarsDisplay";
import ElementChart from "@/components/saju/ElementChart";
import LoadingFortune from "@/components/ui/LoadingFortune";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
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
      // Teaser is optional, silently fail
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
        {/* Birth Info Summary */}
        <Card className="text-center text-xs text-gray-500 space-y-0.5">
          <p className="font-medium text-gray-700">
            {formatDate(sajuResult.input.birthDate)}
            {sajuResult.input.birthTime && ` ${formatTime(sajuResult.input.birthTime)}`}
            {" · "}
            {formatGender(sajuResult.input.gender)}
          </p>
          <p>
            {sajuResult.zodiacAnimalKorean}띠 · {sajuResult.input.isLunar ? "음력" : "양력"}
          </p>
        </Card>

        <div className="h-4" />

        {/* Four Pillars with Animation */}
        <FourPillarsDisplay pillars={sajuResult.fourPillars} animated />

        <div className="h-4" />

        {/* Element Chart */}
        <ElementChart
          distribution={sajuResult.elementDistribution}
          dominantElement={sajuResult.dominantElement}
        />

        <div className="h-4" />

        {/* Teaser Reading */}
        {teaserLoading ? (
          <Card className="text-center">
            <LoadingFortune />
          </Card>
        ) : teaser ? (
          <Card className="space-y-3">
            <h3 className="text-sm font-bold text-gray-700 text-center">
              🦋 당신은 이런 사람이에요
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {teaser.personality}
            </p>
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                ✨ {teaser.elementInsight}
              </p>
            </div>
          </Card>
        ) : null}

        <div className="h-6" />

        {/* CTA to Full Reading (TEST MODE: 무료) */}
        <Card className="text-center space-y-3">
          <span className="text-3xl">✨</span>
          <h3 className="text-base font-bold text-gray-800">
            더 자세한 풀이가 궁금하다면?
          </h3>
          <p className="text-xs text-gray-400">
            성격 · 적성 · 연애 · 건강 · 2026 운세 · 행운 요소
          </p>
          <Button
            onClick={() => router.push(`/result/full?orderId=${orderId}`)}
            fullWidth
            size="lg"
            variant="secondary"
          >
            상세 풀이 보기 ✨
          </Button>
          <p className="text-[10px] text-gray-300">테스트 모드: 무료 체험</p>
        </Card>

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
