#!/usr/bin/env python3
"""
이미지 검증 스크립트

사용법:
  python3 scripts/validate_images.py <이미지_디렉토리>
  python3 scripts/validate_images.py <이미지_파일> --size 1280x720 --type 포토카드
"""

import sys
import argparse
from pathlib import Path

# Add project paths
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT / '2_ai_agents' / 'utils'))

from image_validator import ImageValidator


def main():
    parser = argparse.ArgumentParser(description='이미지 규격 검증')
    parser.add_argument(
        'path',
        help='검증할 이미지 파일 또는 디렉토리 경로'
    )
    parser.add_argument(
        '--size',
        help='예상 사이즈 (예: 1280x720)',
        default='(미정)'
    )
    parser.add_argument(
        '--type',
        help='리소스 타입 (예: 포토카드, 프로필, 앨범 커버)',
        default=None
    )
    parser.add_argument(
        '--format',
        choices=['json', 'text'],
        default='text',
        help='리포트 포맷 (기본값: text)'
    )
    parser.add_argument(
        '--output',
        help='리포트 출력 경로 (지정하지 않으면 자동 생성)',
        default=None
    )

    args = parser.parse_args()

    print("=" * 70)
    print("  이미지 규격 검증")
    print("=" * 70)
    print()

    validator = ImageValidator()

    path = Path(args.path)

    if not path.exists():
        print(f"❌ 경로가 존재하지 않습니다: {path}")
        sys.exit(1)

    # 디렉토리 검증
    if path.is_dir():
        print(f"📁 디렉토리 검증: {path}")
        print()
        results = validator.validate_directory(str(path))

        if not results:
            print("⚠️  검증할 이미지 파일이 없습니다.")
            sys.exit(0)

        print(f"총 {len(results)}개 이미지 발견")
        print()

    # 단일 파일 검증
    else:
        print(f"📄 파일 검증: {path.name}")
        print(f"  예상 사이즈: {args.size}")
        if args.type:
            print(f"  리소스 타입: {args.type}")
        print()

        result = validator.validate_image(
            str(path),
            args.size,
            args.type
        )

        validator.validation_results.append(result)

        # 결과 출력
        status = "✅ 정상" if result.is_valid else "❌ 문제 발견"
        print(f"{status}")
        print()
        print(f"실제 사이즈: {result.actual_size}")
        print(f"포맷: {result.actual_format}")
        print(f"색상 모드: {result.color_mode}")
        print(f"파일 크기: {result.file_size_bytes / 1024:.1f} KB")
        print()

        if result.issues:
            print("문제점:")
            for issue in result.issues:
                print(f"  - {issue}")
            print()

    # 요약 출력
    validator.print_summary()

    # 리포트 생성
    print()
    report_path = validator.generate_report(
        output_path=args.output,
        format=args.format
    )

    print()
    print("=" * 70)
    print("✅ 검증 완료")
    print("=" * 70)
    print()


if __name__ == "__main__":
    main()
