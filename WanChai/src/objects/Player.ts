import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { CHARACTERS } from '../config/characters';
import { ELEMENT, TEX } from '../config/colors';
import { resolveTexture } from '../config/atlas-manifest';
import { aimAtAngle, addUltimateGauge, consumeUltimate } from '../utils/PlayerCalc';

export interface SquadMemberConfig {
  /** Position override (default: BALANCE.PLAYER.baseX/Y) */
  posX?: number;
  posY?: number;
  /** Role: 'leader' uses full features, 'member' skips ultimate gauge */
  role?: 'leader' | 'member';
  /** Scale override for squad members */
  scale?: number;
  /** Idle bob delay offset for natural stagger (ms) */
  idleBobDelayMs?: number;
}

/**
 * Player defender — fixed at the left side, faces right.
 * Uses CraftPix spritesheet animations (idle loop + attack on fire).
 * The BARRIER has HP; the player itself cannot be killed directly.
 * Supports squad configuration: leader (full features) or member (auto-shoot only).
 *
 * Container children (layered):
 *   [0] bodySprite — idle/attack spritesheet, NO rotation
 *   [1] armSprite  — hand+gun image, ROTATES toward enemy
 *   [2] muzzleFlashSprite — follows arm tip
 */
export class Player extends Phaser.GameObjects.Container {
  public critChance = 0;
  public critDamage: number;
  public damageMultiplier = 1;
  public attackSpeedMultiplier = 1;
  public elementColor: number;
  public elementName: string;

  // Ultimate ability state
  public ultimateGauge = 0;
  public ultimateMax: number;
  public ultimateReady = false;
  public characterId: string;

  /** Squad role: 'leader' (main player) or 'member' (auto-shoot ally) */
  public readonly squadRole: 'leader' | 'member';

  /** Body sprite — plays idle/attack animations, does NOT rotate */
  private bodySprite: Phaser.GameObjects.Sprite;
  /** Arm+gun sprite — separate layer that rotates toward enemies */
  private armSprite: Phaser.GameObjects.Image | null = null;
  /** Gun barrel graphics — child of container, follows arm rotation */
  private gunGfx: Phaser.GameObjects.Graphics | null = null;
  private idleAnimKey: string;
  private muzzleFlashSprite: Phaser.GameObjects.Sprite | null = null;
  private idleBobTween: Phaser.Tweens.Tween | null = null;
  private recoilTween: Phaser.Tweens.Tween | null = null;
  private pulseTween: Phaser.Tweens.Tween | null = null;
  private isPlayingAttack = false;
  /** Cached body scale for recoil/pulse tweens */
  private bodyBaseScale = 1;

