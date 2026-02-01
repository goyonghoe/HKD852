# 사람이 관리하는 영역

## 📂 구조

### reference_sheets/
레퍼런스 시트 (템플릿)
- ref_Constant.csv: 리소스 타입별 규격 정의
- ref_신규앨범_ADP.csv: 신규 앨범 명세서 템플릿
- ref_한정테마_ADP.csv: 한정 테마 명세서 템플릿

### config/
설정 파일
- config.json: 시스템 설정

### credentials/
인증 정보 (gitignore)
- service_account_key.json: Google Sheets API 인증키

## ⚠️ 주의사항
- credentials/ 폴더는 Git에 커밋되지 않습니다
- reference_sheets/는 명세서 생성 템플릿으로 사용됩니다
