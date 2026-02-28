"use client";

interface RateTrackerProps {
  loading: boolean;
}

export default function RateTracker({ loading }: RateTrackerProps) {
  if (loading) {
    return (
      <div className="bg-surface border border-surface-border rounded-xl p-5">
        <div className="skeleton rounded w-40 h-5 mb-3" />
        <div className="skeleton rounded w-full h-20" />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-5">
      <h3 className="text-sm font-medium text-text-secondary mb-3">
        미국 10년물 국채 금리 (전략 1.4)
      </h3>

      <div className="space-y-3">
        <div className="bg-surface-light rounded-lg p-4">
          <p className="text-xs text-text-dim mb-2">금리 트래킹 원칙</p>
          <ul className="space-y-1.5 text-xs text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-profit shrink-0 mt-0.5">&#9650;</span>
              <span>
                <strong className="text-text-primary">금리 하락</strong> = 유동성 확대 시그널 → 주식 시장 우호적
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-loss shrink-0 mt-0.5">&#9660;</span>
              <span>
                <strong className="text-text-primary">금리 상승</strong> = 유동성 축소 시그널 → 주식 시장 압박
              </span>
            </li>
          </ul>
        </div>

        <div className="text-xs text-text-dim">
          <p className="mb-1">
            CLI에서 <code className="bg-surface-light px-1.5 py-0.5 rounded">/market-brief</code> 스킬을 실행하면
            실시간 금리 데이터를 포함한 종합 브리핑을 생성합니다.
          </p>
          <p>
            매일 아침 금리 변동을 체크하는 것이 투자 루틴의 핵심입니다 (전략 1.4).
          </p>
        </div>
      </div>
    </div>
  );
}
