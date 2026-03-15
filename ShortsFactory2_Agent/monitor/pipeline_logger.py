#!/usr/bin/env python3
"""
pipeline_logger.py — 오늘의 논문 파이프라인 구조화 JSONL 로거

로그 파일:
  pipeline/logs/pipeline.jsonl        (전체 이벤트)
  pipeline/logs/errors/errors.jsonl   (에러만)
  pipeline/logs/metrics/metrics.jsonl (메트릭만)

Usage:
    from monitor.pipeline_logger import PipelineLogger
    logger = PipelineLogger("pipeline")
    logger.log_step("mine", "paper_ep019", "START", {"doi": "10.xxxx"})
    logger.log_step("mine", "paper_ep019", "COMPLETE", {"score": 81})
    logger.log_error("render", "paper_ep019", "TTS_FAILED", {"error": "Voice ref missing"})
    logger.log_metric("render", "paper_ep019", {"duration_sec": 120, "file_size_mb": 4.2})
    logger.log_gate("script_approval", "paper_ep019", "APPROVE")
"""

import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

KST = timezone(timedelta(hours=9))


class PipelineLogger:
    """오늘의 논문 파이프라인 구조화 JSONL 로거."""

    def __init__(self, pipeline_dir: str = None):
        if pipeline_dir:
            self.pipeline_dir = Path(pipeline_dir).resolve()
        else:
            self.pipeline_dir = Path(__file__).parent.parent / "pipeline"
        self.log_dir = self.pipeline_dir / "logs"
        self.main_log = self.log_dir / "pipeline.jsonl"
        self.error_log = self.log_dir / "errors" / "errors.jsonl"
        self.metric_log = self.log_dir / "metrics" / "metrics.jsonl"

    def _now(self) -> str:
        return datetime.now(KST).isoformat(timespec="seconds")

    def _append(self, filepath: Path, record: dict):
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    def log_step(self, skill: str, episode_id: str, status: str, data: dict = None):
        """파이프라인 단계 이벤트 기록. status: START|COMPLETE|SKIP|FAIL"""
        record = {
            "ts": self._now(),
            "type": "step",
            "skill": skill,
            "ep": episode_id,
            "status": status,
            "data": data or {},
        }
        self._append(self.main_log, record)
        if status == "FAIL":
            self._append(self.error_log, record)

    def log_error(self, skill: str, episode_id: str, error_type: str, data: dict = None):
        """에러 이벤트 기록."""
        record = {
            "ts": self._now(),
            "type": "error",
            "skill": skill,
            "ep": episode_id,
            "error_type": error_type,
            "data": data or {},
        }
        self._append(self.main_log, record)
        self._append(self.error_log, record)

    def log_metric(self, skill: str, episode_id: str, metrics: dict):
        """메트릭 이벤트 기록 (소요시간, 파일 크기, 점수 등)."""
        record = {
            "ts": self._now(),
            "type": "metric",
            "skill": skill,
            "ep": episode_id,
            "metrics": metrics,
        }
        self._append(self.main_log, record)
        self._append(self.metric_log, record)

    def log_gate(self, gate: str, episode_id: str, decision: str, feedback: str = ""):
        """CEO 승인 게이트 결정 기록. gate: script_approval|video_approval"""
        record = {
            "ts": self._now(),
            "type": "gate",
            "gate": gate,
            "ep": episode_id,
            "decision": decision,
            "feedback": feedback,
        }
        self._append(self.main_log, record)

    def log_batch_summary(self, batch_id: str, summary: dict):
        """배치 완료 요약 기록."""
        record = {
            "ts": self._now(),
            "type": "batch_summary",
            "batch_id": batch_id,
            "summary": summary,
        }
        self._append(self.main_log, record)
