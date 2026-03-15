import { ColumnConfig, Division, Priority, TaskStatus } from "./types";

export const COLUMNS: ColumnConfig[] = [
  {
    id: "backlog",
    label: "대기",
    statuses: ["backlog"],
    color: "#C4C4C4",
    bgColor: "rgba(196, 196, 196, 0.06)",
  },
  {
    id: "in_progress",
    label: "진행 중",
    statuses: ["in_progress"],
    color: "#579BFC",
    bgColor: "rgba(87, 155, 252, 0.06)",
  },
  {
    id: "review",
    label: "검토",
    statuses: ["done", "qa_fail", "redteam_reject"],
    color: "#FDAB3D",
    bgColor: "rgba(253, 171, 61, 0.06)",
  },
  {
    id: "qa_passed",
    label: "QA 통과",
    statuses: ["qa_passed"],
    color: "#A25DDC",
    bgColor: "rgba(162, 93, 220, 0.06)",
  },
  {
    id: "final_done",
    label: "완료",
    statuses: ["final_done"],
    color: "#00CA72",
    bgColor: "rgba(0, 202, 114, 0.06)",
  },
];

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bgColor: string; dot: string }
> = {
  critical: {
    label: "긴급",
    color: "#E2445C",
    bgColor: "rgba(226, 68, 92, 0.18)",
    dot: "#E2445C",
  },
  high: {
    label: "높음",
    color: "#FDAB3D",
    bgColor: "rgba(253, 171, 61, 0.18)",
    dot: "#FDAB3D",
  },
  mid: {
    label: "보통",
    color: "#579BFC",
    bgColor: "rgba(87, 155, 252, 0.18)",
    dot: "#579BFC",
  },
  low: {
    label: "낮음",
    color: "#00CA72",
    bgColor: "rgba(0, 202, 114, 0.18)",
    dot: "#00CA72",
  },
};

export const DIVISION_CONFIG: Record<
  Division,
  { label: string; labelKo: string; color: string; bgColor: string }
> = {
  game: {
    label: "Game",
    labelKo: "게임",
    color: "#579BFC",
    bgColor: "rgba(87, 155, 252, 0.18)",
  },
  business: {
    label: "Biz",
    labelKo: "사업",
    color: "#A25DDC",
    bgColor: "rgba(162, 93, 220, 0.18)",
  },
  support: {
    label: "Ops",
    labelKo: "지원",
    color: "#66CCFF",
    bgColor: "rgba(102, 204, 255, 0.18)",
  },
  direct: {
    label: "HQ",
    labelKo: "직속",
    color: "#FDAB3D",
    bgColor: "rgba(253, 171, 61, 0.18)",
  },
};

export const STATUS_LABELS: Record<string, string> = {
  backlog: "대기",
  in_progress: "진행 중",
  done: "검토 대기",
  qa_fail: "QA 실패",
  qa_passed: "QA 통과",
  redteam_reject: "RT 반려",
  final_done: "완료",
};

export const STATUS_COLORS: Record<string, string> = {
  backlog: "#C4C4C4",
  in_progress: "#579BFC",
  done: "#FDAB3D",
  qa_fail: "#E2445C",
  qa_passed: "#A25DDC",
  redteam_reject: "#E2445C",
  final_done: "#00CA72",
};

export const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  backlog: ["in_progress"],
  in_progress: ["done"],
  done: ["qa_passed", "qa_fail"],
  qa_fail: ["in_progress"],
  qa_passed: ["final_done", "redteam_reject"],
  redteam_reject: ["in_progress"],
  final_done: [],
};

export const AGENTS = [
  {
    name: "game-designer",
    division: "game" as Division,
    label: "기획",
    initials: "GD",
    color: "#579BFC",
  },
  {
    name: "programmer",
    division: "game" as Division,
    label: "개발",
    initials: "PG",
    color: "#66CCFF",
  },
  {
    name: "art-director",
    division: "game" as Division,
    label: "아트",
    initials: "AD",
    color: "#FF642E",
  },
  {
    name: "ui-designer",
    division: "game" as Division,
    label: "UI",
    initials: "UI",
    color: "#A25DDC",
  },
  {
    name: "balance-designer",
    division: "game" as Division,
    label: "밸런스",
    initials: "BL",
    color: "#FDAB3D",
  },
  {
    name: "audio-designer",
    division: "game" as Division,
    label: "오디오",
    initials: "AU",
    color: "#00CA72",
  },
];
