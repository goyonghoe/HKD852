import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock SceneLifecycleCalc to control transition decisions
vi.mock('../../src/core/SceneLifecycleCalc', () => ({
  getSceneTransition: vi.fn(),
}));

import { navigateScene } from '../../src/utils/SceneNav';
import { getSceneTransition } from '../../src/core/SceneLifecycleCalc';

const mockedGetSceneTransition = vi.mocked(getSceneTransition);

function createMockScene() {
  return {
    scene: {
      start: vi.fn(),
      stop: vi.fn(),
      sleep: vi.fn(),
      wake: vi.fn(),
      launch: vi.fn(),
      isSleeping: vi.fn().mockReturnValue(false),
    },
  } as unknown as import('phaser').Scene;
}

describe('navigateScene', () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  it('calls scene.start for "start" action', () => {
    mockedGetSceneTransition.mockReturnValue({ action: 'start', target: 'MainMenuScene', preserveState: false });
    navigateScene(mockScene, 'RunScene', 'MainMenuScene');
    expect(mockScene.scene.start).toHaveBeenCalledWith('MainMenuScene', undefined);
  });

  it('calls scene.start with data for "start" action', () => {
    mockedGetSceneTransition.mockReturnValue({ action: 'start', target: 'RunScene', preserveState: false });
    const data = { characterId: 'hai' };
    navigateScene(mockScene, 'MainMenuScene', 'RunScene', data);
    expect(mockScene.scene.start).toHaveBeenCalledWith('RunScene', data);
  });

  it('calls sleep + start for "sleep" action when target not sleeping', () => {
    mockedGetSceneTransition.mockReturnValue({ action: 'sleep', target: 'WeaponCodexScene', preserveState: true });
    (mockScene.scene.isSleeping as ReturnType<typeof vi.fn>).mockReturnValue(false);
    navigateScene(mockScene, 'RunScene', 'WeaponCodexScene');
    expect(mockScene.scene.sleep).toHaveBeenCalledWith('RunScene');
    expect(mockScene.scene.start).toHaveBeenCalledWith('WeaponCodexScene', undefined);
  });

  it('calls sleep + wake for "sleep" action when target is sleeping', () => {
    mockedGetSceneTransition.mockReturnValue({ action: 'sleep', target: 'WeaponCodexScene', preserveState: true });
    (mockScene.scene.isSleeping as ReturnType<typeof vi.fn>).mockReturnValue(true);
    navigateScene(mockScene, 'RunScene', 'WeaponCodexScene');
    expect(mockScene.scene.sleep).toHaveBeenCalledWith('RunScene');
    expect(mockScene.scene.wake).toHaveBeenCalledWith('WeaponCodexScene', undefined);
  });

  it('calls stop + wake for "wake" action', () => {
    mockedGetSceneTransition.mockReturnValue({ action: 'wake', target: 'RunScene', preserveState: true });
    navigateScene(mockScene, 'WeaponCodexScene', 'RunScene');
    expect(mockScene.scene.stop).toHaveBeenCalledWith('WeaponCodexScene');
    expect(mockScene.scene.wake).toHaveBeenCalledWith('RunScene', undefined);
  });

  it('calls scene.launch for "launch" action', () => {
    mockedGetSceneTransition.mockReturnValue({ action: 'launch', target: 'HUDScene', preserveState: true });
    navigateScene(mockScene, 'RunScene', 'HUDScene');
    expect(mockScene.scene.launch).toHaveBeenCalledWith('HUDScene', undefined);
  });

  it('calls scene.stop for "stop" action', () => {
    mockedGetSceneTransition.mockReturnValue({ action: 'stop', target: 'RunScene', preserveState: false });
    navigateScene(mockScene, 'RunScene', 'RunScene');
    expect(mockScene.scene.stop).toHaveBeenCalledWith('RunScene');
  });

  it('passes data through to wake calls', () => {
    mockedGetSceneTransition.mockReturnValue({ action: 'wake', target: 'RunScene', preserveState: true });
    const data = { resumeFrom: 'shop' };
    navigateScene(mockScene, 'MetaScene', 'RunScene', data);
    expect(mockScene.scene.wake).toHaveBeenCalledWith('RunScene', data);
  });
});
