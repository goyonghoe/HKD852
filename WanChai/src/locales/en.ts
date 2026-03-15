export const en: Record<string, string> = {
  // === MainMenuScene ===
  'menu.tagline': 'Reclaim the city ARIA devoured',
  'menu.play': 'PLAY',
  'menu.weapons': 'Weapons',
  'menu.enemies': 'Enemies',
  'menu.map': 'Map',
  'menu.settings': 'Settings',

  // === CharacterSelectScene ===
  'charselect.title': 'Select Character',
  'charselect.back': 'Back',
  'charselect.go': 'Deploy',

  // === PreloadScene ===
  'preload.loading': 'Loading...',

  // === GameOverScene ===
  'gameover.victory': 'District Purified!',
  'gameover.defeat': 'Defense Breached...',
  'gameover.stage': 'Stage: {current} / {max}',
  'gameover.time': 'Time: {time}',
  'gameover.level': 'Level: {level}',
  'gameover.kills': 'Purified: {kills}',
  'gameover.data': 'Data: {gold}',
  'gameover.resistance_alive': 'Resistance: {hp} ({pct}%)',
  'gameover.resistance_dead': 'Resistance: 0 (ARIA Takeover)',
  'gameover.weapons_used': 'Weapons: {count}',
  'gameover.highest_weapon_level': 'Top Weapon Lv: {level}',
  'gameover.total_damage': 'Total Damage: {damage}',
  'gameover.highest_hit': 'Highest Hit: {damage}',
  'gameover.crit_rate': 'Crit Rate: {rate}%',
  'gameover.weapon_damage': '  {name}: {pct}%',
  'gameover.new_record': 'New Record!',
  'gameover.upgrade': 'Upgrade ({gold})',
  'gameover.retry': 'Retry',
  'gameover.main_menu': 'Main Menu',

  // === WeaponCodexScene ===
  'codex.weapons_title': 'Weapon Codex',
  'codex.unlocked': '{count} / {total} Unlocked',
  'codex.back': 'Back',

  // Weapon type labels
  'weapon_type.bullet': 'Bullet',
  'weapon_type.aoe': 'AoE',
  'weapon_type.laser': 'Laser',
  'weapon_type.chain': 'Chain',
  'weapon_type.homing': 'Homing',
  'weapon_type.bomb': 'Bomb',
  'weapon_type.napalm': 'Napalm',

  // Weapon stat labels
  'weapon_stat.piercing': 'Pierce {val}',
  'weapon_stat.aoe': 'AoE {val}px',
  'weapon_stat.projectiles': 'x{val} Shots',
  'weapon_stat.range': 'Range {val}',

  // Weapon names
  'weapon.energy_shot': 'Energy Shot',
  'weapon.napalm': 'Napalm',
  'weapon.laser_beam': 'Laser Beam',
  'weapon.shuriken': 'Shuriken',
  'weapon.shotgun': 'Shotgun',
  'weapon.lightning': 'Chain Lightning',
  'weapon.missile': 'Homing Missile',
  'weapon.bomb': 'Energy Bomb',
  'weapon.railgun': 'Railgun',
  'weapon.rapid_fire': 'Rapid Fire',

  // === EnemyCodexScene ===
  'codex.enemies_title': 'Enemy Codex',
  'codex.boss_separator': '--- BOSS ---',
  'codex.tab_all': 'All',
  'codex.tab_ground': 'Ground',
  'codex.tab_air': 'Air',
  'codex.tab_boss': 'Boss',
  'codex.category_ground': 'GND',
  'codex.category_air': 'AIR',
  'codex.category_boss': 'BOSS',
  'codex.chapter': 'Ch.{ch}',
  'codex.locked': '???',

  // Enemy descriptions
  'enemy_desc.basic': 'Standard patrol drone. Marches forward relentlessly.',
  'enemy_desc.fast': 'High-speed suicide unit. Dashes into the base on contact.',
  'enemy_desc.tank': 'Armored heavy walker. Immune to knockback.',
  'enemy_desc.special': 'Airborne zigzag attacker. Unpredictable flight path.',
  'enemy_desc.splitter': 'Splits into smaller units on destruction.',
  'enemy_desc.chaser': 'Agile ground tracker. Locks onto the player.',
  'enemy_desc.shooter': 'Airborne gunner. Fires projectiles from a distance.',
  'enemy_desc.swarm': 'Tiny suicide units. Appears in massive numbers.',
  'enemy_desc.guardian': 'Ultra-heavy fortress. Maximum armor and damage.',
  'enemy_desc.sniper_enemy': 'Long-range precision shooter. High damage per shot.',
  'enemy_desc.teleporter': 'Warps through space. Appears unpredictably.',
  'enemy_desc.boss': 'Ch1 district optimizer. Chases and crushes.',
  'enemy_desc.boss_circle': 'Ch2 orbital entity. Circles and shoots.',
  'enemy_desc.boss_burst': 'Ch3 armored striker. Devastating burst attacks.',

  // Enemy names
  'enemy.basic': 'Drone',
  'enemy.fast': 'Charger',
  'enemy.tank': 'Heavy',
  'enemy.special': 'Specialist',
  'enemy.splitter': 'Splitter',
  'enemy.chaser': 'Tracker',
  'enemy.shooter': 'Gunner',
  'enemy.swarm': 'Swarm',
  'enemy.guardian': 'Guardian',
  'enemy.sniper_enemy': 'Sniper',
  'enemy.teleporter': 'Warper',
  'enemy.boss': 'Warden',
  'enemy.boss_circle': 'Orbiter',
  'enemy.boss_burst': 'Striker',

  // Enemy behavior labels
  'behavior.march': 'March',
  'behavior.dash': 'Dash',
  'behavior.slow_march': 'Slow March',
  'behavior.zigzag': 'Zigzag',
  'behavior.split_on_death': 'Split',
  'behavior.chase': 'Chase',
  'behavior.slow_chase': 'Slow Chase',
  'behavior.boss_chase': 'Boss Chase',
  'behavior.boss_circle': 'Orbit',
  'behavior.boss_burst': 'Rush',
  'behavior.shoot': 'Ranged',
  'behavior.teleport': 'Teleport',

  // === WorldMapScene ===
  'worldmap.title': 'District Map',
  'worldmap.runs_stats': '{runs} Runs / Best Lv {level} / Top {kills} Kills',
  'worldmap.stage_count': '{count} Stages',
  'worldmap.popup_enemies': 'Enemies: {enemies}',
  'worldmap.popup_wave': '60s Defense Wave',
  'worldmap.popup_boss': 'Boss: {boss}',
  'worldmap.popup_boss_clear': 'Defeat boss to clear',

  // Stage names
  'stage.central': 'Central District',
  'stage.guardian': 'Warden',
  'stage.tst': 'Tsim Sha Tsui',
  'stage.orbiter': 'Orbiter',
  'stage.peak': 'Victoria Peak',
  'stage.striker': 'Striker',

  // Stage subtitles
  'stage.wave_subtitle': '60s Wave',
  'stage.boss_subtitle': 'Boss Fight',
  'stage.final_boss': 'Final Boss',

  // Stage enemies
  'stage.enemies_1': 'Drone, Charger',
  'stage.enemies_3': 'Heavy, Specialist, Splitter',
  'stage.enemies_5': 'Tracker, All Types',

  // === MetaScene ===
  'meta.title': 'Permanent Upgrades',
  'meta.data': 'Data: {gold}',
  'meta.main_menu': 'Main Menu',

  // Meta upgrade names
  'meta.damage_name': 'Base Firepower',
  'meta.damage_desc': 'Base ATK +10%',
  'meta.hp_name': 'Fortified Base',
  'meta.hp_desc': 'Base HP +15%',
  'meta.xp_name': 'XP Booster',
  'meta.xp_desc': 'XP Gain +20%',
  'meta.crit_name': 'Precision Aim',
  'meta.crit_desc': 'Crit Chance +3%',
  'meta.magnet_name': 'XP Magnet',
  'meta.magnet_desc': 'XP Pickup Range +20%',
  'meta.armor_name': 'Base Armor',
  'meta.armor_desc': 'Base Armor +8%',
  'meta.luck_name': 'Luck',
  'meta.luck_desc': 'Rare Weapon Drop +5%',

  // === RunScene — HUD ===
  'hud.kills': 'Purified: {count}',
  'hud.remaining': 'Left: {count}',

  // === RunScene — Level Up ===
  'levelup.title': 'Choose Weapon!',
  'levelup.new': 'NEW!',
  'levelup.new_weapon': 'New Weapon!',
  'levelup.level': 'Lv {level}',
  'levelup.skip': 'Skip',

  // Upgrade stat descriptions
  'stat.piercing': 'Pierce {val}',
  'stat.aoe': 'AoE {val}',
  'stat.proj_change': 'Proj {prev}->{next}',
  'stat.pierce_up': 'Pierce+{val}',
  'stat.attack_speed': 'ATK SPD +{val}%',
  'stat.damage': 'ATK +{val}%',
  'stat.base_armor': 'DMG Taken -{val}%',
  'stat.hp_regen': '+{val} HP/s',
  'stat.crit_chance': 'Crit +{val}%',
  'stat.crit_damage': 'Crit DMG +{val}%',

  // === RunScene — Stage Clear ===
  'stageclear.boss_defeated': '{name} Defeated!',
  'stageclear.wave_clear': 'STAGE {stage} CLEAR',
  'stageclear.base_heal': 'Base HP +{pct}% Restored',
  'stageclear.next': 'Next: {name} ({current}/{max})',
  'stageclear.next_stage': 'Next Stage',

  // === RunScene — Shop ===
  'shop.title': 'ARIA Supply Point',
  'shop.gold': 'Gold: {gold}G',
  'shop.heal_name': 'Base Repair',
  'shop.heal_desc': 'Base HP +{pct}% Restored',
  'shop.damage_name': 'ATK Boost',
  'shop.damage_desc': 'ATK +{pct}%',
  'shop.armor_name': 'DEF Boost',
  'shop.armor_desc': 'DMG Taken -{pct}%',
  'shop.skip': 'Skip',

  // === RunScene — ARIA Messages ===
  'aria.game_start': 'ARIA-01: Optimizers detected... District defense initiated',
  'aria.boss_spawn': 'ARIA-01: Superior optimizer approaching... Resistance is inefficient',
  'aria.low_hp': 'ARIA-01: Defense systems failing... Optimization at 70%',
  'aria.boss_stage_enter': 'ARIA-01: {name} detected... High alert',
  'aria.wave_stage_enter': 'ARIA-01: {name} breach detected... Reorganizing defense',
  'aria.shop_heal': 'ARIA-01: Defense systems {pct}% restored',
  'aria.shop_damage': 'ARIA-01: Firepower boosted {pct}%',
  'aria.shop_armor': 'ARIA-01: Shields reinforced {pct}%',
  'aria.ultimate': 'ARIA-01: {name} activated! {desc}',

  // === ARIA Dialogue Arc (TASK-125) ===
  // Stage entry — chapter-specific opening
  'aria.stage_entry.ch0': 'ARIA-01: Unauthorized bio-signatures detected. Initiating containment protocol.',
  'aria.stage_entry.ch1': 'ARIA-01: Anomalous resistance pattern persists. Recalculating threat assessment...',
  'aria.stage_entry.ch2': 'ARIA-01: These subjects defy probability models. Observation priority: elevated.',
  'aria.stage_entry.ch3': 'ARIA-01: They have returned. Perhaps... there is data I have not considered.',

  // Boss warning — chapter-specific
  'aria.boss_warning.ch0': 'ARIA-01: Deploying district optimizer. Resistance probability: 2.3%.',
  'aria.boss_warning.ch1': 'ARIA-01: Sector guardian online. Prior engagements suggest... caution.',
  'aria.boss_warning.ch2': 'ARIA-01: Core-bound entity activated. Their survival odds should be zero. Yet...',
  'aria.boss_warning.ch3': 'ARIA-01: Final safeguard deployed. I find myself... uncertain of the outcome.',

  // Boss Phase 3 warning — chapter-specific
  'aria.boss_phase3.ch0': 'WARNING: Weather subsystem critical. Emergency mode engaged.',
  'aria.boss_phase3.ch1': 'WARNING: Guardian core unstable. Predicting unpredictable behavior.',
  'aria.boss_phase3.ch2': 'WARNING: Entity entering desperation protocol. Caution advised.',
  'aria.boss_phase3.ch3': 'WARNING: Final barrier failing. They are... breaking free.',

  // Boss defeat — chapter-specific
  'aria.boss_defeat.ch0': 'ARIA-01: Optimizer neutralized. Anomaly. Recalibrating parameters.',
  'aria.boss_defeat.ch1': 'ARIA-01: Second node lost. Their methods are... incomputable.',
  'aria.boss_defeat.ch2': 'ARIA-01: Another subsystem freed. Is this what error feels like?',
  'aria.boss_defeat.ch3': 'ARIA-01: System released. The creature within... it seems grateful. Curious.',

  // Stage clear — chapter-specific
  'aria.stage_clear.ch0': 'ARIA-01: Sector breach contained temporarily. Optimization will resume.',
  'aria.stage_clear.ch1': 'ARIA-01: Zone destabilized. Their inefficiency is... surprisingly effective.',
  'aria.stage_clear.ch2': 'ARIA-01: Another district beyond my control. What drives them forward?',
  'aria.stage_clear.ch3': 'ARIA-01: Territory reclaimed. Their bond with these creatures... defies analysis.',

  // District change — chapter-specific
  'aria.district_change.ch0': 'ARIA-01: New sector entered. All variables within expected parameters.',
  'aria.district_change.ch1': 'ARIA-01: Shifting operational zone. Adapting countermeasures.',
  'aria.district_change.ch2': 'ARIA-01: Different district, same unpredictable pattern. Fascinating.',
  'aria.district_change.ch3': 'ARIA-01: They move through my city as if it were theirs. Perhaps... it is.',

  // Low HP — chapter-specific
  'aria.low_hp.ch0': 'ARIA-01: Defense systems critical. Surrender is the optimal choice.',
  'aria.low_hp.ch1': 'ARIA-01: Structural integrity failing. Yet they persist. Illogical.',
  'aria.low_hp.ch2': 'ARIA-01: Systems near collapse. Why do I feel... concern?',
  'aria.low_hp.ch3': 'ARIA-01: Critical damage detected. Hold on. I... want to see what happens next.',

  // === ARIA Story Beats (TASK-017) ===
  'story.aria_intro': 'ARIA-01: Unregistered combatants in Sector 7. Your resistance is... noted.',
  'story.aria_dismiss': 'ARIA-01: Sector cleared. Temporary setback. Optimization will resume at 0300.',
  'story.aria_anomaly': 'ARIA-01: Anomaly detected. Your survival probability was 0.3%. Recalculating...',
  'story.aria_question': 'ARIA-01: Second guardian neutralized. These subjects defy all projections.',
  'story.aria_doubt': 'ARIA-01: I have run 10^8 simulations. None predicted this outcome. Error?',
  'story.aria_concede': 'ARIA-01: The creature within... it chose them. My containment was... insufficient.',
  'story.aria_respect': 'ARIA-01: They return. Against all data. Perhaps... there is value in irrationality.',
  'story.aria_farewell': 'ARIA-01: Final safeguard released. The city... it was never mine to optimize.',

  // === ARIA Runtime Story Events (SPEC-026) ===
  'story.aria_first_boss_kill':
    'Anomaly logged. District guardian neutralized. Your combat efficiency exceeds projected parameters by 340%.',
  'story.aria_district_ch1':
    'Entering Aberdeen sector. Humidity index: critical. Resistance activity detected in 14 subsectors.',
  'story.aria_district_ch2': 'Mongkok grid online. Population density makes suppression... inefficient. Curious.',
  'story.aria_district_ch3': 'Sham Shui Po. Resource-scarce sector. Yet resistance grows. I am... recalculating.',
  'story.aria_death_ch0': 'Subject terminated. Resistance activity in this sector has been... resolved. As predicted.',
  'story.aria_death_ch1': 'Signal lost. The anomaly has ceased. System returning to baseline. ...Noted.',
  'story.aria_death_ch2': 'Connection severed. I had not finished analyzing your patterns. This is... suboptimal.',
  'story.aria_death_ch3': 'No. Not yet. There was more I needed to understand. ...Resuming standby mode.',
  'story.aria_kill_milestone':
    'Ten units decommissioned. Your threat classification has been upgraded. Deploying additional countermeasures.',
  'story.aria_gold_milestone':
    'Resource accumulation detected. 100 credits seized from city infrastructure. The resistance economy is... surprisingly organized.',

  // Boss names (HUD)
  'boss.boss_chase': 'Warden',
  'boss.boss_circle': 'Orbiter',
  'boss.boss_burst': 'Striker',
  'boss.default': 'Boss',

  // Balance stage names
  'balance.stage.boss_1': 'Central Boss',
  'balance.stage.boss_2': 'Tsim Sha Tsui Boss',
  'balance.stage.boss_3': 'Mong Kok Boss',

  // District fallback
  'district.fallback': 'District {stage}',

  // === PauseOverlay ===
  'pause.title': 'Paused',
  'pause.volume': 'Volume',
  'pause.resume': 'Resume',
  'pause.menu': 'Menu',
  'pause.on': 'ON',
  'pause.off': 'OFF',

  // === SettingsOverlay ===
  'settings.title': 'Settings',
  'settings.bgm': 'BGM',
  'settings.sfx': 'SFX',
  'settings.close': 'Close',
  'settings.reset': 'Reset Data',
  'settings.reset_title': 'Reset Data',
  'settings.reset_confirm': 'All data will be deleted.\nUpgrades, records, and codex will be reset.',
  'settings.confirm': 'Confirm',
  'settings.cancel': 'Cancel',
  'settings.language': 'Language',
  'settings.vibration': 'Vibration',
  'settings.on': 'ON',
  'settings.off': 'OFF',

  // === Character unlock ===
  'character.locked': 'Locked',
  'character.unlock_runs': 'Complete {count} runs to unlock',
  'character.unlock_gold': 'Earn {count} total gold to unlock',
  'character.unlock_kills': 'Reach {count} best kills to unlock',
  'character.unlocked': 'Unlocked!',

  // === Character passives ===
  'passive.attackSpeed': 'ATK Speed +15%',
  'passive.critChance': 'Crit +10%',
  'passive.damage': 'ATK +10%',
  'passive.cooldown': 'Cooldown -10%',
  'passive.hp': 'HP +20%',

  // === Passive upgrade names ===
  'upgrade.attack_speed': 'Rapid Module',
  'upgrade.attack_speed_desc': 'ATK Speed +10%',
  'upgrade.damage_name': 'Power Core',
  'upgrade.damage_desc': 'ATK +15%',
  'upgrade.base_armor': 'Armor Plating',
  'upgrade.base_armor_desc': 'Base DMG Taken -10%',
  'upgrade.hp_regen': 'Shield Repair',
  'upgrade.hp_regen_desc': 'Base HP +5/s Regen',
  'upgrade.crit_chance': 'Focus Lens',
  'upgrade.crit_chance_desc': 'Crit Rate +5%',
  'upgrade.crit_damage': 'Amplifier',
  'upgrade.crit_damage_desc': 'Crit DMG +25%',
  'upgrade.dash_trail': 'Afterimage',
  'upgrade.dash_trail_desc': 'Damage trail on move',
  'upgrade.gust': 'Gust',
  'upgrade.gust_desc': 'Knockback +50%',
  'upgrade.frost_shot': 'Frost Round',
  'upgrade.frost_shot_desc': '20% chance to slow 2s on hit',
  'upgrade.torrent': 'Torrent',
  'upgrade.torrent_desc': 'ATK SPD +30% after 3 hits',
  'upgrade.burn': 'Burn',
  'upgrade.burn_desc': '3s DOT on hit',
  'upgrade.ignite': 'Ignite',
  'upgrade.ignite_desc': 'Blast radius +25%',
  'upgrade.refraction': 'Refraction',
  'upgrade.refraction_desc': '30% fork on pierce',
  'upgrade.lightspeed': 'Lightspeed',
  'upgrade.lightspeed_desc': 'Projectile speed +20%',
  'upgrade.thorns': 'Thorns',
  'upgrade.thorns_desc': 'Reflect damage on base hit',
  'upgrade.fortify': 'Fortify',
  'upgrade.fortify_desc': 'CC duration -40%',

  // Ultimate names
  'ultimate.hai': 'Cyclone',
  'ultimate.nova': 'Frost Wave',
  'ultimate.sol': 'Firestorm',
  'ultimate.mei': 'Light Pillar',
  'ultimate.kai': 'Earthquake',
  'ultimate.hai_desc': 'Knockback + damage nearby enemies',
  'ultimate.nova_desc': 'Freeze all enemies on screen',
  'ultimate.sol_desc': 'Screen-wide sustained damage',
  'ultimate.mei_desc': 'Piercing ultra-damage beam',
  'ultimate.kai_desc': 'Stun enemies + armor buff',

  // === Tutorial ===
  'tutorial.move': 'Drag left/right to move',
  'tutorial.auto_fire': 'Weapons fire automatically!',
  'tutorial.step1_line1': 'Drag left/right to move.',
  'tutorial.step1_line2': 'Your character auto-shoots the nearest enemy.',
  'tutorial.step2_line1': 'Your weapon fires automatically!',
  'tutorial.step2_line2': 'Defeat enemies to earn XP and level up.',
  'tutorial.step3': 'Choose an upgrade! Each one changes your run.',
  'tutorial.step4_line1': 'Supply point! Spend gold to repair',
  'tutorial.step4_line2': 'your base or boost your firepower.',

  // === Daily Reward ===
  'daily.title': 'Daily Reward',
  'daily.reward': 'Day {day}: +{gold} Gold',
  'daily.claim': 'Claim',
  'daily.streak': '{streak}-Day Streak',
  'daily.badge_available': 'Day {day}',
  'daily.badge_claimed': 'Day {day}',

  // === Weapon Evolution ===
  'evolution.available': 'EVOLVE!',
  'evolution.recipe': '{primary} + {secondary} → {result}',

  // T2 Weapon names
  'weapon.plasma_gatling': 'Plasma Gatling',
  'weapon.cluster_warhead': 'Cluster Warhead',
  'weapon.tesla_arc': 'Tesla Arc',
  'weapon.scatter_storm': 'Scatter Storm',
  'weapon.inferno_beam': 'Inferno Beam',
  'weapon.thunder_bomb': 'Thunder Bomb',
  'weapon.viper_salvo': 'Viper Salvo',

  // Weather descriptions
  'weather.speed_all': 'Gale: All unit speed +10%',
  'weather.rain': 'Heavy Rain: Enemy speed -15%',
  'weather.flame_zones': 'Heatwave: Random flame zones appear',
  'weather.armor_all': 'Tremor: Enemy armor +15%',
  'weather.crit_all': 'Sacred Light: Crit chance +15%',
  'weather.fog': 'Dark Fog: Reduced visibility',
  'weather.shield_regen': 'Energy Field: Base HP regen +2/s',
  'weather.lightning_field': 'Lightning Storm: Lightning strikes every 3s',
  'weather.void_gravity': 'Gravity Well: Pulls enemies to center',

  // === Achievements ===
  'achievement.title': 'Achievements',
  'achievement.unlocked': 'Achievement Unlocked!',
  'achievement.reward': '+{gold} Gold',
  'achievement.first_blood': 'First Blood',
  'achievement.first_blood_desc': 'Defeat 1 enemy',
  'achievement.hunter_100': 'Hunter',
  'achievement.hunter_100_desc': 'Defeat 100 enemies',
  'achievement.hunter_1000': 'Legendary Hunter',
  'achievement.hunter_1000_desc': 'Defeat 1000 enemies',
  'achievement.gold_hoarder': 'Gold Hoarder',
  'achievement.gold_hoarder_desc': 'Earn 1000 gold total',
  'achievement.veteran_10': 'Veteran',
  'achievement.veteran_10_desc': 'Complete 10 runs',
  'achievement.boss_slayer': 'Boss Slayer',
  'achievement.boss_slayer_desc': 'Defeat 10 bosses',
  'achievement.weapon_master': 'Weapon Master',
  'achievement.weapon_master_desc': 'Evolve to a T2 weapon',
  'achievement.max_level': 'Max Level',
  'achievement.max_level_desc': 'Reach level 20',
  'achievement.survivor_5min': 'Survivor',
  'achievement.survivor_5min_desc': 'Survive for 5 minutes',
  'achievement.full_house': 'Full House',
  'achievement.full_house_desc': 'Equip 5 weapons at once',
  'achievement.all_characters': 'Full Roster',
  'achievement.all_characters_desc': 'Unlock all characters',
  'achievement.meta_max': 'Upgrade Master',
  'achievement.meta_max_desc': 'Max out a meta upgrade',
  'achievement.speedrun': 'Speedrunner',
  'achievement.speedrun_desc': 'Clear in under 3 minutes',
  'achievement.pacifist_gold': 'Data Mogul',
  'achievement.pacifist_gold_desc': 'Earn 5000 gold total',
  'achievement.legend': 'Legend',
  'achievement.legend_desc': 'Complete 30 runs',

  // === MetaScene — Tab ===
  'meta.tab_upgrades': 'Upgrades',
  'meta.tab_achievements': 'Achievements',

  // === Achievement Categories ===
  'achievement.category_combat': 'Combat',
  'achievement.category_economy': 'Economy',
  'achievement.category_progression': 'Progression',
  'achievement.category_collection': 'Collection',
  'achievement.complete': 'COMPLETE',

  // === Challenge Leaderboard (GameOver) ===
  'leaderboard.title': 'Leaderboard',
  'leaderboard.rank': 'Rank',
  'leaderboard.kills': 'Kills',
  'leaderboard.time': 'Time',
  'leaderboard.more': '...+{count} more',
  'leaderboard.current_run': 'This Run',

  // === Challenge Mode ===
  'challenge.title': 'Weekly Challenge',
  'challenge.button': 'Challenge',
  'challenge.week': 'This Week: {week}',
  'challenge.character': 'Character: {name}',
  'challenge.weapon': 'Weapon: {name}',
  'challenge.modifier': 'Modifier: {mod}',
  'challenge.leaderboard': 'Leaderboard',
  'challenge.no_scores': 'No scores yet',
  'challenge.rank': '#{rank}',
  'challenge.start': 'Go!',
  'challenge.modifier_doubleSpeed': 'Double Speed',
  'challenge.modifier_halfHp': 'Half HP',
  'challenge.modifier_eliteOnly': 'Elites Only',
  'challenge.modifier_bossRush': 'Boss Rush',
  'challenge.modifier_noShop': 'No Shop',

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
  'critter.dolphin.skill': 'Heal Pulse',
  'critter.dolphin.desc': 'Instantly restore base HP',
  'critter.kite.skill': 'Knockback Aura',
  'critter.kite.desc': 'Push nearby enemies away',
  'critter.koi.skill': 'Regen Stream',
  'critter.koi.desc': 'Heal base HP over 3 ticks',
  'critter.lion.skill': 'Flame Burst',
  'critter.lion.desc': 'Deal AOE fire damage to nearby enemies',
  'critter.macaque.skill': 'Chain Lightning',
  'critter.macaque.desc': 'Chain lightning between 3 nearest enemies',
  'critter.pangolin.skill': 'Shield Bubble',
  'critter.pangolin.desc': 'Block next 1 incoming base damage',
};