  constructor(scene: Phaser.Scene, x: number, characterId?: string, squadConfig?: SquadMemberConfig) {
    const posX = squadConfig?.posX ?? BALANCE.PLAYER.baseX;
    const posY = squadConfig?.posY ?? BALANCE.PLAYER.baseY;
    super(scene, posX, posY);

    this.critDamage = BALANCE.COMBAT.critMultiplier;
    this.ultimateMax = BALANCE.ULTIMATE.gaugeMax;
    this.characterId = characterId ?? 'hai';
    this.squadRole = squadConfig?.role ?? 'leader';

    const charDef = characterId ? CHARACTERS[characterId] : null;

    // Resolve CraftPix spritesheet animation key (idle only — attack uses arm recoil)
    this.idleAnimKey = charDef?.idleAnimKey ?? 'biker_idle';

    // ── Body sprite (idle/attack, no rotation) ──────────────────────────
    const spriteKey = scene.textures.exists(this.idleAnimKey) ? this.idleAnimKey : (charDef?.ingameKey ?? 'player');
    this.bodySprite = scene.add.sprite(0, 0, spriteKey);

    // Scale: source → targetSize display (P1: 128px, squad members 0.85x)
    const targetSize = BALANCE.PLAYER.targetSize;
    const charTexH = this.bodySprite.texture.getSourceImage().height || this.bodySprite.texture.getSourceImage().width;
    const baseScale = charTexH > 0 && charTexH !== targetSize ? targetSize / charTexH : 1;
    const memberScaleMult = squadConfig?.scale ?? 1;
    this.bodyBaseScale = baseScale * memberScaleMult;
    this.bodySprite.setScale(this.bodyBaseScale);

    // Side-view: player faces RIGHT (CraftPix sprites face right by default)
    this.bodySprite.setFlipX(false);

    this.add(this.bodySprite);

    // Start idle animation if available
    if (scene.anims.exists(this.idleAnimKey)) {
      this.bodySprite.play(this.idleAnimKey);
    }

    // ── Arm sprite (hand, rotates independently) ────────────────────────
    const handKey = charDef?.handSpriteKey ?? 'hand_biker';
    const handTex = resolveTexture(scene, handKey);
    if (handTex) {
      const anim = BALANCE.PLAYER_ANIM;
      this.armSprite = scene.add.image(anim.armOffsetX, anim.armOffsetY, handTex.texture, handTex.frame);
      // Scale hand to ~30% of body display size (hand is detail, not full character)
      const armScale = this.bodyBaseScale * anim.armScaleMult;
      this.armSprite.setScale(armScale);
      // Set rotation origin near shoulder (left side of sprite)
      this.armSprite.setOrigin(anim.armOriginX, anim.armOriginY);
      // Arm renders above body
      this.armSprite.setDepth(1);
      this.add(this.armSprite);

      // ── Gun barrel (procedural, extends from hand) ──────────────────
      this.gunGfx = scene.add.graphics();
      const gunLen = anim.gunLength;
      const gunW = anim.gunWidth;
      // Draw gun barrel: dark body + lighter highlight
      this.gunGfx.fillStyle(TEX.GUN_BODY, 1);
      this.gunGfx.fillRect(0, -gunW / 2, gunLen, gunW);
      this.gunGfx.fillStyle(TEX.GUN_HIGHLIGHT, 1);
      this.gunGfx.fillRect(0, -gunW / 2, gunLen, gunW * 0.3);
      // Muzzle tip accent
      this.gunGfx.fillStyle(TEX.GUN_MUZZLE, 1);
      this.gunGfx.fillRect(gunLen - 4, -gunW / 2 - 1, 4, gunW + 2);
      // Position gun at hand tip (right edge of scaled hand sprite)
      const handDisplayW = 32 * armScale; // hand sprite is 32px wide
      this.gunGfx.setPosition(anim.armOffsetX + handDisplayW * 0.7, anim.armOffsetY);
      this.gunGfx.setDepth(1);
      this.add(this.gunGfx);
    }

    // ── Muzzle flash (follows arm tip) ──────────────────────────────────
    const shootEffectKey = 'shoot_effect_1';
    if (scene.textures.exists(shootEffectKey)) {
      this.muzzleFlashSprite = scene.add.sprite(
        BALANCE.PLAYER_ANIM.muzzleFlashOffsetX,
        BALANCE.PLAYER_ANIM.muzzleFlashOffsetY,
        shootEffectKey,
      );
      this.muzzleFlashSprite.setScale(BALANCE.PLAYER.targetSize / 48); // match player scale
      this.muzzleFlashSprite.setVisible(false);
      this.muzzleFlashSprite.setDepth(2); // above arm
      this.add(this.muzzleFlashSprite);
    }

    // Element from character definition
    const elementKey = charDef?.element ?? 'WIND';
    this.elementColor = ELEMENT[elementKey] ?? ELEMENT.WIND;
    this.elementName = elementKey;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(14);
    body.setOffset(-14, -14);
    body.setCollideWorldBounds(true);

    // Side-view: player is fully stationary at fixed position
    body.allowGravity = false;
    body.setMaxVelocity(0, 0);
    body.setImmovable(true);

    // Idle bob animation (staggered for squad members)
    const bobDelay = squadConfig?.idleBobDelayMs ?? 0;
    if (bobDelay > 0) {
      this.scene.time.delayedCall(bobDelay, () => this.startIdleBob());
    } else {
      this.startIdleBob();
    }
  }

  private startIdleBob(): void {
    const anim = BALANCE.PLAYER_ANIM;
    this.idleBobTween = this.scene.tweens.add({
      targets: this.bodySprite,
      y: { from: -anim.idleBobPx, to: anim.idleBobPx },
      duration: anim.idleBobMs,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });
  }

  /** Fire visual: keep body on idle, kick arm back + muzzle flash */
  playAttackAnim(): void {
    if (this.isPlayingAttack) return;
    this.isPlayingAttack = true;

    // Body stays on idle — never switch to attack spritesheet
    // Arm + gun recoil: quick rotation kick-back then return
    if (this.armSprite) {
      const baseRot = this.armSprite.rotation;
      const targets = this.gunGfx ? [this.armSprite, this.gunGfx] : [this.armSprite];
      this.scene.tweens.add({
        targets,
        rotation: baseRot - 0.15, // kick back ~8.5°
        duration: 40,
        ease: 'Quad.Out',
        yoyo: true,
        onComplete: () => {
          this.isPlayingAttack = false;
        },
      });
    } else {
      this.scene.time.delayedCall(BALANCE.PLAYER_ANIM.muzzleFlashMs, () => {
        this.isPlayingAttack = false;
      });
    }

    // Show muzzle flash at arm tip
    this.showMuzzleFlash();
  }

