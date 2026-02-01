# JSON 키 다운로드 상세 가이드

Google Cloud Console에서 서비스 계정 JSON 키를 다운로드하는 방법

---

## 🎯 전체 과정 (처음부터)

### 1단계: Google Cloud Console 접속

1. **브라우저에서 열기**
   ```
   https://console.cloud.google.com/
   ```

2. **로그인**
   - Google 계정으로 로그인

---

### 2단계: 프로젝트 생성 (아직 없다면)

1. **상단 프로젝트 선택 영역 클릭**
   - 상단 바에 "Google Cloud" 로고 옆에 프로젝트 이름이 보입니다
   - 클릭하면 드롭다운 메뉴가 나타납니다

2. **"새 프로젝트" 클릭**
   - 팝업 창 우측 상단의 "새 프로젝트" 버튼

3. **프로젝트 정보 입력**
   - 프로젝트 이름: `SSBL-Art-Automation` (원하는 이름)
   - 위치: 조직 없음
   - "만들기" 클릭

4. **프로젝트 생성 대기**
   - 1-2분 소요
   - 알림이 뜨면 "프로젝트 선택" 클릭

---

### 3단계: Google Sheets API 활성화

1. **좌측 메뉴 열기**
   - 좌측 상단 ☰ (햄버거 메뉴) 클릭

2. **"API 및 서비스" 선택**
   - 메뉴에서 "API 및 서비스" 찾기
   - 그 안의 **"라이브러리"** 클릭

3. **Google Sheets API 검색**
   - 검색창에 "Google Sheets API" 입력
   - 결과에서 "Google Sheets API" 클릭

4. **API 사용 설정**
   - "사용" 또는 "ENABLE" 버튼 클릭
   - 활성화 완료!

---

### 4단계: 서비스 계정 만들기

1. **좌측 메뉴에서 "사용자 인증 정보" 클릭**
   - 좌측 ☰ 메뉴
   - "API 및 서비스"
   - **"사용자 인증 정보"** 클릭

2. **상단 "+ 사용자 인증 정보 만들기" 클릭**
   - 페이지 상단의 파란색 버튼
   - 드롭다운에서 **"서비스 계정"** 선택

3. **서비스 계정 정보 입력**

   **서비스 계정 세부정보:**
   - 서비스 계정 이름: `ssbl-sheets-automation`
   - 서비스 계정 ID: 자동 생성됨 (예: `ssbl-sheets-automation@...`)
   - 서비스 계정 설명: `SSBL 명세서 자동 업로드`

   → **"만들고 계속하기"** 클릭

4. **역할 선택 (선택사항 - 건너뛰기 가능)**
   - **"계속"** 클릭 (역할 선택 안 함)

5. **사용자 액세스 권한 (선택사항 - 건너뛰기 가능)**
   - **"완료"** 클릭

---

### 5단계: JSON 키 다운로드 ⭐ (여기가 중요!)

1. **서비스 계정 목록 확인**
   - 화면에 방금 만든 서비스 계정이 보입니다
   - 이메일 형식: `ssbl-sheets-automation@프로젝트ID.iam.gserviceaccount.com`

2. **서비스 계정 클릭**
   - 서비스 계정의 **이메일 주소**를 클릭합니다
   - 또는 우측 ... (점 3개) 메뉴에서 "관리" 클릭

3. **"키" 탭으로 이동**
   - 상단 탭에서 **"키"** (KEYS) 클릭
   - "이 서비스 계정의 키가 없습니다" 메시지가 보입니다

4. **"키 추가" 클릭**
   - "키 추가" 버튼 클릭
   - 드롭다운에서 **"새 키 만들기"** 선택

5. **키 유형 선택**
   - 팝업 창에서 **"JSON"** 선택 (기본값)
   - **"만들기"** 클릭

6. **자동 다운로드**
   - JSON 파일이 자동으로 다운로드됩니다
   - 파일명 예: `프로젝트명-xxxxxxxxxxxxx.json`
   - "비공개 키가 컴퓨터에 저장되었습니다" 메시지 확인

---

## 📦 다운로드된 파일 처리

### JSON 파일 확인

다운로드 폴더에서 파일 찾기:
```bash
ls -lh ~/Downloads/*.json
```

### 프로젝트 폴더로 이동

