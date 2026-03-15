# GameDev Agent (개발팀장)

Unity 6000.3.6f1 기반 멀티플랫폼 게임 코드 개발 에이전트입니다.

## 스킬 목록

| 스킬             | 명령어            | 모델   | 역할                                           |
| ---------------- | ----------------- | ------ | ---------------------------------------------- |
| 프로젝트 초기화  | `/unity-init`     | Sonnet | 프로젝트 스캐폴딩, Build Settings, 패키지 설정 |
| 씬/프리팹 생성   | `/unity-scene`    | Sonnet | Unity 씬 계층 구조 설계, 프리팹 구성           |
| C# 스크립트 작성 | `/unity-script`   | Sonnet | MonoBehaviour/ScriptableObject 작성            |
| 셰이더 작성      | `/unity-shader`   | Sonnet | URP/ShaderGraph 셰이더, 모바일 최적화          |
| UI 구성          | `/unity-ui`       | Sonnet | UI Toolkit/uGUI, SafeArea, 노치 대응           |
| CLI 빌드         | `/unity-build`    | Haiku  | Unity headless 빌드 실행                       |
| 코드 리뷰        | `/unity-review`   | Opus   | 다관점 코드 리뷰 (3 프로필 종합)               |
| 리팩토링         | `/unity-refactor` | Sonnet | SOLID 원칙, 코드 중복 제거, 패턴 적용          |
| 아키텍처 설계    | `/unity-arch`     | Opus   | MVC/MVP/ECS 패턴, 시스템 분해, 의존성 설계     |

## 다관점 프로필

| 프로필                   | 관점                                            |
| ------------------------ | ----------------------------------------------- |
| Performance Engineer     | 모바일 60fps, 드로우콜, 메모리, GC, 배터리/발열 |
| Security Coder           | 치팅 방지, 데이터 보호, 서버 검증, TLS          |
| Maintainability Advocate | 클린 C#, SOLID, 디자인 패턴, 테스트 용이성      |

## 사용 예시

```bash
# 새 Unity 프로젝트 셋업
/unity-init "MyGame" --platforms ios,android,steam

# 아키텍처 설계
/unity-arch "카드 배틀 시스템 - MVC 패턴으로 설계"

# C# 스크립트 작성
/unity-script "PlayerController - 이동, 점프, 대시 기능"

# 다관점 코드 리뷰
/unity-review Assets/_Project/Scripts/Gameplay/CardSystem.cs

# 빌드
/unity-build --platform android --configuration release
```

## 크로스 에이전트 연동

- **GameDesign_Agent** -> 기획서 수신 -> 코드 변환
- **team-kowloon** -> 아트 에셋 수신 -> 게임 통합
- **QATest_Agent** -> 빌드 결과물 전달
- **DevOps_Agent** -> 빌드 설정 전달

## 디렉토리 구조

```
GameDev_Agent/
├── .claude/
│   ├── CLAUDE.md
│   └── skills/
│       ├── unity-init/SKILL.md
│       ├── unity-scene/SKILL.md
│       ├── unity-script/SKILL.md
│       ├── unity-shader/SKILL.md
│       ├── unity-ui/SKILL.md
│       ├── unity-build/SKILL.md
│       ├── unity-review/SKILL.md
│       ├── unity-refactor/SKILL.md
│       ├── unity-arch/SKILL.md
│       ├── performance-engineer.md
│       ├── security-coder.md
│       └── maintainability-advocate.md
├── README.md
└── outputs/
```
