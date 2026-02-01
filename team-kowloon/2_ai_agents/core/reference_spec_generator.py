#!/usr/bin/env python3
"""
Reference Spec Generator - 레퍼런스 시트 스타일 명세서 생성기

레퍼런스 시트(ref_신규앨범_ADP.csv, ref_한정테마_ADP.csv) 형식으로
명세서를 생성합니다.

구조:
1. 일감 기본 정보 섹션
2. 리소스 제작 체크리스트 섹션 (멤버별 확장)
"""

import csv
import sys
import json
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path

# Add utils to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'utils'))

from data_manager import ArtResourceDataManager, ArtResource
from review_agent import ReviewAgent
from artists_manager import ArtistsManager
from albums_manager import AlbumsManager


class ReferenceSpecGenerator:
    """레퍼런스 스타일 명세서 생성기"""

    def __init__(self):
        self.dm = ArtResourceDataManager()
        self.reviewer = ReviewAgent()
        self.artists_mgr = ArtistsManager()
        self.albums_mgr = AlbumsManager()

        # Reference images mapping 로드
        self.project_root = Path(__file__).parent.parent.parent
        self.reference_images_config = self._load_reference_images_config()

        # 리소스 타입별 파일명 패턴
        self.filename_patterns = {
            "일반 테마 포토카드 초상": "Image_Card_{code}",
            "포토카드": "Image_Card_{code}",
            "프로필 이미지": "Image_Profile_{code}",
            "앨범 커버 이미지": "Image_Album_{code}",
            "앨범 커버": "Image_Album_{code}",
            "엠블럼 이미지": "Image_Group_{code}",
            "엠블럼": "Image_Group_{code}",
            "배경 이미지": "Image_LobbyBg_{code}",
            "배경": "Image_LobbyBg_{code}",
            "한정 테마 포토카드 초상": "Image_Card_{code}",
            "한정 테마 포토카드 프레임 (라지)": "Image_ThemeType_{code}_Large",
            "한정 테마 포토카드 프레임 (스몰)": "Image_ThemeType_{code}_Small",
        }

    def generate_reference_style_sheets(self, output_dir: str = "3_ai_output/generated_specs"):
        """
        레퍼런스 스타일 명세서 생성

        각 카테고리+앨범별로 레퍼런스 시트 형식의 CSV 생성
        """
        resources = self.dm.fetch()
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # 카테고리 + 앨범별로 그룹화
        by_category_album = self._group_by_category_album(resources)

        generated_files = []

        for key, data in sorted(by_category_album.items()):
            if not data['resources']:
                continue

            # 아티스트명 정규화 (ADP → ALLDAY PROJECT)
            artist_normalized = self.artists_mgr.normalize_name(data['artist'])

            # 파일명
            category_clean = data['category'].replace(" ", "").replace("-", "")
            album_clean = f"{artist_normalized}_{data['album']}".replace(" ", "").replace("-", "")
            filename = output_path / f"{category_clean}_{album_clean}.csv"

            # CSV 생성
            self._generate_reference_csv(
                filename,
                category=data['category'],
                artist=artist_normalized,
                album=data['album'],
                resources=data['resources']
            )

            generated_files.append(str(filename))
            print(f"✅ {filename}")

        return generated_files

    def _group_by_category_album(self, resources: List[ArtResource]) -> Dict:
        """카테고리 + 앨범별로 리소스 그룹화"""
        groups = {}

        for resource in resources:
            category = resource.category_main if resource.category_main else "기타"
            artist = resource.artist if resource.artist else "기타"
            album = resource.album if resource.album else "기타"

            key = f"{category}_{artist}_{album}"

            if key not in groups:
                groups[key] = {
                    'category': category,
                    'artist': artist,
                    'album': album,
                    'resources': []
                }

            groups[key]['resources'].append(resource)

        return groups

    def _generate_reference_csv(self, filename: Path, category: str, artist: str, album: str, resources: List[ArtResource]):
        """레퍼런스 스타일 CSV 생성"""

        with open(filename, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.writer(f)

            # === 섹션 0: 시각 참고 자료 ===
            self._write_visual_reference_section(writer, category)

            # 빈 행
            writer.writerow([])

            # === 섹션 1: 일감 기본 정보 ===
            self._write_basic_info_section(writer, category, artist, album)

            # 빈 행
            writer.writerow([])

            # === 섹션 2: 리소스 제작 체크리스트 ===
            self._write_checklist_section(writer, artist, resources)

    def _write_basic_info_section(self, writer, category: str, artist: str, album: str):
        """일감 기본 정보 섹션 작성"""

        # 섹션 제목
        writer.writerow([f"[{category}] 일감 기본 정보"])
        writer.writerow(['구분', '내용'])

        # 앨범 코드
        writer.writerow(['앨범 코드', '(입력 필요)'])

        # 일감 구분
        writer.writerow(['일감 구분', f"{artist} - {album} {category}"])

        # 아티스트 이름
        writer.writerow(['아티스트 이름', artist])

        # 멤버 정보
        members = self.artists_mgr.get_members(artist)
        if members:
            members_str = self.artists_mgr.format_members(artist)
            writer.writerow(['멤버 (순서 고정)', members_str])
        else:
            writer.writerow(['멤버', '(솔로 아티스트)'])

        # 앨범 구분
        album_title = self.albums_mgr.get_album_title(artist)
        writer.writerow(['앨범 구분', album_title if album_title else album])

        # 발매일
        release_date = self.albums_mgr.get_release_date(artist)
        writer.writerow(['앨범 발매일', release_date])

        # 엠블럼 이미지 경로
        writer.writerow(['엠블럼 이미지 경로', '(입력 필요)'])

        # 원본 리소스 경로
        writer.writerow(['원본 리소스 경로', '(입력 필요)'])

        # 제작 리소스 저장 경로
        writer.writerow(['제작 리소스 저장 경로', '(입력 필요)'])

        # 이미지 제작 시 참고 사항
        writer.writerow(['이미지 제작 시 참고 사항', '-'])

    def _write_checklist_section(self, writer, artist: str, resources: List[ArtResource]):
        """리소스 제작 체크리스트 섹션 작성"""

        # 섹션 제목
        writer.writerow([f"[리소스 제작 체크리스트]"])

        # 컬럼 헤더
        writer.writerow([
            '리소스 구분',
            '구분',
            '사이즈',
            '파일명',
            '용도 설명',
            '작업 완료',
            '비고'
        ])

        # 멤버 정보
        members = self.artists_mgr.get_members(artist)
        is_group = self.artists_mgr.is_group(artist)

        # 리소스 타입별로 그룹화
        by_type = {}
        for resource in resources:
            rtype = resource.resource_type
            if rtype not in by_type:
                by_type[rtype] = []
            by_type[rtype].append(resource)

        # 각 리소스 타입별로 행 생성
        for rtype, res_list in sorted(by_type.items()):
            # 대표 리소스 (규격 정보 가져오기용)
            representative = res_list[0]

            # 규격
            if representative.size_width and representative.size_height:
                size = f"{representative.size_width}x{representative.size_height}"
            else:
                size = representative.size_note if representative.size_note else "(미정)"

            # 파일명 패턴
            filename = self._get_filename_pattern(rtype)

            # 용도 설명 자동 생성
            purpose = self._get_purpose_description(rtype)

            # 멤버별 확장 필요 여부 판단
            needs_member_expansion = self._needs_member_expansion(rtype)

            if is_group and members and needs_member_expansion:
                # 멤버별로 행 생성
                for member in members:
                    writer.writerow([
                        rtype,           # 리소스 구분
                        member,          # 구분 (멤버명)
                        size,            # 사이즈
                        filename,        # 파일명
                        purpose,         # 용도 설명
                        'FALSE',         # 작업 완료
                        ''               # 비고
                    ])
            else:
                # 단일 행
                writer.writerow([
                    rtype,           # 리소스 구분
                    '-',             # 구분
                    size,            # 사이즈
                    filename,        # 파일명
                    purpose,         # 용도 설명
                    'FALSE',         # 작업 완료
                    ''               # 비고
                ])

    def _get_filename_pattern(self, resource_type: str) -> str:
        """리소스 타입에 따른 파일명 패턴 조회"""
        # 정확히 일치하는 패턴 찾기
        if resource_type in self.filename_patterns:
            return self.filename_patterns[resource_type]

        # 부분 일치 패턴 찾기
        for key, pattern in self.filename_patterns.items():
            if key in resource_type or resource_type in key:
                return pattern

        # 기본 패턴
        return "Image_{code}"

    def _needs_member_expansion(self, resource_type: str) -> bool:
        """멤버별 확장이 필요한 리소스 타입인지 판단"""
        # 멤버별로 개별 제작이 필요한 리소스들
        member_specific_types = [
            "포토카드",
            "초상",
            "프로필",
            "card",
            "profile",
            "portrait"
        ]

        resource_type_lower = resource_type.lower()
        return any(keyword in resource_type_lower for keyword in member_specific_types)

    def _get_purpose_description(self, resource_type: str) -> str:
        """리소스 타입에 따른 용도 설명 자동 생성"""
        resource_type_lower = resource_type.lower()

        # 포토카드/초상
        if "포토카드" in resource_type_lower or "초상" in resource_type_lower:
            if "한정" in resource_type_lower:
                return "한정 테마 포토카드 수집 화면에 표시되는 캐릭터 이미지"
            else:
                return "일반 테마 포토카드 수집 화면에 표시되는 캐릭터 이미지"

        # 프로필
        elif "프로필" in resource_type_lower:
            return "메인 화면 상단 및 마이페이지에 표시되는 프로필 이미지"

        # 앨범 커버
        elif "앨범" in resource_type_lower and "커버" in resource_type_lower:
            return "음악 재생 화면 및 앨범 목록에 표시되는 커버 이미지"

        # 엠블럼
        elif "엠블럼" in resource_type_lower:
            return "그룹 소개 및 프로필 화면에 표시되는 로고 이미지"

        # 배경
        elif "배경" in resource_type_lower:
            return "메인 로비 화면의 배경 이미지"

        # 프레임
        elif "프레임" in resource_type_lower:
            if "라지" in resource_type_lower or "large" in resource_type_lower:
                return "포토카드 상세 화면에 사용되는 큰 프레임"
            elif "스몰" in resource_type_lower or "small" in resource_type_lower:
                return "포토카드 목록 화면에 사용되는 작은 프레임"
            else:
                return "포토카드를 감싸는 장식 프레임"

        # 배너
        elif "배너" in resource_type_lower:
            if "뽑기" in resource_type_lower:
                return "뽑기 이벤트 로비에 표시되는 배너 이미지"
            elif "이벤트" in resource_type_lower:
                return "이벤트 화면에 표시되는 배너 이미지"
            else:
                return "메인 화면에 표시되는 홍보 배너 이미지"

        # 상품 이미지
        elif "상품" in resource_type_lower:
            return "상점에서 판매되는 아이템의 썸네일 이미지"

        # 기타
        else:
            return f"{resource_type} - 게임 내 사용 위치 설명 필요"

    def _load_reference_images_config(self) -> Optional[Dict]:
        """참고 이미지 설정 파일 로드"""
        config_path = self.project_root / '1_human_control' / 'reference_images' / 'reference_images_mapping.json'

        if not config_path.exists():
            return None

        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️  참고 이미지 설정 로드 실패: {e}")
            return None

    def _write_visual_reference_section(self, writer, category: str):
        """시각 참고 자료 섹션 작성"""

        # 섹션 제목
        writer.writerow(['[시각 참고 자료]'])

        # 설정 파일이 없으면 기본 안내 메시지
        if not self.reference_images_config:
            writer.writerow(['참고 이미지', '1_human_control/reference_images/ 폴더에 이미지 추가 후 reference_images_mapping.json 설정'])
            return

        # 카테고리별 참고 이미지 정보 가져오기
        categories = self.reference_images_config.get('categories', {})

        # 카테고리 정규화 (띄어쓰기 제거)
        category_normalized = category.replace(" ", "")
        category_data = categories.get(category_normalized)

        if not category_data:
            writer.writerow(['참고 이미지', f'{category} 카테고리에 대한 참고 이미지가 설정되지 않았습니다'])
            return

        # 컬럼 헤더
        writer.writerow(['화면명', '설명', '이미지 링크'])

        # 참고 이미지 목록
        reference_images = category_data.get('reference_images', [])

        for img in reference_images:
            writer.writerow([
                img.get('name', ''),
                img.get('description', ''),
                img.get('image_url', '(이미지 URL 입력)')
            ])

        # 추가 안내
        if not reference_images:
            writer.writerow(['(없음)', '이 카테고리에 대한 참고 이미지를 추가하세요', ''])

    def __repr__(self):
        return "ReferenceSpecGenerator"


# CLI 테스트
if __name__ == "__main__":
    print("=" * 70)
    print("  Reference Spec Generator - 레퍼런스 스타일 명세서 생성")
    print("=" * 70)
    print()

    generator = ReferenceSpecGenerator()

    print("📋 레퍼런스 스타일 명세서 생성 중...")
    print("-" * 70)

    files = generator.generate_reference_style_sheets()

    print()
    print("=" * 70)
    print(f"✅ 생성 완료! (총 {len(files)}개 파일)")
    print("=" * 70)
