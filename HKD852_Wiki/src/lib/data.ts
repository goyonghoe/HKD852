import type { Agent, Skill } from './types';

export const DIVISIONS = [
  { id: 'ceo-direct', name: 'CEO Direct', nameKo: '대표 직속' },
  { id: 'game', name: 'Game Division', nameKo: '게임본부' },
  { id: 'business', name: 'Business Division', nameKo: '사업본부' },
  { id: 'support', name: 'Support Division', nameKo: '지원본부' },
] as const;

export const AGENTS: Agent[] = [
  // CEO Direct
  { slug: 'secretary-agent', name: 'Secretary_Agent', role: '비서실장', division: 'ceo-direct', path: './Secretary_Agent/', skillCount: 4, description: '일일 브리핑, 작업 일지, 주간 보고, 에스컬레이션', skills: [] },
  { slug: 'orchestrator', name: 'Orchestrator', role: '운영총괄 (COO)', division: 'ceo-direct', path: '.claude/skills/orchestrator/', skillCount: 1, description: '작업 자동 분석 및 부서 간 라우팅', skills: [] },
  { slug: 'quality-gate', name: 'Quality Gate', role: '품질관리 매니저', division: 'ceo-direct', path: '.claude/skills/quality-gate/', skillCount: 1, description: 'CFMC 매트릭스 검증 + 자동 보안/레드팀 체인', skills: [] },
  { slug: 'growth-agent', name: 'Growth_Agent', role: '성장전략 매니저', division: 'ceo-direct', path: './Growth_Agent/', skillCount: 3, description: 'AAARRR 퍼널 진단, 온보딩 리뷰, KPI 대시보드', skills: [] },
  { slug: 'pmo-agent', name: 'PMO_Agent', role: '프로젝트매니저', division: 'ceo-direct', path: './WanChai/.claude/skills/kanban-*', skillCount: 14, description: '스프린트 관리, 칸반, 마일스톤, 리스크, 로드맵 (WanChai 귀속)', skills: [] },
  { slug: 'shield-agent', name: 'Shield_Agent', role: '보안책임자 (CISO)', division: 'ceo-direct', path: './Shield_Agent/', skillCount: 6, description: 'PII 스캔, 컴플라이언스, OWASP 보안 감사, STRIDE 위협 모델링', skills: [] },
  { slug: 'redteam-agent', name: 'RedTeam_Agent', role: '레드팀', division: 'ceo-direct', path: './RedTeam_Agent/', skillCount: 6, description: '적대적 리뷰, 익스플로잇 탐색, 문화적 민감도 검토', skills: [] },
  { slug: 'invest-agent', name: 'Invest_Agent', role: '투자 대시보드', division: 'ceo-direct', path: './Invest_Agent/', skillCount: 7, description: '투자 분석, 스크리닝, 시장 브리핑, 포트폴리오 관리', skills: [] },
  // Game Division
  { slug: 'gamedesign-agent', name: 'GameDesign_Agent', role: '기획팀장', division: 'game', path: './GameDesign_Agent/', skillCount: 10, description: '요구사항 분석, PD 리뷰, 아트 상태 조회, 보고서 생성', skills: [] },
  { slug: 'team-kowloon', name: 'team-kowloon', role: '아트디렉터', division: 'game', path: './team-kowloon/', skillCount: 6, description: '게임 아트 스펙, 스프라이트, 타일셋, UI', skills: [] },
  { slug: 'gamedev-agent', name: 'GameDev_Agent', role: '개발팀장', division: 'game', path: './GameDev_Agent/', skillCount: 9, description: 'Unity 프로젝트 관리, C# 스크립트, 셰이더, 빌드', skills: [] },
  { slug: 'qatest-agent', name: 'QATest_Agent', role: 'QA팀장', division: 'game', path: './QATest_Agent/', skillCount: 6, description: '테스트 계획, 유닛 테스트, 성능 프로파일링, 버그 리포트', skills: [] },
  { slug: 'ssbl', name: 'SSBL', role: 'SSBL 프로젝트', division: 'game', path: './SSBL/', skillCount: 2, description: '플레이 기록-과금 상관관계, 런칭 체크리스트', skills: [] },
  // Business Division
  { slug: 'income-factory', name: 'Income_Factory', role: '사업개발 매니저', division: 'business', path: './Income_Factory/', skillCount: 9, description: '아이디어 스캔~런칭 전체 파이프라인', skills: [] },
  { slug: 'marketing-agent', name: 'Marketing_Agent', role: '마케팅 매니저', division: 'business', path: './Marketing_Agent/', skillCount: 5, description: 'ASO, SNS 카피, 런칭 플랜, Steam 페이지, 인플루언서', skills: [] },
  { slug: 'community-agent', name: 'Community_Agent', role: '커뮤니티 매니저', division: 'business', path: './Community_Agent/', skillCount: 5, description: '감성 분석, 패치노트, 리뷰 답변, Discord, 위기 대응', skills: [] },
  { slug: 'shortsfactory-agent', name: 'ShortsFactory_Agent', role: '쇼츠공장 매니저', division: 'business', path: './ShortsFactory_Agent/', skillCount: 6, description: '쇼츠 일일 파이프라인 (토픽~렌더링~리뷰)', skills: [] },
  { slug: 'shortsfleet', name: 'ShortsFleet', role: '쇼츠총괄 매니저', division: 'business', path: './ShortsFleet/', skillCount: 4, description: '멀티채널 병렬 생산, 크로스채널 분석', skills: [] },
  // Support Division
  { slug: 'pt-agent', name: 'PT_Agent', role: '커뮤니케이션 디렉터', division: 'support', path: './PT_Agent/', skillCount: 9, description: '프레젠테이션 전체 파이프라인 (기획~시각화~레드팀)', skills: [] },
  { slug: 'translate-agent', name: 'Translate_Agent', role: '현지화 매니저', division: 'support', path: './Translate_Agent/', skillCount: 5, description: '한→영/일/중/EU 번역, UI 검증, 문화 적응', skills: [] },
  { slug: 'hr-agent', name: 'HR_Agent', role: '인사팀장', division: 'support', path: './HR_Agent/', skillCount: 2, description: '조직도 HTML, 재조직 분석', skills: [] },
  { slug: 'video-analyzer', name: 'Video_Analyzer', role: '기술지원', division: 'support', path: './Video_Analyzer/', skillCount: 1, description: '비디오 분석', skills: [] },
  { slug: 'devops-agent', name: 'DevOps_Agent', role: '빌드엔지니어', division: 'support', path: './DevOps_Agent/', skillCount: 8, description: 'CI/CD, iOS/Android/Steam 빌드, 배포, 핫픽스', skills: [] },
];

