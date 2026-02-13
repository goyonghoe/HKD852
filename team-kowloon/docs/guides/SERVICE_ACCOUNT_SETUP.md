# Google Sheets API 서비스 계정 설정 가이드

자동 업로드를 위한 Google Cloud 서비스 계정 설정 방법

---

## 📋 설정 순서

### 1단계: Google Cloud 프로젝트 생성

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/

2. **프로젝트 생성**
   - 상단 프로젝트 선택 드롭다운 클릭
   - "새 프로젝트" 클릭
   - 프로젝트 이름: `SSBL Art Automation` (원하는 이름)
   - "만들기" 클릭

3. **Google Sheets API 활성화**
   - 좌측 메뉴: `API 및 서비스` > `라이브러리`
   - 검색: "Google Sheets API"
   - "Google Sheets API" 클릭
   - "사용" 버튼 클릭

---

### 2단계: 서비스 계정 생성

1. **서비스 계정 만들기**
   - 좌측 메뉴: `API 및 서비스` > `사용자 인증 정보`
   - 상단: `사용자 인증 정보 만들기` > `서비스 계정` 선택

2. **서비스 계정 정보 입력**
   - 서비스 계정 이름: `ssbl-sheets-automation`
   - 서비스 계정 ID: 자동 생성됨 (예: `ssbl-sheets-automation@...`)
   - 서비스 계정 설명: "SSBL 명세서 자동 업로드"
   - "만들고 계속하기" 클릭

3. **역할 부여 (선택 사항, 건너뛰기 가능)**
   - "계속" 클릭
   - "완료" 클릭

---

### 3단계: JSON 키 파일 생성

1. **서비스 계정 목록에서**
   - 방금 생성한 서비스 계정 클릭

2. **키 탭으로 이동**
   - 상단 탭: `키` 클릭
   - `키 추가` > `새 키 만들기` 클릭

3. **키 생성**
   - 키 유형: `JSON` 선택
   - "만들기" 클릭
   - 자동으로 JSON 파일 다운로드됨

4. **JSON 파일 이동**
   ```bash
   # 다운로드된 JSON 파일을 team-kowloon 폴더로 이동
   mv ~/Downloads/your-project-xxxxx-xxxxxx.json \
      /Users/yong/MainFolder/My_AI_Project/HKD852/team-kowloon/service_account_key.json
   ```

---

### 4단계: Google Sheets 공유

**중요!** 서비스 계정에 Google Sheets 접근 권한을 부여해야 합니다.

1. **서비스 계정 이메일 복사**
   - JSON 파일을 열어서 `client_email` 값 복사
   - 예: `ssbl-sheets-automation@your-project-123456.iam.gserviceaccount.com`

2. **Google Sheets 열기**
   ```
   https://docs.google.com/spreadsheets/d/1wzyjG6pRK53DnhPAL_XNVeMrclovMGnbWQ4xpBBLEmQ/edit
   ```

3. **공유 설정**
   - 우측 상단 "공유" 버튼 클릭
   - 서비스 계정 이메일 주소 입력
   - 권한: **편집자** 선택
   - "보내기" 클릭

---

## ✅ 테스트

설정이 완료되었으면 자동 업로드를 테스트합니다:

```bash
cd /Users/yong/MainFolder/My_AI_Project/HKD852/team-kowloon
python3 auto_upload_to_sheets.py
```

**예상 결과:**
```
======================================================================
  Google Sheets 자동 업로드
======================================================================

✅ gspread 라이브러리 발견

🔐 서비스 계정으로 인증 중...
📊 스프레드시트 열기: 1wzyjG6pRK53DnhPAL_XNVeMrclovMGnbWQ4xpBBLEmQ
📤 업로드: 명세서/명세서_요약.csv → 명세서_요약
   ✅ 업로드 완료 (14행 x 2열)
   🎨 헤더 서식 적용
📤 업로드: 명세서/명세서_전체목록.csv → 명세서_전체목록
   ✅ 업로드 완료 (62행 x 13열)
   🎨 헤더 서식 적용
📤 업로드: 명세서/명세서_우선순위.csv → 명세서_우선순위
   ✅ 업로드 완료 (62행 x 8열)
   🎨 헤더 서식 적용

✅ 모든 파일 업로드 완료!
🌐 확인: https://docs.google.com/spreadsheets/d/...
```

---

## 🔒 보안 주의사항

### service_account_key.json 파일 관리

**절대 GitHub에 커밋하지 마세요!**

`.gitignore`에 추가:
```bash
echo "service_account_key.json" >> .gitignore
```

**파일 권한 설정:**
```bash
chmod 600 service_account_key.json
```

---

## 🆘 문제 해결

### Q: "파일이 없습니다" 오류
**A:** JSON 키 파일이 올바른 위치에 있는지 확인:
```bash
ls -la /Users/yong/MainFolder/My_AI_Project/HKD852/team-kowloon/service_account_key.json
```

### Q: "권한이 거부되었습니다" 오류
**A:** Google Sheets를 서비스 계정 이메일과 공유했는지 확인하세요.
- Google Sheets > 공유 > 서비스 계정 이메일 추가 > 편집자 권한

### Q: "API가 활성화되지 않았습니다" 오류
**A:** Google Cloud Console에서 Google Sheets API를 활성화했는지 확인:
- https://console.cloud.google.com/apis/library
- "Google Sheets API" 검색 후 "사용" 클릭

### Q: JSON 파일에서 client_email을 어떻게 찾나요?
**A:**
```bash
cat service_account_key.json | grep client_email
```
또는 텍스트 에디터로 열어서 `"client_email"` 필드 찾기

---

## 🎯 완료 후

설정이 완료되면 다음과 같이 사용할 수 있습니다:

### 일일 워크플로우
```bash
# 1. 명세서 생성
python3 spec_generator.py

# 2. Google Sheets 자동 업로드
python3 auto_upload_to_sheets.py
```

### 주간 자동화 (cron)
```bash
# 매주 금요일 9시 자동 실행
0 9 * * 5 cd /Users/yong/MainFolder/My_AI_Project/HKD852/team-kowloon && python3 spec_generator.py && python3 auto_upload_to_sheets.py
```

---

## 📚 참고 자료

- [Google Cloud Console](https://console.cloud.google.com/)
- [gspread 문서](https://docs.gspread.org/)
- [Google Sheets API 문서](https://developers.google.com/sheets/api)

✅ 설정 완료 후 완전 자동화된 명세서 업로드를 즐기세요!
