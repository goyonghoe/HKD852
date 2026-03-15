"use client";

import { useState } from "react";

/**
 * 금융 용어 해설 컴포넌트
 * 용어 아래 점선, 클릭/호버 시 해설 팝업
 */

// 전문 용어 사전
const GLOSSARY: Record<string, string> = {
  // 가치평가 지표
  PBR: "주가순자산비율. 주가 ÷ 1주당 순자산. 1 미만이면 회사 재산보다 주가가 싸다는 뜻 (저평가)",
  PER: "주가수익비율. 주가 ÷ 1주당 이익. 숫자가 낮을수록 이익 대비 주가가 싸다. 같은 업종끼리 비교해야 의미 있음",
  EPS: "주당순이익. 회사가 1년간 벌어들인 순이익을 발행 주식수로 나눈 값. 클수록 돈을 잘 번다는 뜻",
  BPS: "주당순자산. 회사의 순자산(자산-부채)을 주식수로 나눈 값. 주가가 BPS보다 낮으면 저평가",
  DPS: "주당배당금. 주식 1주를 가지고 있으면 1년에 받는 배당금",

  // 배당 관련
  배당수익률:
    "내가 산 가격 대비 1년간 받는 배당금 비율. 은행 이자처럼 생각하면 됨. 3% 이상이면 고배당",
  배당금:
    "회사가 주주에게 나눠주는 돈. 주식을 가지고 있기만 하면 정기적으로 받을 수 있음",
  배당기준일:
    "이 날짜에 주식을 갖고 있어야 배당을 받을 수 있음. 기준일 영업일 2일 전까지 매수 완료해야 함",

  // 매매 관련
  손절: "손해를 보고 파는 것. 더 큰 손해를 막기 위해 -10% 하락 시 기계적으로 매도하는 규칙",
  익절: "이익을 실현하고 파는 것. 최고점 대비 -10% 떨어지면 매도 타이밍",
  손절가: "이 가격 이하로 떨어지면 무조건 파는 기준 가격. 매수가의 -10%로 설정",
  지정가주문:
    "내가 원하는 가격을 정해놓고 주문하는 방식. 시장가 주문(현재 가격에 바로 사는 것)보다 안전",
  분할매수:
    "한 번에 몰아사지 않고, 여러 번 나눠서 사는 전략. 평균 매수가를 낮추는 효과",

  // 시장 관련
  KOSPI: "한국 대형주 시장. 삼성전자 같은 큰 회사들이 상장된 곳",
  KOSDAQ: "한국 중소형·기술주 시장. IT·바이오 등 성장 기업이 많은 곳",
  ETF: "여러 주식을 한 바구니에 담은 상품. 개별 종목 고르기 어려울 때 시장 전체를 살 수 있음",
  거래량: "하루 동안 사고팔린 주식의 수. 거래량이 많으면 관심이 높다는 뜻",

  // 금리/환율
  금리: "돈을 빌릴 때 내는 이자율. 금리가 오르면 주식시장에 부담, 내리면 유리",
  국채: "나라가 발행하는 채권(빚 문서). 10년물 국채 금리는 경제 전체의 이자 수준을 보여줌",
  유동성:
    "시장에 돌아다니는 돈의 양. 유동성이 많으면 주식시장이 좋고, 적으면 어려움",
  환율: "원화와 달러의 교환 비율. 환율이 오르면(원화 약세) 수출 기업에 유리",

  // 전략
  바벨전략:
    "역기(바벨)처럼 양쪽에 무게를 두는 전략. 80% 안전자산(ETF) + 20% 공격자산(개별주식)",
  저평가:
    "회사의 실제 가치보다 주가가 싸다고 판단되는 상태. PBR < 1이면 대표적인 저평가",
  성장성:
    "회사의 매출과 이익이 계속 늘어나는지. 성장하는 회사의 주가는 장기적으로 오름",
  역발상:
    "남들이 무서워서 안 살 때(하락일) 오히려 사는 전략. 본능과 반대로 행동하는 훈련",
  레버리지:
    "빚을 내서 투자 규모를 키우는 상품. 수익도 2~3배지만 손실도 2~3배. 초보자 절대 금지",
  인버스:
    "시장이 떨어질 때 돈을 버는 상품. 타이밍 맞추기 극도로 어려움. 초보자 절대 금지",
  FOMO: "Fear Of Missing Out. '나만 못 사면 어떡하지' 하는 불안감. 조급한 매수의 원인",

  // 재무제표
  이익잉여금:
    "회사가 벌어서 쌓아둔 돈. 이게 많으면 배당을 늘릴 여력이 있다는 뜻",
  영업이익률:
    "매출 중에서 실제로 남는 이익의 비율. 높을수록 장사를 잘하는 회사",
  부채비율:
    "회사가 가진 자본 대비 빚의 비율. 200% 넘으면 빚이 많은 편이라 주의 필요",
  유동자산: "빠르게 현금으로 바꿀 수 있는 자산. 현금, 예금, 단기 투자 등",

  // 기타
  "52주": "최근 1년간의 기간. 52주 최고/최저가는 1년 동안의 가격 범위를 보여줌",
  보합: "주가가 전날과 거의 같은 상태. 오르지도 내리지도 않음",
  종가: "장이 끝났을 때의 마지막 거래 가격",
};

interface TermProps {
  /** 사전에서 찾을 키 (없으면 children 텍스트를 키로 사용) */
  k?: string;
  /** 표시할 텍스트 */
  children: string;
  /** 추가 클래스 */
  className?: string;
}

export default function Term({ k, children, className = "" }: TermProps) {
  const [show, setShow] = useState(false);
  const key = k || children;
  const definition = GLOSSARY[key];

  if (!definition) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(!show)}
    >
      <span className="border-b border-dotted border-text-dim cursor-help">
        {children}
      </span>
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-[#1a2332] border border-surface-border rounded-lg shadow-lg text-[11px] text-text-secondary leading-relaxed pointer-events-none">
          <span className="font-medium text-accent">{key}</span>
          <span className="mx-1 text-text-dim">—</span>
          {definition}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#1a2332]" />
        </span>
      )}
    </span>
  );
}

/**
 * 테이블 헤더용 — 컬럼명 옆에 작은 ? 아이콘
 */
export function TermHeader({
  label,
  termKey,
}: {
  label: string;
  termKey: string;
}) {
  const [show, setShow] = useState(false);
  const definition = GLOSSARY[termKey];

  if (!definition) return <>{label}</>;

  return (
    <span
      className="relative inline-flex items-center gap-1"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {label}
      <span className="w-3.5 h-3.5 rounded-full bg-surface-light text-text-dim text-[9px] flex items-center justify-center cursor-help shrink-0">
        ?
      </span>
      {show && (
        <span className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-56 px-3 py-2 bg-[#1a2332] border border-surface-border rounded-lg shadow-lg text-[11px] text-text-secondary leading-relaxed font-normal text-left pointer-events-none">
          <span className="font-medium text-accent">{termKey}</span>
          <span className="mx-1 text-text-dim">—</span>
          {definition}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-1px] border-4 border-transparent border-b-[#1a2332]" />
        </span>
      )}
    </span>
  );
}
