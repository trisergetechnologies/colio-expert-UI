// utils/rnAgora.ts (Consultant App)
import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
} from 'react-native-agora';

let engineInstance: any = null;

export async function createEngine(appId: string) {
  try {
    console.log('[Consultant] [rnAgora] Creating engine with appId:', appId);

    // ✅ Return existing instance if already created
    if (engineInstance) {
      console.log('[Consultant] [rnAgora] ⚠ Engine already exists, returning existing instance');
      return engineInstance;
    }

    // ✅ Create new engine
    const engine = createAgoraRtcEngine();
    
    // ✅ CRITICAL: Initialize the engine FIRST
    console.log('[Consultant] [rnAgora] Initializing engine...');
    const initResult = engine.initialize({
      appId: appId,
      channelProfile: ChannelProfileType.ChannelProfileCommunication,
    });
    
    console.log('[Consultant] [rnAgora] Initialize result:', initResult);

    if (initResult !== 0) {
      console.error('[Consultant] [rnAgora] ❌ Initialize failed with code:', initResult);
      return null;
    }

    // ✅ Set client role (broadcaster = can send audio/video)
    await engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
    console.log('[Consultant] [rnAgora] Client role set to broadcaster');

    // ✅ Enable audio by default
    await engine.enableAudio();
    console.log('[Consultant] [rnAgora] Audio enabled by default');

    engineInstance = engine;
    console.log('[Consultant] [rnAgora] ✅ Engine created and initialized successfully!');
    
    return engine;
  } catch (error) {
    console.error('[Consultant] [rnAgora] ❌ Engine creation error:', error);
    return null;
  }
}

export function getEngine() {
  return engineInstance;
}

export function clearEngine() {
  engineInstance = null;
  console.log('[Consultant] [rnAgora] Engine instance cleared');
}