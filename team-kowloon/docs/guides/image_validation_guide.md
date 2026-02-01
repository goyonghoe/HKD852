# 이미지 규격 자동 검증 가이드

이미지 파일의 사이즈, 포맷, 파일 크기, 색상 모드를 자동으로 검증하여 품질 이슈를 사전에 차단합니다.

## 목차
- [기능 개요](#기능-개요)
- [빠른 시작](#빠른-시작)
- [검증 규칙](#검증-규칙)
- [사용 예제](#사용-예제)
- [리포트 해석](#리포트-해석)

---

## 기능 개요

### 검증 항목
- ✅ **이미지 사이즈** - 명세서 규격과 실제 이미지 사이즈 비교
- ✅ **파일 포맷** - PNG, JPG 등 허용된 포맷 확인
- ✅ **색상 모드** - RGB, RGBA 등 색상 모드 확인
- ✅ **파일 크기** - 최소/최대 파일 크기 검증
- ✅ **리소스 타입별 규칙** - 포토카드, 프로필 등 타입별 세부 규칙 적용

### 예상 효과
- 🎯 품질 이슈 90% 사전 차단
- ⚡ 수작업 검증 시간 절감
- 📊 자동 리포트 생성

---

## 빠른 시작

### 1. 필수 패키지 설치

```bash
pip install Pillow
```

### 2. 단일 이미지 검증

```bash
python3 scripts/validate_images.py path/to/image.png --size 1280x720 --type 포토카드
```

### 3. 디렉토리 전체 검증

```bash
python3 scripts/validate_images.py path/to/images/
```

### 4. 리포트 생성 (JSON)

```bash
python3 scripts/validate_images.py path/to/images/ --format json
```

---

## 검증 규칙

검증 규칙은 [`1_human_control/config/image_validation_rules.json`](../../1_human_control/config/image_validation_rules.json)에서 설정합니다.

### 전역 규칙

| 항목 | 기본값 | 설명 |
|------|--------|------|
| `allowed_formats` | PNG, JPG, JPEG | 허용된 이미지 포맷 |
| `allowed_color_modes` | RGB, RGBA | 허용된 색상 모드 |
| `max_file_size_mb` | 10 | 최대 파일 크기 (MB) |
| `min_file_size_kb` | 1 | 최소 파일 크기 (KB) |
| `strict_size_matching` | true | 엄격한 사이즈 일치 검증 |

### 리소스 타입별 규칙

#### 포토카드 / 초상
- **포맷**: PNG 필수
- **색상 모드**: RGBA (투명도 필요)
- **최대 파일 크기**: 5MB
- **권장 DPI**: 300

#### 프로필 이미지
- **포맷**: PNG 필수
- **색상 모드**: RGBA (투명도 필요)
- **최대 파일 크기**: 3MB
- **권장 DPI**: 150

#### 앨범 커버
- **포맷**: PNG 권장
- **색상 모드**: RGB 가능
- **최대 파일 크기**: 5MB
- **권장 DPI**: 300

#### 배경 이미지
- **포맷**: PNG 권장
- **색상 모드**: RGB 가능
- **최대 파일 크기**: 10MB
- **권장 DPI**: 150

#### 엠블럼 / 로고
- **포맷**: PNG 필수
- **색상 모드**: RGBA (투명 배경 필요)
- **최대 파일 크기**: 2MB
- **권장 DPI**: 150

---

## 사용 예제

### Python 코드로 사용

```python
from image_validator import ImageValidator

# 검증기 생성
validator = ImageValidator()

# 단일 이미지 검증
result = validator.validate_image(
    image_path='path/to/image.png',
    expected_size='1280x720',
    resource_type='포토카드'
)

if result.is_valid:
    print("✅ 검증 통과")
else:
    print("❌ 문제 발견:")
    for issue in result.issues:
        print(f"  - {issue}")

# 디렉토리 검증
results = validator.validate_directory(
    directory='path/to/images/',
    spec_mapping={
        'Image_Card_001': ('512x512', '포토카드'),
        'Image_Profile_001': ('256x256', '프로필'),
    }
)

# 리포트 생성
validator.generate_report(format='json')
validator.generate_report(format='text')
validator.print_summary()
```

### CLI로 사용

#### 1. 단일 이미지 검증
```bash
python3 scripts/validate_images.py \
  resources/images/photocard_001.png \
  --size 512x512 \
  --type 포토카드 \
  --format json
```

#### 2. 디렉토리 검증
```bash
python3 scripts/validate_images.py \
  resources/images/ \
  --format text \
  --output validation_report.txt
```

---

## 리포트 해석

### JSON 리포트 구조

```json
{
  "generated_at": "2026-02-01T12:00:00",
  "summary": {
    "total_images": 10,
    "valid_images": 8,
    "invalid_images": 2,
    "validation_rate": "80.0%"
  },
  "results": [
    {
      "file_path": "image.png",
      "expected_size": "1280x720",
      "actual_size": "1280x720",
      "actual_format": "PNG",
      "color_mode": "RGBA",
      "file_size_bytes": 524288,
      "is_valid": true,
      "issues": []
    }
  ]
}
```

### TEXT 리포트 예시

```
======================================================================
  이미지 검증 리포트
======================================================================

생성 시각: 2026-02-01 12:00:00
총 이미지: 10개
유효: 8개
문제: 2개
검증률: 80.0%

----------------------------------------------------------------------
검증 결과 상세
----------------------------------------------------------------------

[1] ✅ 정상
  파일: /path/to/image1.png
  예상 사이즈: 1280x720
  실제 사이즈: 1280x720
  포맷: PNG
  색상 모드: RGBA
  파일 크기: 512.0 KB

[2] ❌ 문제
  파일: /path/to/image2.png
  예상 사이즈: 512x512
  실제 사이즈: 256x256
  포맷: PNG
  색상 모드: RGB
  파일 크기: 128.5 KB
  문제점:
    - 사이즈 불일치: 예상 512x512, 실제 256x256
    - 포토카드 색상 모드 불일치: RGB → RGBA 필요
```

---

## 일반적인 문제와 해결 방법

### 사이즈 불일치
**문제**: `사이즈 불일치: 예상 1280x720, 실제 1920x1080`

**해결**:
```bash
# ImageMagick 사용
convert input.png -resize 1280x720 output.png

# Photoshop: Image > Image Size
```

### 포맷 문제
**문제**: `지원되지 않는 포맷: WEBP`

**해결**:
```bash
# PNG로 변환
convert input.webp output.png
```

### 색상 모드 불일치
**문제**: `포토카드 색상 모드 불일치: RGB → RGBA 필요`

**해결**:
```bash
# RGBA로 변환
convert input.png -background none -alpha on output.png
```

### 파일 크기 초과
**문제**: `파일 크기 초과: 8.5MB (최대: 5MB)`

**해결**:
```bash
# PNG 압축
pngquant --quality=80-95 input.png -o output.png

# 또는 품질 조정
convert input.png -quality 85 output.png
```

---

## FAQ

**Q: 검증 규칙을 수정할 수 있나요?**
A: 네, [`image_validation_rules.json`](../../1_human_control/config/image_validation_rules.json) 파일을 직접 수정하세요.

**Q: 특정 이미지만 검증 예외 처리하려면?**
A: 현재는 지원하지 않습니다. 향후 업데이트 예정입니다.

**Q: 자동으로 이미지를 수정할 수 있나요?**
A: 현재는 검증만 제공합니다. 자동 수정 기능은 추후 추가 예정입니다.

---

## 참고 문서
- [ImageValidator API](../../2_ai_agents/utils/image_validator.py)
- [검증 규칙 설정](../../1_human_control/config/image_validation_rules.json)
- [Pipeline Supervisor](./pipeline_supervisor.md)
