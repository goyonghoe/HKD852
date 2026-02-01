# 프레젠테이션 가이드

## 📊 제공되는 문서

### 1. 상세 시각화 문서 (Markdown)
**파일**: [`SYSTEM_VISUALIZATION.md`](SYSTEM_VISUALIZATION.md)
- GitHub에서 바로 렌더링
- Mermaid 다이어그램 포함
- 버전 관리 용이

**용도**:
- 문서화
- GitHub/GitLab에서 공유
- VS Code 미리보기

### 2. 웹 프레젠테이션 (reveal.js)
**파일**: [`presentation.html`](presentation.html)
- 인터랙티브 슬라이드
- 19개 슬라이드
- 발표용

**용도**:
- 팀 발표
- 클라이언트 미팅
- 프로젝트 소개

---

## 🌐 웹 프레젠테이션 사용법

### 방법 1: 로컬에서 바로 열기 (가장 간단)

```bash
# 1. 파일 탐색기에서 presentation.html 더블클릭
# 또는 브라우저에서 직접 열기
open docs/presentation.html
```

### 방법 2: 로컬 서버로 실행

```bash
# Python 내장 서버 사용
cd team-kowloon/docs
python3 -m http.server 8000

# 브라우저에서 열기
# http://localhost:8000/presentation.html
```

### 방법 3: GitHub Pages로 배포

```bash
# 1. GitHub에 푸시
git add docs/presentation.html
git commit -m "Add presentation"
git push

# 2. GitHub Settings > Pages에서 활성화
# 3. 공유 가능한 URL 생성
# https://your-username.github.io/HKD852/team-kowloon/docs/presentation.html
```

---

## ⌨️ 프레젠테이션 조작법

### 기본 조작
- `→` 또는 `Space`: 다음 슬라이드
- `←`: 이전 슬라이드
- `Home`: 첫 슬라이드
- `End`: 마지막 슬라이드
- `Esc` 또는 `O`: 슬라이드 개요 보기
- `F`: 전체화면 모드
- `S`: 발표자 노트 보기 (별도 창)

### 고급 기능
- `B` 또는 `.`: 화면 블랙아웃
- `?`: 도움말 표시
- 마우스 클릭: 다음 슬라이드

---

## 📑 슬라이드 구성 (총 19개)

1. **제목** - SSBL 파이프라인 소개
2. **문제 인식** - 기존 문제점
3. **솔루션** - AI 기반 자동화
4. **시스템 아키텍처** - 전체 구조
5. **핵심 기능 #1** - 자동 명세서 생성
6. **핵심 기능 #2** - 시각 참고 자료
7. **핵심 기능 #3** - 이미지 품질 검증
8. **성과 지표** - 70%, 90%, 95%, 85%
9. **기술 스택** - Python, AI, Cloud
10. **AI 에이전트** - 9개 에이전트
11. **폴더 구조** - 프로젝트 구조
12. **데이터 흐름** - 8단계 프로세스
13. **로드맵** - 완료/예정
14. **실제 사용** - 명령어 예시
15. **시각화 예시** - 명세서 샘플
16. **통계** - 시스템 통계
17. **향후 계획** - Phase 2
18. **결론** - 핵심 성과
19. **Q&A** - 질문 응답

---

## 🎨 커스터마이징

### 테마 변경
`presentation.html` 파일에서 테마 변경:

```html
<!-- 현재: black -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/theme/black.css">

<!-- 다른 테마들: -->
<!-- white, league, beige, sky, night, serif, simple, solarized -->
```

### 슬라이드 추가
HTML 파일에서 `<section>` 태그로 슬라이드 추가:

```html
<section>
    <h2>새로운 슬라이드</h2>
    <p>내용</p>
</section>
```

### Mermaid 다이어그램 추가
```html
<section>
    <h2>다이어그램</h2>
    <pre class="mermaid">
    graph TD
        A --> B
    </pre>
</section>
```

---

## 📤 공유 방법

### 1. 파일 공유
- `presentation.html` 파일을 직접 전송
- 받는 사람은 브라우저로 열기만 하면 됨
- 인터넷 연결 필요 (CDN 사용)

### 2. GitHub Pages (추천)
```bash
# Settings > Pages > Source: main branch / docs folder
# 자동으로 URL 생성
```

### 3. Google Drive/Dropbox
- HTML 파일 업로드
- 공유 링크 생성
- 직접 링크로 접근 가능

### 4. 스크린 레코딩
```bash
# macOS
# Cmd+Shift+5로 화면 녹화
# 프레젠테이션 진행하며 녹화
# 동영상 파일로 공유
```

---

## 🖨️ PDF 변환

### 방법 1: 브라우저 인쇄
1. 프레젠테이션 열기
2. `?print-pdf`를 URL에 추가
   ```
   presentation.html?print-pdf
   ```
3. 브라우저 인쇄 기능 (Cmd+P)
4. PDF로 저장

### 방법 2: decktape (고급)
```bash
# decktape 설치
npm install -g decktape

# PDF 생성
decktape reveal presentation.html presentation.pdf
```

---

## 💡 발표 팁

### 준비
1. ✅ 사전에 슬라이드 전체 검토
2. ✅ 발표자 노트 확인 (`S` 키)
3. ✅ 화면 공유 테스트
4. ✅ 인터넷 연결 확인 (CDN 로딩)

### 발표 중
- `S` 키로 발표자 노트 창 열기 (별도 모니터에 표시)
- `B` 키로 필요시 블랙아웃
- `F` 키로 전체화면
- `Esc`로 슬라이드 개요 보며 점프

### 발표 후
- Q&A 슬라이드 활용
- 문서 링크 공유 (README.md, SYSTEM_VISUALIZATION.md)

---

## 🔧 문제 해결

### 다이어그램이 안 보여요
- 인터넷 연결 확인 (Mermaid CDN 필요)
- 브라우저 새로고침 (Cmd+R)

### 슬라이드가 깨져요
- 최신 브라우저 사용 (Chrome, Firefox, Safari)
- 캐시 삭제 후 다시 열기

### PDF 변환이 안 돼요
- `?print-pdf` URL 파라미터 확인
- Chrome 브라우저 사용 권장

---

## 📚 추가 리소스

### reveal.js 공식 문서
- https://revealjs.com/

### Mermaid 문법
- https://mermaid.js.org/

### GitHub Pages 가이드
- https://pages.github.com/

---

## ✅ 체크리스트

발표 전 확인사항:
- [ ] 프레젠테이션 파일 열림 확인
- [ ] 모든 슬라이드 표시 확인
- [ ] 다이어그램 렌더링 확인
- [ ] 발표 시간 연습 (약 20-30분)
- [ ] 백업 PDF 준비
- [ ] 질문 답변 준비

---

**Happy Presenting! 🎉**
