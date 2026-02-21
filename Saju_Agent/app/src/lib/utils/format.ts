export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
}

export function formatTime(timeStr: string | null): string {
  if (!timeStr) return "시간 미입력";
  const [hour, minute] = timeStr.split(":");
  const h = parseInt(hour);
  const period = h < 12 ? "오전" : "오후";
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${displayHour}시 ${minute}분`;
}

export function formatGender(gender: "male" | "female"): string {
  return gender === "male" ? "남성" : "여성";
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}
