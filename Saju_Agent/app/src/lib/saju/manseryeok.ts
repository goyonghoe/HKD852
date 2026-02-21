/**
 * 만세력 (萬歲曆) — Julian Day Number 기반 정확한 간지일(干支日) 계산
 *
 * 전통 사주명리에서 일주(日柱)는 만세력 조회가 원칙.
 * 여기서는 천문학 표준인 JDN(Julian Day Number)으로 수학적으로 정확하게 계산한다.
 *
 * ─── 공식 ───
 * 천간(天干) index = (JDN + 9) mod 10   (0=甲, 1=乙, ... 9=癸)
 * 지지(地支) index = (JDN + 1) mod 12   (0=子, 1=丑, ... 11=亥)
 *
 * ─── 검증 ───
 * 1988-02-17  JDN=2447209  → stem=8(壬) branch=2(寅) = 壬寅 ✓
 * 1900-01-01  JDN=2415021  → stem=0(甲) branch=10(戌) = 甲戌 ✓
 * 2000-01-01  JDN=2451545  → stem=4(戊) branch=6(午)  = 戊午 ✓
 * 2000-01-07  JDN=2451551  → stem=0(甲) branch=0(子)  = 甲子 ✓
 *
 * ─── 참고 고전 ───
 * 적천수(滴天髓), 자평진전(子平真詮), 궁통보감(窮通寶鑑)
 */

/**
 * 그레고리력 날짜 → Julian Day Number
 * Meeus algorithm (Astronomical Algorithms, 2nd ed.)
 *
 * @param year  양력 연도 (예: 1988)
 * @param month 양력 월 (1~12)
 * @param day   양력 일 (1~31)
 */
export function getJulianDayNumber(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

