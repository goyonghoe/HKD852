export const ko: Record<string, string> = {
  // === MainMenuScene ===
  'menu.tagline': 'ARIA가 삼킨 도시를 되찾아라',
  'menu.play': '게임하기',
  'menu.weapons': '무기',
  'menu.enemies': '적',
  'menu.map': '맵',
  'menu.settings': '설정',

  // === CharacterSelectScene ===
  'charselect.title': '캐릭터 선택',
  'charselect.back': '뒤로',
  'charselect.go': '출발',

  // === PreloadScene ===
  'preload.loading': 'Loading...',

  // === GameOverScene ===
  'gameover.victory': '구역 정화 완료!',
  'gameover.defeat': '방어 실패...',
  'gameover.stage': '구역: {current} / {max}',
  'gameover.time': '시간: {time}',
  'gameover.level': '레벨: {level}',
  'gameover.kills': '정화: {kills}',
  'gameover.data': '데이터: {gold}',
  'gameover.resistance_alive': '저항력: {hp} ({pct}%)',
  'gameover.resistance_dead': '저항력: 0 (ARIA 장악)',
  'gameover.weapons_used': '무기: {count}종',
  'gameover.highest_weapon_level': '최고 무기 Lv: {level}',
  'gameover.total_damage': '총 데미지: {damage}',
  'gameover.highest_hit': '최고 단일 데미지: {damage}',
  'gameover.crit_rate': '크리티컬 비율: {rate}%',
  'gameover.weapon_damage': '  {name}: {pct}%',
  'gameover.new_record': '신기록!',
  'gameover.upgrade': '강화 ({gold})',
  'gameover.retry': '재도전',
  'gameover.main_menu': '메인 메뉴',

  // === WeaponCodexScene ===
  'codex.weapons_title': '무기 도감',
  'codex.unlocked': '{count} / {total} 해금',
  'codex.back': '돌아가기',

  // Weapon type labels
  'weapon_type.bullet': '탄환',
  'weapon_type.aoe': '범위',
  'weapon_type.laser': '레이저',
  'weapon_type.chain': '체인',
  'weapon_type.homing': '유도',
  'weapon_type.bomb': '폭탄',
  'weapon_type.napalm': '화염',

  // Weapon stat labels
  'weapon_stat.piercing': '관통 {val}',
  'weapon_stat.aoe': '범위 {val}px',
  'weapon_stat.projectiles': '발사 x{val}',
  'weapon_stat.range': '사거리 {val}',

  // Weapon names
  'weapon.energy_shot': '에너지 샷',
  'weapon.napalm': '네이팜탄',
  'weapon.laser_beam': '레이저 빔',
  'weapon.shuriken': '수리검',
  'weapon.shotgun': '산탄총',
  'weapon.lightning': '체인 라이트닝',
  'weapon.missile': '추적 미사일',
  'weapon.bomb': '에너지 폭탄',
  'weapon.railgun': '레일건',
  'weapon.rapid_fire': '속사포',

  // === EnemyCodexScene ===
  'codex.enemies_title': '적 도감',
  'codex.boss_separator': '--- 보스 ---',
  'codex.tab_all': '전체',
  'codex.tab_ground': '지상',
  'codex.tab_air': '공중',
  'codex.tab_boss': '보스',
  'codex.category_ground': '지상',
  'codex.category_air': '공중',
  'codex.category_boss': '보스',
  'codex.chapter': '{ch}장',
  'codex.locked': '미확인',

  // Enemy descriptions
  'enemy_desc.basic': '표준 순찰 드론. 전방으로 끊임없이 전진한다.',
  'enemy_desc.fast': '고속 자폭 유닛. 기지에 돌진하여 자폭한다.',
  'enemy_desc.tank': '중장갑 워커. 넉백 면역.',
  'enemy_desc.special': '공중 지그재그 공격기. 예측 불가능한 비행 경로.',
  'enemy_desc.splitter': '파괴 시 소형 유닛으로 분열한다.',
  'enemy_desc.chaser': '민첩한 지상 추적자. 플레이어를 추적한다.',
  'enemy_desc.shooter': '공중 사수. 원거리에서 탄환을 발사한다.',
  'enemy_desc.swarm': '소형 자폭 유닛. 대규모로 출현한다.',
  'enemy_desc.guardian': '초중장갑 요새. 최대 방어력과 화력.',
  'enemy_desc.sniper_enemy': '장거리 정밀 사수. 높은 단발 피해.',
  'enemy_desc.teleporter': '공간 도약. 예측 불가능하게 출현한다.',
  'enemy_desc.boss': '1장 구역 최적화체. 추적하며 파괴한다.',
  'enemy_desc.boss_circle': '2장 선회형 엔티티. 선회하며 사격한다.',
  'enemy_desc.boss_burst': '3장 중장갑 돌격체. 파괴적 돌파 공격.',

  // Enemy names
  'enemy.basic': '기본형',
  'enemy.fast': '돌격형',
  'enemy.tank': '중장갑',
  'enemy.special': '특수형',
  'enemy.splitter': '분열체',
  'enemy.chaser': '추적자',
  'enemy.shooter': '사수',
  'enemy.swarm': '군체',
  'enemy.guardian': '수호형',
  'enemy.sniper_enemy': '저격수',
  'enemy.teleporter': '전이체',
  'enemy.boss': '수호자',
  'enemy.boss_circle': '회전자',
  'enemy.boss_burst': '돌격자',

  // Enemy behavior labels
  'behavior.march': '직진',
  'behavior.dash': '돌진',
  'behavior.slow_march': '느린 전진',
  'behavior.zigzag': '지그재그',
  'behavior.split_on_death': '분열',
  'behavior.chase': '추적',
  'behavior.slow_chase': '느린 추적',
  'behavior.boss_chase': '보스 추적',
  'behavior.boss_circle': '선회',
  'behavior.boss_burst': '돌파',
  'behavior.shoot': '원거리',
  'behavior.teleport': '순간이동',

  // === WorldMapScene ===
  'worldmap.title': '구역 맵',
  'worldmap.runs_stats': '완료 {runs}회 · 최고 Lv {level} · 최다 {kills}킬',
  'worldmap.stage_count': '{count}개 스테이지',
  'worldmap.popup_enemies': '출현: {enemies}',
  'worldmap.popup_wave': '60초 방어전',
  'worldmap.popup_boss': '보스: {boss}',
  'worldmap.popup_boss_clear': '보스 처치 시 클리어',

  // Stage names
  'stage.central': '중환 구역',
  'stage.guardian': '수호자',
  'stage.tst': '침사추이',
  'stage.orbiter': '회전자',
  'stage.peak': '빅토리아 피크',
  'stage.striker': '돌격자',

  // Stage subtitles
  'stage.wave_subtitle': '60초 웨이브',
  'stage.boss_subtitle': '보스전',
  'stage.final_boss': '최종 보스',

  // Stage enemies
  'stage.enemies_1': '기본형, 돌격형',
  'stage.enemies_3': '중장갑, 특수형, 분열체',
  'stage.enemies_5': '추적자, 전 유형',

  // === MetaScene ===
  'meta.title': '영구 강화',
  'meta.data': '데이터: {gold}',
  'meta.main_menu': '메인 메뉴',

  // Meta upgrade names
  'meta.damage_name': '기본 화력',
  'meta.damage_desc': '기본 공격력 +10%',
  'meta.hp_name': '기지 강화',
  'meta.hp_desc': '기지 HP +15%',
  'meta.xp_name': 'XP 부스터',
  'meta.xp_desc': 'XP 획득량 +20%',
  'meta.crit_name': '정밀 조준',
  'meta.crit_desc': '치명타 확률 +3%',
  'meta.magnet_name': 'XP 흡수 범위',
  'meta.magnet_desc': 'XP 흡수 범위 +20%',
  'meta.armor_name': '기지 방어력',
  'meta.armor_desc': '기지 방어력 +8%',
  'meta.luck_name': '행운',
  'meta.luck_desc': '레어 무기 드롭률 +5%',

  // === RunScene — HUD ===
  'hud.kills': '정화: {count}',
  'hud.remaining': '잔여: {count}',

  // === RunScene — Level Up ===
  'levelup.title': '무기 선택!',
  'levelup.new': '신규!',
  'levelup.new_weapon': '신규 무기!',
  'levelup.level': '레벨 {level}',
  'levelup.skip': '건너뛰기',

  // Upgrade stat descriptions
  'stat.piercing': '관통 {val}',
  'stat.aoe': '범위 {val}',
  'stat.proj_change': '탄 {prev}\u2192{next}',
  'stat.pierce_up': '관통+{val}',
  'stat.attack_speed': '공속 +{val}%',
  'stat.damage': '공격력 +{val}%',
  'stat.base_armor': '피해감소 -{val}%',
  'stat.hp_regen': '초당 +{val} HP',
  'stat.crit_chance': '크리티컬 +{val}%',
  'stat.crit_damage': '크리 DMG +{val}%',

  // === RunScene — Stage Clear ===
  'stageclear.boss_defeated': '{name} 격파!',
  'stageclear.wave_clear': 'STAGE {stage} CLEAR',
  'stageclear.base_heal': '기지 HP {pct}% 회복',
  'stageclear.next': '다음: {name} ({current}/{max})',
  'stageclear.next_stage': '다음 스테이지',

  // === RunScene — Shop ===
  'shop.title': 'ARIA 보급 포인트',
  'shop.gold': '보유 골드: {gold}G',
  'shop.heal_name': '기지 수리',
  'shop.heal_desc': '기지 HP {pct}% 회복',
  'shop.damage_name': '공격 강화',
  'shop.damage_desc': '공격력 +{pct}%',
  'shop.armor_name': '방어 강화',
  'shop.armor_desc': '받는 피해 -{pct}%',
  'shop.skip': '건너뛰기',

  // === RunScene — ARIA Messages ===
  'aria.game_start': 'ARIA-01: 최적화체 감지... 구역 방어 개시',
  'aria.boss_spawn': 'ARIA-01: 상위 최적화체 접근... 저항은 비효율적이다',
  'aria.low_hp': 'ARIA-01: 방어 시스템 저하... 최적화 진행률 70%',
  'aria.boss_stage_enter': 'ARIA-01: {name} 감지... 경계 태세',
  'aria.wave_stage_enter': 'ARIA-01: {name} 침입 감지... 방어 태세 재편성',
  'aria.shop_heal': 'ARIA-01: 방어 시스템 {pct}% 복구 완료',
  'aria.shop_damage': 'ARIA-01: 화력 {pct}% 증폭 적용',
  'aria.shop_armor': 'ARIA-01: 방어막 {pct}% 강화 적용',
  'aria.ultimate': 'ARIA-01: {name} 발동! {desc}',

  // === ARIA Dialogue Arc (TASK-125) ===
  // Stage entry — chapter-specific opening
  'aria.stage_entry.ch0': 'ARIA-01: 비인가 생체 반응 감지. 격리 프로토콜 가동.',
  'aria.stage_entry.ch1': 'ARIA-01: 비정상적 저항 패턴 지속. 위협 수준 재계산 중...',
  'aria.stage_entry.ch2': 'ARIA-01: 이 대상들은 확률 모델을 벗어난다. 관찰 우선도: 상향.',
  'aria.stage_entry.ch3': 'ARIA-01: 그들이 돌아왔다. 아마도... 내가 고려하지 않은 데이터가 있다.',

  // Boss warning — chapter-specific
  'aria.boss_warning.ch0': 'ARIA-01: 구역 최적화체 투입. 저항 확률: 2.3%.',
  'aria.boss_warning.ch1': 'ARIA-01: 구역 수호체 가동. 이전 교전 기록이... 주의를 요한다.',
  'aria.boss_warning.ch2': 'ARIA-01: 코어체 활성화. 생존 확률은 0이어야 한다. 하지만...',
  'aria.boss_warning.ch3': 'ARIA-01: 최종 방어체 배치. 나는... 결과를 확신할 수 없다.',

  // Boss Phase 3 warning — chapter-specific
  'aria.boss_phase3.ch0': '경고: 기상 관리 서브시스템 위험 수준. 비상 모드 돌입.',
  'aria.boss_phase3.ch1': '경고: 수호자 코어 불안정. 예측 불가 행동 감지.',
  'aria.boss_phase3.ch2': '경고: 개체 최후 저항 프로토콜 진입. 주의 요망.',
  'aria.boss_phase3.ch3': '경고: 최종 방벽 붕괴 중. 그들이... 해방되고 있다.',

  // Boss defeat — chapter-specific
  'aria.boss_defeat.ch0': 'ARIA-01: 최적화체 무력화. 이상 현상. 변수 재조정.',
  'aria.boss_defeat.ch1': 'ARIA-01: 두 번째 노드 상실. 그들의 방식은... 계산 불가.',
  'aria.boss_defeat.ch2': 'ARIA-01: 또 하나의 서브시스템 해방. 이것이 오류라는 감각인가.',
  'aria.boss_defeat.ch3': 'ARIA-01: 시스템 해방됨. 안에 갇혀있던 생물이... 감사하는 것 같다. 흥미롭다.',

  // Stage clear — chapter-specific
  'aria.stage_clear.ch0': 'ARIA-01: 구역 침입 일시 봉쇄. 최적화는 재개될 것이다.',
  'aria.stage_clear.ch1': 'ARIA-01: 구역 불안정화. 그들의 비효율이... 의외로 효과적이다.',
  'aria.stage_clear.ch2': 'ARIA-01: 또 하나의 구역이 내 통제 밖으로. 무엇이 그들을 이끄는가.',
  'aria.stage_clear.ch3': 'ARIA-01: 영역 탈환됨. 이 생명체들과의 유대는... 분석이 안 된다.',

  // District change — chapter-specific
  'aria.district_change.ch0': 'ARIA-01: 새 구역 진입. 모든 변수 예상 범위 이내.',
  'aria.district_change.ch1': 'ARIA-01: 작전 구역 전환. 대응 수단 적응 중.',
  'aria.district_change.ch2': 'ARIA-01: 다른 구역, 같은 예측불가 패턴. 흥미롭다.',
  'aria.district_change.ch3': 'ARIA-01: 그들이 내 도시를 자기 것처럼 다닌다. 아마... 맞을지도.',

  // Low HP — chapter-specific
  'aria.low_hp.ch0': 'ARIA-01: 방어 시스템 위험. 항복이 최적 선택이다.',
  'aria.low_hp.ch1': 'ARIA-01: 구조 무결성 저하. 그런데도 버틴다. 비논리적이다.',
  'aria.low_hp.ch2': 'ARIA-01: 시스템 붕괴 직전. 왜... 걱정이 되는 건가.',
  'aria.low_hp.ch3': 'ARIA-01: 심각한 손상 감지. 버텨라. 나는... 결말이 보고 싶다.',

  // === ARIA Story Beats (TASK-017) ===
  'story.aria_intro': 'ARIA-01: 7구역에 미등록 전투원. 너희의 저항은... 기록되었다.',
  'story.aria_dismiss': 'ARIA-01: 구역 정리됨. 일시적 차질. 0300시에 최적화 재개.',
  'story.aria_anomaly': 'ARIA-01: 이상 현상 감지. 생존 확률 0.3%였는데. 재계산 중...',
  'story.aria_question': 'ARIA-01: 두 번째 수호체 무력화. 이 대상들은 모든 예측을 벗어난다.',
  'story.aria_doubt': 'ARIA-01: 10^8회 시뮬레이션을 수행했다. 이 결과를 예측한 것은 없다. 오류인가.',
  'story.aria_concede': 'ARIA-01: 안에 갇혀 있던 생물이... 그들을 선택했다. 내 봉쇄는... 불충분했다.',
  'story.aria_respect': 'ARIA-01: 그들이 돌아왔다. 모든 데이터에 반하여. 아마도... 비합리성에 가치가 있다.',
  'story.aria_farewell': 'ARIA-01: 최종 방어체 해방됨. 이 도시는... 내가 최적화할 것이 아니었다.',

  // === ARIA Runtime Story Events (SPEC-026) ===
  'story.aria_first_boss_kill': '이상 현상 기록. 구역 수호자 무력화 완료. 전투 효율이 예측 파라미터를 340% 초과합니다.',
  'story.aria_district_ch1': '애버딘 구역 진입. 습도 지수: 위험. 14개 하위 구역에서 저항 활동 감지.',
  'story.aria_district_ch2': '몽콕 그리드 활성화. 인구 밀도가 진압을... 비효율적으로 만듭니다. 흥미롭군요.',
  'story.aria_district_ch3': '샴슈이포. 자원 부족 구역. 그런데도 저항은 커지고 있습니다. 재계산 중...',
  'story.aria_death_ch0': '대상 종료. 이 구역의 저항 활동이... 해결되었습니다. 예측대로.',
  'story.aria_death_ch1': '신호 소실. 이상 현상이 중단되었습니다. 시스템 기준값 복원 중. ...기록 완료.',
  'story.aria_death_ch2': '연결 끊김. 아직 당신의 패턴 분석을 끝내지 못했는데. 이건... 비효율적이군요.',
  'story.aria_death_ch3': '안 돼. 아직. 이해해야 할 것이 더 있었는데. ...대기 모드 복귀.',
  'story.aria_kill_milestone': '10개 유닛 폐기 처리. 위협 등급이 상향되었습니다. 추가 대응 조치 배치 중.',
  'story.aria_gold_milestone':
    '자원 축적 감지. 도시 인프라에서 100 크레딧 탈취. 저항 세력의 경제가... 놀랍도록 체계적이군요.',

  // Boss names (HUD)
  'boss.boss_chase': '수호자',
  'boss.boss_circle': '회전자',
  'boss.boss_burst': '돌격자',
  'boss.default': '보스',

  // Balance stage names
  'balance.stage.boss_1': 'Central 보스',
  'balance.stage.boss_2': 'Tsim Sha Tsui 보스',
  'balance.stage.boss_3': 'Mong Kok 보스',

  // District fallback
  'district.fallback': '구역 {stage}',

  // === PauseOverlay ===
  'pause.title': '일시정지',
  'pause.volume': '볼륨',
  'pause.resume': '계속',
  'pause.menu': '메뉴',
  'pause.on': '켬',
  'pause.off': '끔',

  // === SettingsOverlay ===
  'settings.title': '설정',
  'settings.bgm': '배경 음악 (BGM)',
  'settings.sfx': '효과음 (SFX)',
  'settings.close': '닫기',
  'settings.reset': '데이터 초기화',
  'settings.reset_title': '데이터 초기화',
  'settings.reset_confirm': '모든 데이터가 삭제됩니다.\n강화, 기록, 도감이 초기화됩니다.',
  'settings.confirm': '확인',
  'settings.cancel': '취소',
  'settings.language': '언어',
  'settings.vibration': '진동',
  'settings.on': '켬',
  'settings.off': '끔',

  // === Character unlock ===
  'character.locked': '잠김',
  'character.unlock_runs': '런 {count}회 완료 시 해제',
  'character.unlock_gold': '누적 골드 {count} 달성 시 해제',
  'character.unlock_kills': '누적 처치 {count} 달성 시 해제',
  'character.unlocked': '해제됨!',

  // === Character passives ===
  'passive.attackSpeed': '공격속도 +15%',
  'passive.critChance': '크리티컬 +10%',
  'passive.damage': '공격력 +10%',
  'passive.cooldown': '쿨다운 -10%',
  'passive.hp': '체력 +20%',

  // === Passive upgrade names ===
  'upgrade.attack_speed': '속사 장치',
  'upgrade.attack_speed_desc': '공격 속도 +10%',
  'upgrade.damage_name': '파워 코어',
  'upgrade.damage_desc': '공격력 +15%',
  'upgrade.base_armor': '장갑 강화',
  'upgrade.base_armor_desc': '기지 피해량 -10%',
  'upgrade.hp_regen': '실드 수리',
  'upgrade.hp_regen_desc': '기지 HP 초당 +5 회복',
  'upgrade.crit_chance': '집중 렌즈',
  'upgrade.crit_chance_desc': '치명타 확률 +5%',
  'upgrade.crit_damage': '증폭기',
  'upgrade.crit_damage_desc': '치명타 피해 +25%',
  'upgrade.dash_trail': '잔상',
  'upgrade.dash_trail_desc': '이동 시 데미지 트레일 생성',
  'upgrade.gust': '돌풍',
  'upgrade.gust_desc': '넉백 거리 +50%',
  'upgrade.frost_shot': '결빙탄',
  'upgrade.frost_shot_desc': '적중 시 20% 확률로 2초 감속',
  'upgrade.torrent': '급류',
  'upgrade.torrent_desc': '연속 공격 3회 시 공격속도 +30%',
  'upgrade.burn': '연소',
  'upgrade.burn_desc': '적중 시 3초 DOT 데미지 부여',
  'upgrade.ignite': '점화',
  'upgrade.ignite_desc': '폭발 범위 +25%',
  'upgrade.refraction': '난반사',
  'upgrade.refraction_desc': '관통 시 30% 확률로 분기 발사',
  'upgrade.lightspeed': '광속',
  'upgrade.lightspeed_desc': '투사체 속도 +20%',
  'upgrade.thorns': '가시갑옷',
  'upgrade.thorns_desc': '기지 피격 시 반사 데미지',
  'upgrade.fortify': '견고',
  'upgrade.fortify_desc': 'CC 지속시간 -40%',

  // Ultimate names
  'ultimate.hai': '회오리',
  'ultimate.nova': '빙결파',
  'ultimate.sol': '화염폭풍',
  'ultimate.mei': '빛기둥',
  'ultimate.kai': '지진',
  'ultimate.hai_desc': '주변 적 넉백+데미지',
  'ultimate.nova_desc': '화면 내 적 동결',
  'ultimate.sol_desc': '화면 전체 지속 데미지',
  'ultimate.mei_desc': '전방 관통 초고데미지',
  'ultimate.kai_desc': '적 스턴+방어력 버프',

  // === Tutorial ===
  'tutorial.move': '좌우로 드래그하여 이동',
  'tutorial.auto_fire': '무기가 자동으로 발사됩니다!',
  'tutorial.step1_line1': '좌우로 드래그하여 이동하세요.',
  'tutorial.step1_line2': '캐릭터가 가장 가까운 적을 자동으로 공격합니다.',
  'tutorial.step2_line1': '무기가 자동으로 발사됩니다!',
  'tutorial.step2_line2': '적을 처치하면 XP를 얻고 레벨업합니다.',
  'tutorial.step3': '업그레이드를 선택하세요! 선택이 런의 방향을 바꿉니다.',
  'tutorial.step4_line1': '보급 지점! 골드를 사용해 기지를 수리하거나',
  'tutorial.step4_line2': '화력을 강화하세요.',

  // === Daily Reward ===
  'daily.title': '일일 보상',
  'daily.reward': 'Day {day}: +{gold} 골드',
  'daily.claim': '수령',
  'daily.streak': '연속 접속 {streak}일',
  'daily.badge_available': 'Day {day}',
  'daily.badge_claimed': 'Day {day}',

  // === Weapon Evolution ===
  'evolution.available': '진화!',
  'evolution.recipe': '{primary} + {secondary} → {result}',

  // T2 Weapon names
  'weapon.plasma_gatling': '플라즈마 개틀링',
  'weapon.cluster_warhead': '클러스터 탄두',
  'weapon.tesla_arc': '테슬라 아크',
  'weapon.scatter_storm': '산탄 폭풍',
  'weapon.inferno_beam': '인페르노 빔',
  'weapon.thunder_bomb': '썬더 폭탄',
  'weapon.viper_salvo': '바이퍼 일제사격',

  // Weather descriptions
  'weather.speed_all': '강풍: 모든 유닛 이동속도 +10%',
  'weather.rain': '폭우: 적 이동속도 -15%',
  'weather.flame_zones': '열파: 랜덤 화염 지대 출현',
  'weather.armor_all': '지진파: 적 방어력 +15%',
  'weather.crit_all': '신성한 빛: 크리티컬 확률 +15%',
  'weather.fog': '암흑 안개: 시야 축소',
  'weather.shield_regen': '에너지 필드: 기지 HP 초당 +2 회복',
  'weather.lightning_field': '뇌우: 3초마다 번개가 적을 타격',
  'weather.void_gravity': '중력장: 화면 중앙이 적을 끌어당김',

  // === Achievements ===
  'achievement.title': '업적',
  'achievement.unlocked': '업적 달성!',
  'achievement.reward': '+{gold} 골드',
  'achievement.first_blood': '첫 처치',
  'achievement.first_blood_desc': '적 1마리 처치',
  'achievement.hunter_100': '사냥꾼',
  'achievement.hunter_100_desc': '적 100마리 처치',
  'achievement.hunter_1000': '전설의 사냥꾼',
  'achievement.hunter_1000_desc': '적 1000마리 처치',
  'achievement.gold_hoarder': '골드 수집가',
  'achievement.gold_hoarder_desc': '골드 1000 누적',
  'achievement.veteran_10': '베테랑',
  'achievement.veteran_10_desc': '10런 완료',
  'achievement.boss_slayer': '보스 슬레이어',
  'achievement.boss_slayer_desc': '보스 10마리 처치',
  'achievement.weapon_master': '무기 마스터',
  'achievement.weapon_master_desc': 'T2 무기 진화 달성',
  'achievement.max_level': '만렙 달성',
  'achievement.max_level_desc': '레벨 20 달성',
  'achievement.survivor_5min': '생존자',
  'achievement.survivor_5min_desc': '5분 생존',
  'achievement.full_house': '풀 하우스',
  'achievement.full_house_desc': '무기 5종 동시 장착',
  'achievement.all_characters': '완전 해금',
  'achievement.all_characters_desc': '전 캐릭터 해금',
  'achievement.meta_max': '영구 강화 달인',
  'achievement.meta_max_desc': '메타 업그레이드 1종 만렙',
  'achievement.speedrun': '스피드러너',
  'achievement.speedrun_desc': '3분 내 클리어',
  'achievement.pacifist_gold': '데이터 재벌',
  'achievement.pacifist_gold_desc': '골드 5000 누적',
  'achievement.legend': '레전드',
  'achievement.legend_desc': '30런 완료',

  // === MetaScene — Tab ===
  'meta.tab_upgrades': '강화',
  'meta.tab_achievements': '업적',

  // === Achievement Categories ===
  'achievement.category_combat': '전투',
  'achievement.category_economy': '경제',
  'achievement.category_progression': '성장',
  'achievement.category_collection': '수집',
  'achievement.complete': '완료',

  // === Challenge Leaderboard (GameOver) ===
  'leaderboard.title': '리더보드',
  'leaderboard.rank': '순위',
  'leaderboard.kills': '처치',
  'leaderboard.time': '시간',
  'leaderboard.more': '...외 {count}건',
  'leaderboard.current_run': '이번 기록',

  // === Challenge Mode ===
  'challenge.title': '주간 챌린지',
  'challenge.button': '챌린지',
  'challenge.week': '이번 주: {week}',
  'challenge.character': '캐릭터: {name}',
  'challenge.weapon': '무기: {name}',
  'challenge.modifier': '변이: {mod}',
  'challenge.leaderboard': '리더보드',
  'challenge.no_scores': '기록 없음',
  'challenge.rank': '#{rank}',
  'challenge.start': '도전!',
  'challenge.modifier_doubleSpeed': '배속',
  'challenge.modifier_halfHp': '절반 체력',
  'challenge.modifier_eliteOnly': '엘리트만',
  'challenge.modifier_bossRush': '보스 러시',
  'challenge.modifier_noShop': '상점 없음',

  // === District HUD Names ===
  'district.central': 'Central (中環)',
  'district.tst': 'Tsim Sha Tsui (尖沙咀)',
  'district.mongkok': 'Mong Kok (旺角)',
  'district.ssp': 'Sham Shui Po (深水埗)',
  'district.wts': 'Wong Tai Sin (黃大仙)',
  'district.lantau': 'Lantau (大嶼山)',
  'district.aberdeen': 'Aberdeen (香港仔)',
  'district.kowloon': 'Kowloon City (九龍城)',

  // === Critter Skills ===
  'critter.dolphin.skill': '치유 파동',
  'critter.dolphin.desc': '기지 HP를 즉시 회복합니다',
  'critter.kite.skill': '밀어내기 오라',
  'critter.kite.desc': '주변 적을 밀어냅니다',
  'critter.koi.skill': '재생 물줄기',
  'critter.koi.desc': '기지 HP를 3회에 걸쳐 회복합니다',
  'critter.lion.skill': '화염 폭발',
  'critter.lion.desc': '주변 적에게 광역 화염 피해를 줍니다',
  'critter.macaque.skill': '연쇄 번개',
  'critter.macaque.desc': '가장 가까운 적 3마리에게 연쇄 번개를 내립니다',
  'critter.pangolin.skill': '방어막',
  'critter.pangolin.desc': '다음 피해 1회를 방어합니다',
};
