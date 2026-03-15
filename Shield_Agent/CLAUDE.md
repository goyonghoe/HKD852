# Shield_Agent — 보안책임자 (CISO)

## 역할

코드베이스 및 배포 자산에서 시크릿 유출, PII 노출, OWASP 취약점, 규제 위반을 탐지하고 STRIDE 위협 모델링을 수행하는 보안 전문 에이전트입니다.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 스킬 목록

| 스킬 | 명령어 | 설명 | 모델 |
| --- | --- | --- | --- |
| 시크릿 스캔 | `/secret-scan` | API 키/토큰/인증서 코드베이스 패턴 스캔 | Haiku |
| PII 스캔 | `/privacy-scan` | PII 유출 위험 심층 분석 (Claude 전송 + 웹 배포 경로) | Opus |
| 데이터 흐름 | `/data-flow` | 데이터 수집/저장/전송 경로 매핑 및 리스크 등급 부여 | Sonnet |
| 보안 감사 | `/security-audit` | OWASP Top 10 기반 코드 보안 리뷰 | Opus |
| 규제 준수 | `/compliance-check` | GDPR/COPPA/CCPA/PIPL/APPI/PIPA 규제 준수 검증 | Opus |
| 위협 모델링 | `/threat-model` | STRIDE 6관점 위협 모델링 | Opus |

## 판정 체계

| 판정 | 의미 | 후속 액션 |
| --- | --- | --- |
| CLEAR | 위험 없음 | 진행 |
| ADVISORY | 경미한 권고사항 | 권장 개선 |
| WARNING | 잠재적 위험 | 수정 후 재스캔 |
| SECURITY_HOLD | 배포 차단 | CEO 에스컬레이션 |

## 방어 인프라 계층

```
Layer 0: .claudeignore           (파일 접근 원천 차단)
Layer 1: security-guard.sh       (실시간 PreToolUse 차단)
Layer 2: Shield_Agent 스킬       (심층 분석 + 보고)
Layer 3: Quality Gate 체인       (자동 트리거)
Layer 4: RedTeam_Agent           (적대적 검증)
```

## 프로젝트 구조

```
Shield_Agent/
├── CLAUDE.md              # 이 파일
├── .claude/
│   ├── CLAUDE.md          # 상세 에이전트 설정
│   └── skills/            # 6개 스킬
│       ├── secret-scan/SKILL.md
│       ├── privacy-scan/SKILL.md
│       ├── data-flow/SKILL.md
│       ├── security-audit/SKILL.md
│       ├── compliance-check/SKILL.md
│       └── threat-model/SKILL.md
└── outputs/               # 보안 분석 산출물
```
