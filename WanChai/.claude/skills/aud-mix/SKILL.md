---
name: aud-mix
description: '오디오 믹싱 — 씬별 BGM 전환, 동적 볼륨, SFX 배선 통합'
user-invocable: true
argument-hint: '[task] e.g. wire-combat, dynamic-volume, scene-transitions'
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

## 역할

Audio Designer로서 BGM과 SFX를 게임 로직에 통합합니다.
씬 전환 시 BGM 크로스페이드, 전투 강도에 따른 동적 볼륨, SFX 호출 배선을 담당합니다.

## 핵심 참조

- `src/audio/RetroAudio.ts` — BGM 시스템
- `src/audio/RetroSFX.ts` — SFX 시스템
- `src/scenes/RunScene.ts` — 전투 씬 (SFX 배선 최우선)
- `src/managers/SaveManager.ts` — 볼륨 설정 저장

## 통합 패턴

### 씬 전환 BGM

```typescript
// 이전 BGM 페이드아웃 → 새 BGM 시작
scene.tweens.add({
  targets: { vol: currentVol },
  vol: 0,
  duration: 500,
  onUpdate: (tween) => audio.setVolume(tween.getValue()),
  onComplete: () => {
    audio.stop();
    newAudio.play();
  },
});
```

### 동적 전투 강도

```typescript
// 적 수 / 보스 여부에 따라 BGM 레이어 추가
if (activeEnemies > 20) addDrumLayer();
if (bossActive) switchToBossTrack();
```

### SFX 배선 체크리스트

- [ ] `onEnemyDeath()` → `sfx.destroy()`
- [ ] `onBossSpawn()` → `sfx.bossWarning()`
- [ ] `onLevelUp()` → `sfx.levelUp()`
- [ ] `onWeaponFire()` → `sfx.weaponFire(weaponType)`
- [ ] `onBaseHit()` → `sfx.baseHit()`
- [ ] 버튼 pointerdown → `sfx.tap()`

## 절차

1. 현재 오디오 호출 현황을 `grep`으로 파악한다
2. 요청된 통합 작업을 수행한다
3. 볼륨 밸런스를 확인한다 (BGM 0.08-0.15, SFX 0.15-0.25)
4. `npm run build`로 빌드 검증

## 제약

- **수정 가능**: `src/audio/`, `src/scenes/`, `src/managers/`
- AudioContext 싱글톤 유지 — 씬 간 공유
- 모바일 제한: 동시 OscillatorNode 8개 이내 권장
