# 🚀 다음 단계: Google Sheets 자동 업로드 설정

라이브러리 설치 완료! ✅

---

## ⚡ 빠른 체크리스트

### [ ] 1. Google Cloud 설정 (10분)

**단계:**
1. https://console.cloud.google.com/ 접속
2. 새 프로젝트 생성: "SSBL Art Automation"
3. Google Sheets API 활성화
4. 서비스 계정 생성: `ssbl-sheets-automation`
5. JSON 키 다운로드

**자세한 가이드:** [SERVICE_ACCOUNT_SETUP.md](SERVICE_ACCOUNT_SETUP.md)

---

### [ ] 2. JSON 키 파일 이동

다운로드한 JSON 파일을 프로젝트 폴더로 이동:

```bash
mv ~/Downloads/your-project-*.json \
   /Users/yong/MainFolder/My_AI_Project/HKD852/team-kowloon/service_account_key.json
```

**확인:**
```bash
ls -la service_account_key.json
```

---

### [ ] 3. Google Sheets 공유

1. **서비스 계정 이메일 확인:**
   ```bash
   cat service_account_key.json | grep client_email
   ```

2. **Google Sheets에서 공유:**
   - https://docs.google.com/spreadsheets/d/1wzyjG6pRK53DnhPAL_XNVeMrclovMGnbWQ4xpBBLEmQ/edit
   - 우측 상단 "공유" 클릭
   - 서비스 계정 이메일 입력
   - **편집자** 권한 부여

---

### [ ] 4. 테스트 실행

```bash
python3 auto_upload_to_sheets.py
```

**성공하면:** Google Sheets에 3개 탭 자동 생성됩니다!
- `명세서_요약`
- `명세서_전체목록`
- `명세서_우선순위`

---

## 🎯 설정 후 사용법

### 명세서 생성 및 업로드 (한 번에)

```bash
# 1. 명세서 생성 (마크다운 + CSV)
python3 spec_generator.py

# 2. Google Sheets 자동 업로드
python3 auto_upload_to_sheets.py
```

### 또는 전체 파이프라인 실행

```bash
python3 complete_pipeline_demo.py
```

---

## 📝 요약

**현재 상태:**
- ✅ gspread, google-auth 설치 완료
- ⏳ 서비스 계정 설정 필요
- ⏳ Google Sheets 공유 필요

**다음 단계:**
1. [SERVICE_ACCOUNT_SETUP.md](SERVICE_ACCOUNT_SETUP.md) 가이드 따라하기
2. `service_account_key.json` 파일 생성
3. Google Sheets 공유 설정
4. `python3 auto_upload_to_sheets.py` 실행

**예상 소요 시간:** 10-15분

---

## 💡 팁

### 빠르게 시작하려면
수동 업로드도 간단합니다:
```bash
python3 upload_to_sheets.py
```
이후 Google Sheets UI에서 CSV 파일 가져오기

### 자동화 완료 후
매주 자동 생성 및 업로드 설정 가능 (cron 사용)

---

**준비되셨나요?** [SERVICE_ACCOUNT_SETUP.md](SERVICE_ACCOUNT_SETUP.md)를 열어서 시작하세요! 🚀