```bash
# 최근 다운로드된 JSON 파일 이름 확인
ls -lt ~/Downloads/*.json | head -1

# 파일 이동 (파일명을 실제 다운로드된 이름으로 변경)
mv ~/Downloads/프로젝트명-xxxxxxxxxxxxx.json \
   /Users/yong/MainFolder/My_AI_Project/HKD852/team-kowloon/service_account_key.json
```

또는 Finder 사용:
1. Finder에서 Downloads 폴더 열기
2. JSON 파일 찾기 (가장 최근 파일)
3. 파일을 `/Users/yong/MainFolder/My_AI_Project/HKD852/team-kowloon/` 폴더로 드래그
4. 이름을 `service_account_key.json`으로 변경

### 파일 확인

```bash
cd /Users/yong/MainFolder/My_AI_Project/HKD852/team-kowloon
ls -la service_account_key.json
```

**출력 예:**
```
-rw-r--r--  1 yong  staff  2345 Feb  1 15:30 service_account_key.json
```

---

## 🔐 서비스 계정 이메일 확인

JSON 파일에서 서비스 계정 이메일 추출:

```bash
cat service_account_key.json | grep client_email
```

**출력 예:**
```
"client_email": "ssbl-sheets-automation@프로젝트ID.iam.gserviceaccount.com",
```

이 이메일 주소를 복사하세요! (다음 단계에서 필요)

---

## 📊 Google Sheets 공유

1. **Google Sheets 열기**
   ```
   https://docs.google.com/spreadsheets/d/1wzyjG6pRK53DnhPAL_XNVeMrclovMGnbWQ4xpBBLEmQ/edit
   ```

2. **공유 버튼 클릭**
   - 우측 상단 "공유" 버튼

3. **서비스 계정 추가**
   - 위에서 확인한 서비스 계정 이메일 입력
   - 권한: **편집자** 선택
   - **보내기** 클릭

---

## ✅ 테스트

모든 설정이 완료되었으면:

```bash
cd /Users/yong/MainFolder/My_AI_Project/HKD852/team-kowloon
python3 auto_upload_to_sheets.py
```

**성공 메시지:**
```
✅ gspread 라이브러리 발견
🔐 서비스 계정으로 인증 중...
📊 스프레드시트 열기: 1wzyjG6pRK53DnhPAL_XNVeMrclovMGnbWQ4xpBBLEmQ
📤 업로드: 명세서/명세서_요약.csv → 명세서_요약
   ✅ 업로드 완료
...
✅ 모든 파일 업로드 완료!
```

---

## 🆘 문제 해결

### Q: "사용자 인증 정보" 메뉴가 안 보여요
**A:**
1. 좌측 상단 ☰ 햄버거 메뉴 클릭
2. "API 및 서비스" 찾기
3. 하위 메뉴에서 "사용자 인증 정보" 클릭

### Q: "서비스 계정" 옵션이 안 보여요
**A:**
1. 페이지 상단 "+ 사용자 인증 정보 만들기" 버튼 클릭
2. 드롭다운 메뉴가 나타남
3. 세 가지 옵션 중 "서비스 계정" 선택

### Q: "키" 탭이 안 보여요
**A:**
1. 서비스 계정 목록에서 이메일 주소 자체를 클릭
2. 상단에 "세부정보", "권한", "키" 탭이 보임
3. "키" 탭 클릭

### Q: JSON 파일이 다운로드 안 돼요
**A:**
1. 브라우저 팝업 차단 해제
2. 다운로드 폴더 확인: `ls ~/Downloads/*.json`
3. 안 되면 "키 추가" > "새 키 만들기" 다시 시도

---

## 📝 빠른 요약

1. https://console.cloud.google.com/ 접속
2. 프로젝트 생성
3. Google Sheets API 활성화
4. 좌측 메뉴: API 및 서비스 > 사용자 인증 정보
5. 상단: + 사용자 인증 정보 만들기 > 서비스 계정
6. 서비스 계정 생성 후 이메일 클릭
7. "키" 탭 > "키 추가" > "새 키 만들기" > JSON
8. 자동 다운로드된 JSON 파일을 `service_account_key.json`으로 이동
9. Google Sheets를 서비스 계정 이메일과 공유
10. `python3 auto_upload_to_sheets.py` 실행

---

**막히는 부분이 있으면 구체적으로 어느 단계에서 막혔는지 알려주세요!** 🙋‍♂️
