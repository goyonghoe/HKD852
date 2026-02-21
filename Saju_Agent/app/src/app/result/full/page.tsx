"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileContainer from "@/components/layout/MobileContainer";
import FourPillarsDisplay from "@/components/saju/FourPillarsDisplay";
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
      const res = await fetch("/api/saju/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, type: "full" }),
      });

      if (res.status === 403) {
        router.replace(`/result?orderId=${id}`);
        return;
      }

      const data = await res.json();
      if (data.reading) {
        setReading(data.reading);
        setShareUrl(`${window.location.origin}/share/${id}`);
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
          <Card className="text-center space-y-3 py-8">
            <span className="text-4xl">😢</span>
            <p className="text-sm text-gray-600">풀이를 불러올 수 없어요</p>
            <Button onClick={() => router.push("/")} variant="outline" size="md">
              처음으로 돌아가기
            </Button>
          </Card>
        </MobileContainer>
        <Footer />
      </>
    );
  }

  const sections = [
    { key: "personality", data: reading.personality, highlighted: false },
    { key: "career", data: reading.career, highlighted: false },
    { key: "love", data: reading.love, highlighted: false },
    { key: "health", data: reading.health, highlighted: false },
    { key: "fortune2026", data: reading.fortune2026, highlighted: true },
  ];

  return (
    <>
      <Header showBack />
      <MobileContainer>
        {/* Birth Info */}
        {sajuResult && (
          <>
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
            <FourPillarsDisplay pillars={sajuResult.fourPillars} />
            <div className="h-4" />
            <ElementChart
              distribution={sajuResult.elementDistribution}
              dominantElement={sajuResult.dominantElement}
            />
            <div className="h-4" />
          </>
        )}

        {/* Reading Sections */}
        <div className="space-y-3">
          {sections.map(({ key, data, highlighted }) => (
            <ReadingSection
              key={key}
              icon={data.icon}
              title={data.title}
              content={data.content}
              highlighted={highlighted}
            />
          ))}
        </div>

        <div className="h-4" />

        {/* Lucky Elements */}
        <Card>
          <h3 className="text-sm font-bold text-gray-700 text-center mb-3">
            🍀 나의 행운 요소
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <LuckyBadge type="color" value={reading.luckyElements.color} />
            <LuckyBadge type="number" value={reading.luckyElements.number} />
            <LuckyBadge type="direction" value={reading.luckyElements.direction} />
            <LuckyBadge type="season" value={reading.luckyElements.season} />
          </div>
        </Card>

        <div className="h-4" />

        {/* Share */}
        {shareUrl && (
          <ShareCard
            shareUrl={shareUrl}
            title="AI 사주풀이 결과"
          />
        )}

        <div className="h-4" />

        {/* Back to Home */}
        <Button
          onClick={() => router.push("/")}
          fullWidth
          variant="outline"
          size="md"
        >
          다른 사주 보기
        </Button>

        <div className="h-6" />
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
