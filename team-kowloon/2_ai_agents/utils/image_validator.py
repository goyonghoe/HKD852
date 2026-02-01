#!/usr/bin/env python3
"""
Image Validator - 이미지 규격 자동 검증

이미지 파일의 사이즈, 포맷, 파일 크기, 색상 모드 등을 자동으로 검증합니다.
명세서의 규격과 실제 이미지를 비교하여 불일치를 감지합니다.
"""

import sys
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime

try:
    from PIL import Image
except ImportError:
    print("⚠️  Pillow 라이브러리가 설치되지 않았습니다.")
    print("설치: pip install Pillow")
    sys.exit(1)


@dataclass
class ValidationResult:
    """검증 결과"""
    file_path: str
    expected_size: str  # "1280x720"
    actual_size: str
    expected_format: Optional[str] = None
    actual_format: Optional[str] = None
    file_size_bytes: int = 0
    color_mode: Optional[str] = None
    is_valid: bool = True
    issues: List[str] = None

    def __post_init__(self):
        if self.issues is None:
            self.issues = []


class ImageValidator:
    """이미지 규격 자동 검증 시스템"""

    def __init__(self, validation_rules_path: Optional[str] = None):
        """
        Args:
            validation_rules_path: 검증 규칙 설정 파일 경로
        """
        self.project_root = Path(__file__).parent.parent.parent
        self.validation_rules = self._load_validation_rules(validation_rules_path)
        self.validation_results: List[ValidationResult] = []

    def _load_validation_rules(self, rules_path: Optional[str]) -> Dict:
        """검증 규칙 로드"""
        if rules_path is None:
            rules_path = self.project_root / '1_human_control' / 'config' / 'image_validation_rules.json'
        else:
            rules_path = Path(rules_path)

        # 기본 규칙
        default_rules = {
            "allowed_formats": ["PNG", "JPG", "JPEG"],
            "allowed_color_modes": ["RGB", "RGBA"],
            "max_file_size_mb": 10,
            "min_file_size_kb": 1,
            "strict_size_matching": True,
            "resource_type_rules": {
                "포토카드": {
                    "expected_format": "PNG",
                    "required_color_mode": "RGBA",
                    "max_file_size_mb": 5
                },
                "프로필": {
                    "expected_format": "PNG",
                    "required_color_mode": "RGBA",
                    "max_file_size_mb": 3
                },
                "앨범 커버": {
                    "expected_format": "PNG",
                    "max_file_size_mb": 5
                },
                "배경": {
                    "expected_format": "PNG",
                    "max_file_size_mb": 10
                }
            }
        }

        if not rules_path.exists():
            return default_rules

        try:
            with open(rules_path, 'r', encoding='utf-8') as f:
                custom_rules = json.load(f)
                # 기본 규칙과 병합
                default_rules.update(custom_rules)
                return default_rules
        except Exception as e:
            print(f"⚠️  검증 규칙 로드 실패: {e}")
            return default_rules

    def validate_image(
        self,
        image_path: str,
        expected_size: str,
        resource_type: Optional[str] = None
    ) -> ValidationResult:
        """
        단일 이미지 검증

        Args:
            image_path: 이미지 파일 경로
            expected_size: 예상 사이즈 (예: "1280x720")
            resource_type: 리소스 타입 (예: "포토카드")

        Returns:
            ValidationResult: 검증 결과
        """
        image_path = Path(image_path)

        # 파일 존재 확인
        if not image_path.exists():
            return ValidationResult(
                file_path=str(image_path),
                expected_size=expected_size,
                actual_size="N/A",
                is_valid=False,
                issues=["파일이 존재하지 않습니다"]
            )

        issues = []

        try:
            # 이미지 열기
            with Image.open(image_path) as img:
                # 실제 사이즈
                actual_width, actual_height = img.size
                actual_size = f"{actual_width}x{actual_height}"

                # 포맷
                actual_format = img.format

                # 색상 모드
                color_mode = img.mode

                # 파일 크기
                file_size_bytes = image_path.stat().st_size
                file_size_mb = file_size_bytes / (1024 * 1024)

                # 사이즈 검증
                if expected_size != "(미정)" and expected_size != "":
                    expected_width, expected_height = self._parse_size(expected_size)
                    if expected_width and expected_height:
                        if actual_width != expected_width or actual_height != expected_height:
                            issues.append(
                                f"사이즈 불일치: 예상 {expected_size}, 실제 {actual_size}"
                            )

                # 포맷 검증
                allowed_formats = self.validation_rules.get("allowed_formats", [])
                if actual_format not in allowed_formats:
                    issues.append(
                        f"지원되지 않는 포맷: {actual_format} (허용: {', '.join(allowed_formats)})"
                    )

                # 색상 모드 검증
                allowed_color_modes = self.validation_rules.get("allowed_color_modes", [])
                if color_mode not in allowed_color_modes:
                    issues.append(
                        f"색상 모드 문제: {color_mode} (권장: {', '.join(allowed_color_modes)})"
                    )

                # 파일 크기 검증
                max_size_mb = self.validation_rules.get("max_file_size_mb", 10)
                min_size_kb = self.validation_rules.get("min_file_size_kb", 1)

                if file_size_mb > max_size_mb:
                    issues.append(
                        f"파일 크기 초과: {file_size_mb:.2f}MB (최대: {max_size_mb}MB)"
                    )

                if file_size_bytes < min_size_kb * 1024:
                    issues.append(
                        f"파일 크기 너무 작음: {file_size_bytes}bytes (최소: {min_size_kb}KB)"
                    )

                # 리소스 타입별 추가 규칙
                if resource_type:
                    type_rules = self.validation_rules.get("resource_type_rules", {})
                    for key, rules in type_rules.items():
                        if key in resource_type:
                            # 포맷 검증
                            if "expected_format" in rules:
                                if actual_format != rules["expected_format"]:
                                    issues.append(
                                        f"{resource_type} 포맷 불일치: {actual_format} → {rules['expected_format']} 권장"
                                    )

                            # 색상 모드 검증
                            if "required_color_mode" in rules:
                                if color_mode != rules["required_color_mode"]:
                                    issues.append(
                                        f"{resource_type} 색상 모드 불일치: {color_mode} → {rules['required_color_mode']} 필요"
                                    )

                            # 파일 크기 검증
                            if "max_file_size_mb" in rules:
                                if file_size_mb > rules["max_file_size_mb"]:
                                    issues.append(
                                        f"{resource_type} 파일 크기 초과: {file_size_mb:.2f}MB (최대: {rules['max_file_size_mb']}MB)"
                                    )

                result = ValidationResult(
                    file_path=str(image_path),
                    expected_size=expected_size,
                    actual_size=actual_size,
                    expected_format=self._get_expected_format(resource_type),
                    actual_format=actual_format,
                    file_size_bytes=file_size_bytes,
                    color_mode=color_mode,
                    is_valid=len(issues) == 0,
                    issues=issues
                )

                return result

        except Exception as e:
            return ValidationResult(
                file_path=str(image_path),
                expected_size=expected_size,
                actual_size="N/A",
                is_valid=False,
                issues=[f"이미지 검증 중 오류: {str(e)}"]
            )

    def validate_directory(
        self,
        directory: str,
        spec_mapping: Dict[str, Tuple[str, str]] = None
    ) -> List[ValidationResult]:
        """
        디렉토리 내 모든 이미지 검증

        Args:
            directory: 검증할 디렉토리 경로
            spec_mapping: {파일명: (예상_사이즈, 리소스_타입)} 매핑

        Returns:
            List[ValidationResult]: 검증 결과 목록
        """
        directory = Path(directory)
        results = []

        if not directory.exists():
            print(f"⚠️  디렉토리가 존재하지 않습니다: {directory}")
            return results

        # 이미지 파일 찾기
        image_extensions = ['.png', '.jpg', '.jpeg']
        for ext in image_extensions:
            for img_path in directory.rglob(f'*{ext}'):
                if img_path.is_file():
                    # spec_mapping에서 예상 사이즈 찾기
                    expected_size = "(미정)"
                    resource_type = None

                    if spec_mapping and img_path.stem in spec_mapping:
                        expected_size, resource_type = spec_mapping[img_path.stem]

                    result = self.validate_image(
                        str(img_path),
                        expected_size,
                        resource_type
                    )
                    results.append(result)

        self.validation_results.extend(results)
        return results

    def generate_report(
        self,
        output_path: Optional[str] = None,
        format: str = "json"
    ) -> str:
        """
        검증 결과 리포트 생성

        Args:
            output_path: 리포트 저장 경로
            format: 리포트 포맷 ("json" 또는 "text")

        Returns:
            str: 리포트 파일 경로
        """
        if not output_path:
            report_dir = self.project_root / '3_ai_output' / 'validation_reports'
            report_dir.mkdir(parents=True, exist_ok=True)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_path = report_dir / f'image_validation_{timestamp}.{format}'
        else:
            output_path = Path(output_path)

        # 통계
        total = len(self.validation_results)
        valid = sum(1 for r in self.validation_results if r.is_valid)
        invalid = total - valid

        if format == "json":
            report = {
                "generated_at": datetime.now().isoformat(),
                "summary": {
                    "total_images": total,
                    "valid_images": valid,
                    "invalid_images": invalid,
                    "validation_rate": f"{(valid/total*100):.1f}%" if total > 0 else "N/A"
                },
                "results": [asdict(r) for r in self.validation_results]
            }

            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2)

        else:  # text format
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write("=" * 70 + "\n")
                f.write("  이미지 검증 리포트\n")
                f.write("=" * 70 + "\n\n")

                f.write(f"생성 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"총 이미지: {total}개\n")
                f.write(f"유효: {valid}개\n")
                f.write(f"문제: {invalid}개\n")
                f.write(f"검증률: {(valid/total*100):.1f}%\n\n" if total > 0 else "\n")

                f.write("-" * 70 + "\n")
                f.write("검증 결과 상세\n")
                f.write("-" * 70 + "\n\n")

                for i, result in enumerate(self.validation_results, 1):
                    status = "✅ 정상" if result.is_valid else "❌ 문제"
                    f.write(f"[{i}] {status}\n")
                    f.write(f"  파일: {result.file_path}\n")
                    f.write(f"  예상 사이즈: {result.expected_size}\n")
                    f.write(f"  실제 사이즈: {result.actual_size}\n")
                    f.write(f"  포맷: {result.actual_format}\n")
                    f.write(f"  색상 모드: {result.color_mode}\n")
                    f.write(f"  파일 크기: {result.file_size_bytes / 1024:.1f} KB\n")

                    if result.issues:
                        f.write("  문제점:\n")
                        for issue in result.issues:
                            f.write(f"    - {issue}\n")

                    f.write("\n")

        print(f"📄 검증 리포트 생성: {output_path}")
        return str(output_path)

    def _parse_size(self, size_str: str) -> Tuple[Optional[int], Optional[int]]:
        """사이즈 문자열 파싱 (예: "1280x720" → (1280, 720))"""
        try:
            if 'x' in size_str.lower():
                parts = size_str.lower().split('x')
                width = int(parts[0].strip())
                height = int(parts[1].strip())
                return width, height
        except:
            pass
        return None, None

    def _get_expected_format(self, resource_type: Optional[str]) -> Optional[str]:
        """리소스 타입에 따른 예상 포맷 조회"""
        if not resource_type:
            return None

        type_rules = self.validation_rules.get("resource_type_rules", {})
        for key, rules in type_rules.items():
            if key in resource_type:
                return rules.get("expected_format")

        return None

    def print_summary(self):
        """검증 결과 요약 출력"""
        total = len(self.validation_results)
        valid = sum(1 for r in self.validation_results if r.is_valid)
        invalid = total - valid

        print()
        print("=" * 70)
        print("  검증 결과 요약")
        print("=" * 70)
        print()
        print(f"총 이미지: {total}개")
        print(f"✅ 정상: {valid}개")
        print(f"❌ 문제: {invalid}개")

        if total > 0:
            print(f"검증률: {(valid/total*100):.1f}%")

        if invalid > 0:
            print()
            print("문제가 있는 이미지:")
            for result in self.validation_results:
                if not result.is_valid:
                    print(f"  - {Path(result.file_path).name}")
                    for issue in result.issues:
                        print(f"    • {issue}")


# CLI 테스트
if __name__ == "__main__":
    print("=" * 70)
    print("  Image Validator - 이미지 규격 자동 검증")
    print("=" * 70)
    print()

    validator = ImageValidator()

    # 예제: 특정 디렉토리 검증
    # results = validator.validate_directory(
    #     "path/to/images",
    #     spec_mapping={
    #         "Image_Card_001": ("512x512", "포토카드"),
    #         "Image_Profile_001": ("256x256", "프로필"),
    #     }
    # )

    # validator.print_summary()
    # validator.generate_report(format="json")
    # validator.generate_report(format="text")

    print("사용 예제:")
    print()
    print("from image_validator import ImageValidator")
    print()
    print("validator = ImageValidator()")
    print("result = validator.validate_image('image.png', '1280x720', '포토카드')")
    print("print(result)")
    print()
