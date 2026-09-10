import { describe, expect, it } from 'vitest';

import { createCameraState } from '@/features/camera/types/camera-state';

describe('createCameraState', () => {
  it('creates an idle state without an error by default', () => {
    expect(createCameraState('idle')).toEqual({
      status: 'idle',
      error: null,
    });
  });

  it('attaches a classified error when provided', () => {
    const error = {
      code: 'permission-denied' as const,
      title: 'Permissão indisponível',
      message: 'Negada',
      recovery: 'Revise a permissão',
      canRetry: true,
      severity: 'error' as const,
    };

    expect(createCameraState('denied', error)).toEqual({
      status: 'denied',
      error,
    });
  });
});
