# -*- coding: utf-8 -*-
"""
아트팀 작업 지시서 CSV 생성 스크립트
작성: 아트팀 PM
"""

import csv
import sys
sys.path.insert(0, '/home/user/HKD852/Art_Studio')

from assets_structure import (
    PROJECT_META,
    LOCATION_ALLEY,
    LOCATION_HIDEOUT,
    LOCATION_PLAZA,
    COMMON_FX
)

def extract_assets():
    """에셋 구조에서 작업 지시서용 데이터 추출"""
    tasks = []

    # 장소별 에셋 추출
    locations = [
        ("골목", LOCATION_ALLEY),
        ("아지트", LOCATION_HIDEOUT),
        ("광장", LOCATION_PLAZA)
    ]

    for loc_name, loc_data in locations:
        # 장소 메인
        tasks.append({
            "asset_id": loc_data["id"],
            "category": "배경",
            "asset_name": loc_data["name_ko"],
            "location": loc_name,
            "description": loc_data["description"],
            "priority": "높음",
            "deadline": "1주차",
            "reference_needed": "O",
            "status": "대기"
        })

        # Props
        if "props" in loc_data:
            for prop in loc_data["props"]:
                tasks.append({
                    "asset_id": prop.get("id", "N/A"),
                    "category": "소품",
                    "asset_name": prop.get("name", ""),
                    "location": loc_name,
                    "description": str(prop.get("feature", prop.get("state", ""))),
                    "priority": "중간",
                    "deadline": "2주차",
                    "reference_needed": "O" if "cyber" in prop.get("name", "").lower() or "드론" in prop.get("name", "") else "X",
                    "status": "대기"
                })

        # Lighting
        if "lighting" in loc_data:
            for light in loc_data["lighting"]:
                tasks.append({
                    "asset_id": light.get("id", "N/A"),
                    "category": "조명",
                    "asset_name": f"{light.get('type', '')} ({light.get('color', '')})",
                    "location": loc_name,
                    "description": light.get("note", light.get("position", "")),
                    "priority": "중간",
                    "deadline": "2주차",
                    "reference_needed": "O" if light.get("type") == "neon_sign" else "X",
                    "status": "대기"
                })

        # Structures (for plaza)
        if "structures" in loc_data:
            for struct in loc_data["structures"]:
                tasks.append({
                    "asset_id": struct.get("id", "N/A"),
                    "category": "구조물",
                    "asset_name": struct.get("name", ""),
                    "location": loc_name,
                    "description": str(struct.get("exterior", struct.get("interior", ""))),
                    "priority": "높음",
                    "deadline": "1주차",
                    "reference_needed": "O",
                    "status": "대기"
                })

    # 공통 FX
    for fx in COMMON_FX:
        tasks.append({
            "asset_id": fx["id"],
            "category": "이펙트",
            "asset_name": fx["name"],
            "location": "공통",
            "description": f"타입: {fx['type']}",
            "priority": "낮음",
            "deadline": "3주차",
            "reference_needed": "O" if fx["type"] in ["particle", "volumetric"] else "X",
            "status": "대기"
        })

    return tasks

def main():
    tasks = extract_assets()

    output_path = "/home/user/HKD852/Art_Studio/art_spec_final.csv"

    fieldnames = [
        "asset_id", "category", "asset_name", "location",
        "description", "priority", "deadline", "reference_needed", "status"
    ]

    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(tasks)

    print(f"CSV 생성 완료: {output_path}")
    print(f"총 {len(tasks)}개 에셋 항목")

if __name__ == "__main__":
    main()
