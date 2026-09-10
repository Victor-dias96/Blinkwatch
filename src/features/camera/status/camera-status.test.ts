import { describe, expect, it } from 'vitest';

import { createCameraPresentationError } from '@/features/camera/errors/camera-error';
import { resolveCameraStatusPresentation } from '@/features/camera/status/camera-status';

const idleInput = {
  status: 'idle' as const,
  error: null,
  hasValidActiveTrack: false,
  hasValidPausedTrack: false,
  isRefreshingDevices: false,
};

describe('resolveCameraStatusPresentation', () => {
  it('presents a silent idle state', () => {
    const presentation = resolveCameraStatusPresentation(idleInput);

    expect(presentation.title).toBe('Câmera desligada');
    expect(presentation.tone).toBe('neutral');
    expect(presentation.shouldAnnounce).toBe(false);
  });

  it('announces a pending permission request', () => {
    const presentation = resolveCameraStatusPresentation({
      ...idleInput,
      status: 'requesting',
    });

    expect(presentation.title).toBe('Aguardando permissão');
    expect(presentation.tone).toBe('info');
    expect(presentation.shouldAnnounce).toBe(true);
    expect(presentation.animateIcon).toBe(true);
  });

  it('presents an active camera only when a live enabled track exists', () => {
    const active = resolveCameraStatusPresentation({
      ...idleInput,
      status: 'active',
      hasValidActiveTrack: true,
    });

    expect(active.title).toBe('Câmera ativa');
    expect(active.tone).toBe('success');

    const withoutTrack = resolveCameraStatusPresentation({
      ...idleInput,
      status: 'active',
    });

    expect(withoutTrack.title).toBe('Câmera desligada');
  });

  it('presents a paused camera only when a live disabled track exists', () => {
    const paused = resolveCameraStatusPresentation({
      ...idleInput,
      status: 'paused',
      hasValidPausedTrack: true,
    });

    expect(paused.title).toBe('Câmera pausada');
    expect(paused.tone).toBe('warning');
  });

  it('announces switching and restarting transitions', () => {
    expect(
      resolveCameraStatusPresentation({ ...idleInput, status: 'switching' })
        .title
    ).toBe('Trocando câmera');
    expect(
      resolveCameraStatusPresentation({ ...idleInput, status: 'restarting' })
        .title
    ).toBe('Reiniciando câmera');
  });

  it('does not replace an active preview with a device-list refresh', () => {
    const presentation = resolveCameraStatusPresentation({
      ...idleInput,
      status: 'active',
      hasValidActiveTrack: true,
      isRefreshingDevices: true,
    });

    expect(presentation.title).toBe('Câmera ativa');
  });

  it('shows a device refresh while idle and enumerating', () => {
    const presentation = resolveCameraStatusPresentation({
      ...idleInput,
      isRefreshingDevices: true,
    });

    expect(presentation.title).toBe('Atualizando câmeras');
  });

  it('maps permission, insecure context and unsupported errors', () => {
    expect(
      resolveCameraStatusPresentation({
        ...idleInput,
        status: 'denied',
        error: createCameraPresentationError('permission-denied'),
      }).title
    ).toBe('Permissão necessária');

    expect(
      resolveCameraStatusPresentation({
        ...idleInput,
        status: 'unavailable',
        error: createCameraPresentationError('insecure-context'),
      }).title
    ).toBe('Conexão segura necessária');

    expect(
      resolveCameraStatusPresentation({
        ...idleInput,
        status: 'unavailable',
        error: createCameraPresentationError('unsupported'),
      }).title
    ).toBe('Câmera não suportada');
  });

  it('announces an unexpected disconnection from idle', () => {
    const presentation = resolveCameraStatusPresentation({
      ...idleInput,
      error: createCameraPresentationError('device-disconnected'),
    });

    expect(presentation.title).toBe('Câmera desconectada');
    expect(presentation.shouldAnnounce).toBe(true);
  });

  it('reuses classified recoverable error copy', () => {
    const error = createCameraPresentationError('device-busy');
    const presentation = resolveCameraStatusPresentation({
      ...idleInput,
      status: 'error',
      error,
    });

    expect(presentation.title).toBe(error.title);
    expect(presentation.description).toBe(error.message);
    expect(presentation.tone).toBe('danger');
  });
});