  /** Show muzzle flash at arm tip position */
  private showMuzzleFlash(): void {
    if (!this.muzzleFlashSprite) return;

    // Update muzzle flash position to arm tip
    this.updateMuzzleFlashPosition();

    this.muzzleFlashSprite.setVisible(true);
    const effectKey = 'shoot_effect_1';
    if (this.scene.anims.exists(effectKey)) {
      this.muzzleFlashSprite.play(effectKey);
      this.muzzleFlashSprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (this.muzzleFlashSprite) this.muzzleFlashSprite.setVisible(false);
      });
    } else {
      this.scene.time.delayedCall(BALANCE.PLAYER_ANIM.muzzleFlashMs, () => {
        if (this.muzzleFlashSprite) this.muzzleFlashSprite.setVisible(false);
      });
    }
  }

  /** Calculate and set muzzle flash position based on arm rotation */
  private updateMuzzleFlashPosition(): void {
    if (!this.muzzleFlashSprite) return;

    if (this.armSprite) {
      const anim = BALANCE.PLAYER_ANIM;
      const armLen = this.armSprite.displayWidth * anim.armMuzzleFraction;
      const angle = this.armSprite.rotation;
      this.muzzleFlashSprite.x = this.armSprite.x + Math.cos(angle) * armLen;
      this.muzzleFlashSprite.y = this.armSprite.y + Math.sin(angle) * armLen;
    }
    // If no armSprite, muzzle flash stays at its default offset position
  }

  /** Called by RunScene when weapon fires — triggers attack anim + recoil + scale pulse */
  onWeaponFire(): void {
    const anim = BALANCE.PLAYER_ANIM;

    // Play attack spritesheet animation
    this.playAttackAnim();

    // Recoil: quick snap up then return (body only)
    if (!this.recoilTween || !this.recoilTween.isPlaying()) {
      this.recoilTween = this.scene.tweens.add({
        targets: this.bodySprite,
        y: this.bodySprite.y - anim.recoilPx,
        duration: anim.recoilMs,
        ease: 'Quad.Out',
        yoyo: true,
      });
    }

    // Scale pulse: quick pop then return (body only)
    if (!this.pulseTween || !this.pulseTween.isPlaying()) {
      const currentScale = this.bodySprite.scaleX;
      this.pulseTween = this.scene.tweens.add({
        targets: this.bodySprite,
        scaleX: currentScale * anim.pulseScale,
        scaleY: currentScale * anim.pulseScale,
        duration: anim.pulseMs,
        ease: 'Quad.Out',
        yoyo: true,
      });
    }
  }

  /**
   * Rotate arm sprite to point toward a world position (clamped ±maxAimDeg).
   * Body remains fixed (no rotation).
   */
  aimAt(targetX: number, targetY: number): void {
    const clamped = aimAtAngle(this.x, this.y, targetX, targetY, BALANCE.PLAYER_ANIM.maxAimDeg);

    // Body: never rotates in side-view
    this.bodySprite.setRotation(0);

    // Arm + gun: rotate toward target
    if (this.armSprite) {
      this.armSprite.setRotation(clamped);
      if (this.gunGfx) this.gunGfx.setRotation(clamped);
      this.updateMuzzleFlashPosition();
    }
  }

  /** Reset aim to point straight right when no target. */
  aimUp(): void {
    this.bodySprite.setRotation(0);
    if (this.armSprite) {
      this.armSprite.setRotation(0);
      if (this.gunGfx) this.gunGfx.setRotation(0);
      this.updateMuzzleFlashPosition();
    }
  }

  /** Add to the ultimate gauge (capped at max). */
  addUltimateGauge(amount: number): void {
    const result = addUltimateGauge(this.ultimateGauge, amount, this.ultimateMax);
    this.ultimateGauge = result.gauge;
    this.ultimateReady = result.ready;
  }

  /** Consume the ultimate gauge. Returns true if it was ready and consumed. */
  consumeUltimate(): boolean {
    const result = consumeUltimate(this.ultimateGauge, this.ultimateReady, this.ultimateMax);
    this.ultimateGauge = result.gauge;
    this.ultimateReady = result.ready;
    return result.consumed;
  }
}
