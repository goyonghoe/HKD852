# ClaudeUsageMonitor — Claude 사용량 모니터링

## 역할

Claude Code의 세션별/주간 사용량을 실시간으로 macOS 메뉴 바에 표시하는 모니터링 도구. `/usage` 명령어와 동일한 데이터를 GUI로 제공.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 기술 스택

- **언어**: Python 3.10+
- **GUI**: macOS 메뉴 바 (rumps 또는 유사 라이브러리)
- **데이터**: Claude Code 사용량 캐시 파싱

## 프로젝트 구조

```
ClaudeUsageMonitor/
├── claude_monitor.py   # 메인 모니터링 스크립트
├── config.json         # 설정 파일
├── cache.json          # 사용량 캐시
├── requirements.txt    # Python 의존성
├── setup.sh            # 설치 스크립트
└── run.sh              # 실행 스크립트
```
