"use client";

import { useState } from "react";

const sections = [
  {
    id: "market",
    title: "I. 시장을 보는 눈",
    color: "text-accent",
    bgColor: "bg-accent/10",
    items: [
      {
        label: "PBR < 1 = 저평가",
        desc: "회사 재산보다 주가가 싸다는 뜻. 한국 시장은 기업이 이익을 주주와 안 나눠서 저평가된 것",
      },
      {
        label: "상법 개정 = 촉매제",
        desc: "이사 충실의무 확대 + 집중투표제 + 자사주 소각 의무화 → 주주환원 강제. 주가 상승 동력",
      },
      {
        label: "배당 분리과세 수혜",
        desc: "배당 세율 인하 → 대주주가 배당 늘릴 유인. 이익잉여금 쌓아두고 안 나누던 기업이 타깃",
      },
      {
        label: "미국 10년물 금리 매일 체크",
        desc: "금리 하락 = 유동성 확대 → 주식 우호적. 금리 상승 = 유동성 축소 → 주식 압박",
      },
    ],
  },
  {
    id: "rules",
    title: "II. 매매 규칙 (절대 어기지 않기)",
    color: "text-loss",
    bgColor: "bg-loss/10",
    items: [
      {
        label: "손절 10% 룰",
        desc: "매수가 대비 -10% 하락 시 무조건 기계적으로 매도. 감정 개입 금지. 단, 지수 ETF는 예외",
      },
      {
        label: "익절은 서두르지 않기",
        desc: "수익 나면 불안해서 바로 팔지 말 것. 최고점 대비 -10% 하락할 때가 매도 타이밍",
      },
      {
        label: "파란 불(하락일)에만 매수",
        desc: "ETF/가치주는 떨어지는 날에 산다. 오르는 날 쫓아가는 건 본능 — 본능과 싸우는 훈련",
      },
      {
        label: "9~10시 매매 금지 + 지정가만",
        desc: "장 시작 1시간은 변동성이 크다. 반드시 지정가 주문. 레버리지/인버스 상품은 절대 금지",
      },
    ],
  },
  {
    id: "steps",
    title: "III. 성장 로드맵 (지금은 1단계)",
    color: "text-profit",
    bgColor: "bg-profit/10",
    items: [
      {
        label: "1단계: 코스피200 ETF 분할 매수",
        desc: "종목 고르는 능력이 없을 때는 시장 전체를 사라. 매일 꾸준히 나눠서 매수 (시간 분산)",
        active: true,
      },
      {
        label: "2단계: 배당주 캘린더 매매",
        desc: "배당수익률 3%+, 배당성향 30% 안정적인 종목. 배당 기준일 이틀 전까지 매수 완료",
      },
      {
        label: "3단계: ETF → 주도주 발굴",
        desc: "섹터 ETF를 비교 분석해서 '효자 종목' 추출. 내가 좋아하는 게 아니라 시장이 인정하는 종목",
      },
      {
        label: "4단계: 바벨 전략 (80:20)",
        desc: "자산 커지면 계좌 분리 — 80% ETF(안정) + 20% 개별주식(공격). 심리적 안정감 확보",
      },
    ],
  },
  {
    id: "valuation",
    title: "IV. 종목 고르는 기준",
    color: "text-gold",
    bgColor: "bg-gold/10",
    items: [
      {
        label: "PBR = 현재 재산 기준",
        desc: "회사 순자산 대비 주가 비율. PBR < 1이면 가진 재산보다 싸게 평가 → 저평가 후보",
      },
      {
        label: "PER = 미래 수익 기준",
        desc: "1년 이익 대비 주가 배수. PER 10 = 10년 벌어야 주가 도달. 반드시 같은 업종끼리 비교",
      },
      {
        label: "매출 증가 + 영업이익률 개선",
        desc: "매출이 계속 오르고, 영업이익률이 좋아지는 회사 = 사업 경쟁력 있는 회사",
      },
      {
        label: "이익잉여금 = 배당 재원",
        desc: "쌓아둔 이익이 많은데 배당을 안 하던 기업 → 상법 개정으로 배당 늘릴 가능성 높음",
      },
    ],
  },
  {
    id: "mindset",
    title: "V. 마인드 관리",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    items: [
      {
        label: "FOMO 금지",
        desc: "'폭등', '사상 최고' 같은 자극적 단어에 반응하지 않기. 숫자만 본다. 평정심이 무기",
      },
      {
        label: "매수/매도마다 일지 쓰기",
        desc: "사유(성장성 or 저평가), 손절가, 원인 분석을 기록. 감이 아니라 인과관계로 판단하는 훈련",
      },
      {
        label: "과소비 지수 점검",
        desc: "(수입-저축)/수입 = 0.7 이상이면 중독 소비. 아낀 돈을 분할 매수에 투입",
      },
    ],
  },
];

export default function StrategyGuide() {
  const [expanded, setExpanded] = useState<string | null>("rules");

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">
            투자 전략 요약
          </h3>
          <p className="text-[10px] text-text-dim mt-0.5">
            주식아가방 강연 기반 — 매일 펼쳐보고 명심할 것
          </p>
        </div>
        <button
          onClick={() => setExpanded(expanded ? null : "rules")}
          className="text-[10px] text-text-dim hover:text-text-secondary transition-colors"
        >
          {expanded ? "모두 접기" : "펼치기"}
        </button>
      </div>

      <div className="space-y-2">
        {sections.map((section) => {
          const isOpen = expanded === section.id;
          return (
            <div key={section.id}>
              {/* Section Header */}
              <button
                onClick={() => setExpanded(isOpen ? null : section.id)}
                className="w-full flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-surface-light transition-colors text-left"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${section.bgColor.replace("/10", "")}`}
                />
                <span className={`text-xs font-medium ${section.color}`}>
                  {section.title}
                </span>
                <span className="ml-auto text-text-dim text-[10px]">
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>

              {/* Section Content */}
              {isOpen && (
                <div className="ml-3 pl-3 border-l border-surface-border space-y-2 pb-2">
                  {section.items.map((item, i) => (
                    <div
                      key={i}
                      className={`px-3 py-2.5 rounded-lg ${
                        "active" in item && item.active
                          ? `${section.bgColor} border border-profit/20`
                          : "bg-surface-light/50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {"active" in item && item.active && (
                          <span className="text-[9px] bg-profit text-white px-1.5 py-0.5 rounded font-medium shrink-0 mt-0.5">
                            NOW
                          </span>
                        )}
                        <div>
                          <p className="text-xs font-medium text-text-primary">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-text-dim mt-0.5 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
