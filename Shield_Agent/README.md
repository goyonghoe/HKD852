# Shield_Agent — 보안책임자 (CISO)

> HKD852 스튜디오 CEO 직속 보안책임자. 코드베이스/배포 자산의 시크릿 유출, PII 노출, OWASP 취약점, 규제 위반을 탐지합니다.

## 스킬

| 명령어              | 모델   | 설명                                    |
| ------------------- | ------ | --------------------------------------- |
| `/secret-scan`      | Haiku  | API 키/토큰/인증서 코드베이스 패턴 스캔 |
| `/privacy-scan`     | Opus   | PII 유출 위험 심층 분석                 |
| `/data-flow`        | Sonnet | 외부 서비스 데이터 흐름 매핑            |
| `/security-audit`   | Opus   | OWASP Top 10 코드 보안 리뷰             |
| `/compliance-check` | Opus   | GDPR/COPPA/CCPA/PIPL/APPI/PIPA 검증     |
| `/threat-model`     | Opus   | STRIDE 6관점 위협 분석                  |

## 기존 방어 인프라 연계

```
Layer 0: .claudeignore          → 파일 접근 원천 차단
Layer 1: security-guard.sh      → 실시간 PreToolUse hook 차단
Layer 2: Shield_Agent 스킬      → 심층 분석 + 보고
Layer 3: Quality Gate 체인      → 자동 트리거 (PASS 80+)
Layer 4: RedTeam_Agent          → 적대적 검증
```

## 자동 트리거

- Quality Gate PASS (90+) → `/security-audit` + RedTeam `/red-review`
- Quality Gate PASS (80-89) → `/security-audit` (코드/데이터인 경우)
- Orchestrator Case K (보안 키워드) → Shield 우선 라우팅

## 디렉토리 구조

```
Shield_Agent/
├── .claude/
│   ├── CLAUDE.md
│   └── skills/
│       ├── secret-scan/SKILL.md
│       ├── privacy-scan/SKILL.md
│       ├── data-flow/SKILL.md
│       ├── security-audit/SKILL.md
│       ├── compliance-check/SKILL.md
│       └── threat-model/SKILL.md
├── outputs/
└── README.md
```
