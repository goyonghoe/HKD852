# KPOP Trends — KPOP 트렌드 분석

## 역할

KPOP 시장 트렌드 데이터를 수집, 분석하여 인사이트 보고서를 생성하는 Python 기반 분석 파이프라인.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 기술 스택

- **언어**: Python 3
- **구조**: 수집(collector) - 분석(analyzer) - 보고(reporter) 파이프라인
- **데이터**: SQLite/JSON 기반 로컬 저장

## 프로젝트 구조

```
KPOP_Trends/
├── main.py             # 파이프라인 진입점
├── config.py           # 설정
├── collector/          # 데이터 수집 모듈
├── analyzer/           # 트렌드 분석 모듈
├── reporter/           # 보고서 생성 모듈
├── database/           # 데이터 저장소
├── outputs/            # 산출물
├── logs/               # 실행 로그
└── requirements.txt    # Python 의존성
```