export const SKILL_CATEGORIES = [
  { id: 'management', name: 'Management', nameKo: '관리' },
  { id: 'development', name: 'Development', nameKo: '개발' },
  { id: 'design', name: 'Design', nameKo: '기획/디자인' },
  { id: 'content', name: 'Content', nameKo: '콘텐츠' },
  { id: 'security', name: 'Security', nameKo: '보안' },
  { id: 'analytics', name: 'Analytics', nameKo: '분석' },
] as const;

export const ALL_SKILLS: { name: string; agent: string; description: string; model: 'opus' | 'sonnet' | 'haiku' }[] = [
  // CEO Direct - Core
  { name: '/orchestrator', agent: 'Orchestrator', description: '작업 자동 분석, 부서 간 라우팅 (Case A~RT)', model: 'sonnet' },
  { name: '/quality-gate', agent: 'Quality Gate', description: 'CFMC 매트릭스 검증 + 자동 보안/레드팀 체인', model: 'opus' },
  { name: '/debate-synthesize', agent: 'Common', description: '다관점 프로필 종합 → 합의 권고안 도출', model: 'opus' },
  // Secretary_Agent
  { name: '/daily-brief', agent: 'Secretary_Agent', description: '일일 브리핑', model: 'sonnet' },
  { name: '/work-log', agent: 'Secretary_Agent', description: '작업 일지 정리', model: 'sonnet' },
  { name: '/weekly-report', agent: 'Secretary_Agent', description: 'CEO 주간 요약 보고서', model: 'sonnet' },
  { name: '/escalation-brief', agent: 'Secretary_Agent', description: '블로커/리스크 CEO 긴급 보고', model: 'sonnet' },
  // Growth_Agent
  { name: '/funnel-audit', agent: 'Growth_Agent', description: 'AAARRR 퍼널 KPI 진단 → 병목 식별 → 개선안', model: 'opus' },
  { name: '/onboarding-review', agent: 'Growth_Agent', description: '온보딩 9단계 리뷰 → 이탈 포인트 분석', model: 'sonnet' },
  { name: '/kpi-dashboard', agent: 'Growth_Agent', description: '핵심 지표 인터랙티브 HTML 대시보드', model: 'sonnet' },
  // PMO (WanChai)
  { name: '/sprint-plan', agent: 'PMO_Agent', description: '2주 스프린트 백로그 생성', model: 'sonnet' },
  { name: '/sprint-review', agent: 'PMO_Agent', description: '스프린트 회고 + 다음 스프린트 초안', model: 'sonnet' },
  { name: '/milestone-track', agent: 'PMO_Agent', description: '마일스톤 진행률 업데이트', model: 'haiku' },
  { name: '/dep-map', agent: 'PMO_Agent', description: '에이전트 간 태스크 의존성 맵', model: 'sonnet' },
  { name: '/risk-register', agent: 'PMO_Agent', description: '프로젝트 리스크 식별 및 점수화', model: 'opus' },
  { name: '/roadmap', agent: 'PMO_Agent', description: '인터랙티브 HTML 로드맵', model: 'sonnet' },
  { name: '/standup', agent: 'PMO_Agent', description: '전체 에이전트 상태 빠른 체크', model: 'haiku' },
  { name: '/kanban-create', agent: 'PMO_Agent', description: 'WanChai 칸반 태스크 생성', model: 'opus' },
  { name: '/kanban-pickup', agent: 'PMO_Agent', description: 'WanChai 칸반 태스크 시작', model: 'opus' },
  { name: '/kanban-done', agent: 'PMO_Agent', description: 'WanChai 칸반 태스크 완료', model: 'opus' },
  { name: '/kanban-qa', agent: 'PMO_Agent', description: 'CFMC 품질 평가', model: 'opus' },
  { name: '/kanban-redteam', agent: 'PMO_Agent', description: '적대적 리뷰', model: 'opus' },
  { name: '/kanban-status', agent: 'PMO_Agent', description: 'WanChai 칸반 현황 조회', model: 'opus' },
  { name: '/kanban-deploy', agent: 'PMO_Agent', description: '칸반 대시보드 배포', model: 'opus' },
  // Shield_Agent
  { name: '/privacy-scan', agent: 'Shield_Agent', description: 'PII 노출 스캔 (코드+문서+데이터)', model: 'opus' },
  { name: '/compliance-check', agent: 'Shield_Agent', description: 'GDPR/COPPA/CCPA/PIPL/APPI/PIPA 준수', model: 'opus' },
  { name: '/security-audit', agent: 'Shield_Agent', description: '코드 보안 리뷰 (OWASP Top 10)', model: 'opus' },
  { name: '/threat-model', agent: 'Shield_Agent', description: 'STRIDE 위협 모델링', model: 'opus' },
  { name: '/data-flow', agent: 'Shield_Agent', description: '데이터 수집/저장/전송 경로 매핑', model: 'sonnet' },
  { name: '/secret-scan', agent: 'Shield_Agent', description: 'API 키/시크릿 코드베이스 스캔', model: 'haiku' },
  // RedTeam_Agent
  { name: '/red-review', agent: 'RedTeam_Agent', description: '범용 적대적 리뷰 (4관점)', model: 'opus' },
  { name: '/exploit-hunt', agent: 'RedTeam_Agent', description: '게임 경제/치트 익스플로잇 탐색', model: 'opus' },
  { name: '/narrative-attack', agent: 'RedTeam_Agent', description: '논리 불일치, 메시징 결함 탐색', model: 'opus' },
  { name: '/comp-tear', agent: 'RedTeam_Agent', description: '경쟁사 관점 약점 분석', model: 'opus' },
  { name: '/cultural-review', agent: 'RedTeam_Agent', description: '5개 시장 문화적 민감도 검토', model: 'opus' },
  { name: '/devils-advocate', agent: 'RedTeam_Agent', description: '반대 논증 전개', model: 'opus' },
  // GameDesign_Agent
  { name: '/requirement', agent: 'GameDesign_Agent', description: '요구사항 분석', model: 'sonnet' },
  { name: '/pd-review', agent: 'GameDesign_Agent', description: 'PD 관점 최종 평가', model: 'opus' },
  { name: '/art-status', agent: 'GameDesign_Agent', description: '아트디렉터 리소스 완성도 조회', model: 'sonnet' },
  { name: '/report', agent: 'GameDesign_Agent', description: 'HTML 보고서 생성', model: 'sonnet' },
  // team-kowloon
  { name: '/game-art-spec', agent: 'team-kowloon', description: '게임용 아트 스펙 (스프라이트, 타일셋, UI)', model: 'sonnet' },
  { name: '/art-export', agent: 'team-kowloon', description: '플랫폼별 해상도 내보내기 (iOS/Android/PC)', model: 'haiku' },
  // GameDev_Agent
  { name: '/unity-init', agent: 'GameDev_Agent', description: 'Unity 프로젝트 스캐폴딩 + 패키지 설정', model: 'sonnet' },
  { name: '/unity-arch', agent: 'GameDev_Agent', description: '시스템 아키텍처 설계 (ECS/MVC)', model: 'opus' },
  { name: '/unity-scene', agent: 'GameDev_Agent', description: '씬/프리팹 스크립트 생성', model: 'sonnet' },
  { name: '/unity-script', agent: 'GameDev_Agent', description: 'C# MonoBehaviour/ScriptableObject', model: 'sonnet' },
  { name: '/unity-shader', agent: 'GameDev_Agent', description: 'URP/ShaderGraph 셰이더', model: 'sonnet' },
  { name: '/unity-ui', agent: 'GameDev_Agent', description: 'UI Toolkit / uGUI 구성', model: 'sonnet' },
  { name: '/unity-build', agent: 'GameDev_Agent', description: 'Unity CLI 빌드 실행 (headless)', model: 'haiku' },
  { name: '/unity-review', agent: 'GameDev_Agent', description: '다관점 코드 리뷰 (성능/보안/유지보수)', model: 'opus' },
  { name: '/unity-refactor', agent: 'GameDev_Agent', description: '리팩토링', model: 'sonnet' },
  // QATest_Agent
  { name: '/test-plan', agent: 'QATest_Agent', description: '게임 디자인 기반 테스트 계획', model: 'sonnet' },
  { name: '/test-script', agent: 'QATest_Agent', description: 'C# 유닛 테스트 (NUnit)', model: 'sonnet' },
  { name: '/platform-check', agent: 'QATest_Agent', description: 'Apple/Google/Steam 정책 준수 검증', model: 'sonnet' },
  { name: '/perf-profile', agent: 'QATest_Agent', description: 'Unity Profiler 성능 분석', model: 'sonnet' },
  { name: '/bug-report', agent: 'QATest_Agent', description: '구조화된 버그 리포트', model: 'haiku' },
  { name: '/compat-matrix', agent: 'QATest_Agent', description: '디바이스/OS 호환성 매트릭스', model: 'haiku' },
  // SSBL
  { name: '/player-monetization', agent: 'SSBL', description: '플레이 기록 ↔ 과금 유저 상관관계 분석', model: 'opus' },
  { name: '/launch-checklist', agent: 'SSBL', description: '런칭 체크리스트 상태 추적, 의존성 체인, 대시보드', model: 'haiku' },
  // Income_Factory
  { name: '/factory', agent: 'Income_Factory', description: '일일 파이프라인 오케스트레이터', model: 'sonnet' },
  { name: '/idea-scan', agent: 'Income_Factory', description: '트렌드 스캔 + 아이디어 생성', model: 'haiku' },
  { name: '/idea-eval', agent: 'Income_Factory', description: '5기준 점수화 → Top 3', model: 'sonnet' },
  { name: '/idea-critic', agent: 'Income_Factory', description: '악마의 변호인 → Kill/Proceed', model: 'opus' },
  { name: '/idea-plan', agent: 'Income_Factory', description: '7일 실행 계획', model: 'sonnet' },
  { name: '/idea-build', agent: 'Income_Factory', description: '실제 제품 제작', model: 'sonnet' },
  { name: '/idea-review', agent: 'Income_Factory', description: '품질 검증 → Pass/Revise/Kill', model: 'opus' },
  { name: '/idea-launch', agent: 'Income_Factory', description: '배포 가이드', model: 'haiku' },
  { name: '/idea-analyze', agent: 'Income_Factory', description: '주간 성과 분석', model: 'sonnet' },
  // Marketing_Agent
  { name: '/aso', agent: 'Marketing_Agent', description: '앱스토어 키워드/메타데이터 최적화', model: 'sonnet' },
  { name: '/social-copy', agent: 'Marketing_Agent', description: 'SNS 마케팅 카피', model: 'sonnet' },
  { name: '/launch-plan', agent: 'Marketing_Agent', description: '런칭 D-7~D+30 타임라인', model: 'sonnet' },
  { name: '/steam-page', agent: 'Marketing_Agent', description: 'Steam 스토어 페이지 최적화', model: 'sonnet' },
  { name: '/influencer-brief', agent: 'Marketing_Agent', description: '크리에이터 아웃리치 브리프', model: 'sonnet' },
  // Community_Agent
  { name: '/sentiment-scan', agent: 'Community_Agent', description: '플레이어 리뷰/피드백 감성 분석', model: 'sonnet' },
  { name: '/community-post', agent: 'Community_Agent', description: '패치노트/업데이트 공지 작성', model: 'sonnet' },
  { name: '/review-response', agent: 'Community_Agent', description: '앱스토어 리뷰 답변', model: 'haiku' },
  { name: '/discord-plan', agent: 'Community_Agent', description: 'Discord 서버 구조 설계', model: 'sonnet' },
  { name: '/crisis-comms', agent: 'Community_Agent', description: '부정적 PR/논란 대응', model: 'opus' },
  // ShortsFactory_Agent
  { name: '/shorts-factory', agent: 'ShortsFactory_Agent', description: '일일 파이프라인 오케스트레이터', model: 'sonnet' },
  { name: '/topic-mine', agent: 'ShortsFactory_Agent', description: '트렌드 리서치 + 고RPM 토픽 자동 선정', model: 'sonnet' },
  { name: '/shorts-script', agent: 'ShortsFactory_Agent', description: '스크립트 + 메타데이터 생성', model: 'sonnet' },
  { name: '/shorts-render', agent: 'ShortsFactory_Agent', description: 'TTS + FFmpeg 영상 렌더링', model: 'haiku' },
  { name: '/shorts-review', agent: 'ShortsFactory_Agent', description: 'YouTube 정책 준수 + 품질 검증', model: 'opus' },
  { name: '/shorts-analyze', agent: 'ShortsFactory_Agent', description: '주간 성과 분석 + 전략 조정', model: 'sonnet' },
  // ShortsFleet
  { name: '/fleet-status', agent: 'ShortsFleet', description: '전 채널 상태 조회 (읽기 전용)', model: 'haiku' },
  { name: '/fleet-add', agent: 'ShortsFleet', description: '새 채널 스캐폴딩 + 레지스트리 등록', model: 'sonnet' },
  { name: '/shorts-fleet', agent: 'ShortsFleet', description: '멀티채널 일일 병렬 생산 오케스트레이터', model: 'sonnet' },
  { name: '/fleet-analytics', agent: 'ShortsFleet', description: '크로스채널 HTML 대시보드', model: 'sonnet' },
  // PT_Agent
  { name: '/pt', agent: 'PT_Agent', description: '프레젠테이션 전체 파이프라인', model: 'sonnet' },
  { name: '/pt-from-design', agent: 'PT_Agent', description: '기획 분석 → 발표자료 변환', model: 'sonnet' },
  { name: '/pt-reception', agent: 'PT_Agent', description: '요구사항 분석', model: 'sonnet' },
  { name: '/pt-content', agent: 'PT_Agent', description: '콘텐츠 설계', model: 'sonnet' },
  { name: '/pt-visual', agent: 'PT_Agent', description: 'SVG 시각화', model: 'sonnet' },
  { name: '/pt-redteam', agent: 'PT_Agent', description: '품질 검토', model: 'opus' },
  { name: '/pt-research', agent: 'PT_Agent', description: '주제 리서치', model: 'sonnet' },
  { name: '/pt-update-check', agent: 'PT_Agent', description: '업데이트 체크', model: 'haiku' },
  { name: '/pt-export', agent: 'PT_Agent', description: '내보내기', model: 'haiku' },
  // Translate_Agent
  { name: '/translate', agent: 'Translate_Agent', description: '한글→영문/일본어 번역', model: 'sonnet' },
  { name: '/translate-cn', agent: 'Translate_Agent', description: '한글→중국어 (간체/번체)', model: 'sonnet' },
  { name: '/translate-eu', agent: 'Translate_Agent', description: '한글→프랑스어/독일어/스페인어', model: 'sonnet' },
  { name: '/localize-validate', agent: 'Translate_Agent', description: 'UI 텍스트 길이/깨짐 검증', model: 'haiku' },
  { name: '/cultural-adapt', agent: 'Translate_Agent', description: '문화적 맥락 적응 컨설팅', model: 'opus' },
  // DevOps_Agent
  { name: '/pipeline-config', agent: 'DevOps_Agent', description: 'GitHub Actions CI/CD 설정', model: 'sonnet' },
  { name: '/build-ios', agent: 'DevOps_Agent', description: 'iOS 빌드 + App Store Connect', model: 'sonnet' },
  { name: '/build-android', agent: 'DevOps_Agent', description: 'Android AAB + Play Console', model: 'sonnet' },
  { name: '/build-steam', agent: 'DevOps_Agent', description: 'Steam + Steamworks SDK', model: 'sonnet' },
  { name: '/deploy-stage', agent: 'DevOps_Agent', description: '스테이징 배포 (TestFlight/내부트랙/Beta)', model: 'haiku' },
  { name: '/deploy-prod', agent: 'DevOps_Agent', description: '프로덕션 배포 + 롤백 (CEO 승인 필수)', model: 'sonnet' },
  { name: '/platform-status', agent: 'DevOps_Agent', description: '전체 플랫폼 빌드/리뷰 상태', model: 'haiku' },
  { name: '/hotfix', agent: 'DevOps_Agent', description: '긴급 핫픽스 파이프라인', model: 'sonnet' },
  // HR_Agent
  { name: '/org-chart', agent: 'HR_Agent', description: '조직도 인터랙티브 HTML', model: 'sonnet' },
  { name: '/reorg', agent: 'HR_Agent', description: '재조직 분석', model: 'opus' },
];
