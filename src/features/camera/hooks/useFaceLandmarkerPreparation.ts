'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { createFaceLandmarkerAdapter } from '@/infrastructure/mediapipe/face-landmarker-adapter';
import type {
  FaceLandmarkerAdapter,
  FaceLandmarkerLoadState,
} from '@/infrastructure/mediapipe/types';

function createIdleState(): FaceLandmarkerLoadState {
  return { status: 'idle' };
}

export function useFaceLandmarkerPreparation() {
  const adapterRef = useRef<FaceLandmarkerAdapter | null>(null);
  const isMountedRef = useRef(true);
  const [state, setState] = useState<FaceLandmarkerLoadState>(createIdleState);

  if (adapterRef.current === null) {
    adapterRef.current = createFaceLandmarkerAdapter();
  }

  useEffect(() => {
    const adapter = adapterRef.current;
    isMountedRef.current = true;

    if (!adapter) {
      return;
    }

    const unsubscribe = adapter.subscribe((nextState) => {
      if (isMountedRef.current) {
        setState(nextState);
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
      adapter.dispose();
    };
  }, []);

  const initialize = useCallback(async () => {
    const adapter = adapterRef.current;

    if (!adapter) {
      return;
    }

    setState(adapter.getState());
    await adapter.initialize();

    if (isMountedRef.current) {
      setState(adapter.getState());
    }
  }, []);

  const dispose = useCallback(() => {
    adapterRef.current?.dispose();

    if (isMountedRef.current) {
      setState(adapterRef.current?.getState() ?? { status: 'disposed' });
    }
  }, []);

  return {
    state,
    isReady: state.status === 'ready',
    initialize,
    dispose,
  };
}
