import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FaceLandmarkerLoadState } from '@/infrastructure/mediapipe/types';

import {
  type BrowserMediaMocks,
  installBrowserMediaMocks,
} from '../../../../tests/mocks/browser-media';
import {
  renderCameraPreview,
  restoreCameraPreviewMocks,
  startCamera,
} from '../tests/camera-preview-helpers';

const adapterMocks = vi.hoisted(() => {
  let state: FaceLandmarkerLoadState = { status: 'idle' };
  const listeners = new Set<(next: FaceLandmarkerLoadState) => void>();

  function emit(next: FaceLandmarkerLoadState) {
    state = next;
    for (const listener of listeners) {
      listener(state);
    }
  }

  return {
    initialize: vi.fn(async () => {
      emit({ status: 'loading' });
      emit({ status: 'ready' });
      return { ok: true as const };
    }),
    dispose: vi.fn(() => {
      emit({ status: 'disposed' });
    }),
    getState: vi.fn(() => state),
    isReady: vi.fn(() => state.status === 'ready'),
    subscribe: vi.fn((listener: (next: FaceLandmarkerLoadState) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }),
    reset() {
      state = { status: 'idle' };
      listeners.clear();
      this.initialize.mockClear();
      this.dispose.mockClear();
    },
  };
});

vi.mock('@/infrastructure/mediapipe/face-landmarker-adapter', () => ({
  createFaceLandmarkerAdapter: () => ({
    initialize: adapterMocks.initialize,
    dispose: adapterMocks.dispose,
    getState: adapterMocks.getState,
    isReady: adapterMocks.isReady,
    subscribe: adapterMocks.subscribe,
  }),
}));

describe('CameraPreview face landmarker diagnostics', () => {
  let mocks: BrowserMediaMocks;

  beforeEach(() => {
    adapterMocks.reset();
    mocks = installBrowserMediaMocks();
  });

  afterEach(() => {
    restoreCameraPreviewMocks(mocks);
  });

  it('does not load the model before an explicit prepare action', () => {
    renderCameraPreview();

    expect(
      screen.queryByRole('button', { name: 'Preparar rastreamento facial' })
    ).not.toBeInTheDocument();
    expect(adapterMocks.initialize).not.toHaveBeenCalled();
  });

  it('shows the prepare action only when the camera is active and live', async () => {
    const { user } = renderCameraPreview();

    await startCamera(user);

    expect(
      screen.getByRole('button', { name: 'Preparar rastreamento facial' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pausar' }));

    expect(
      screen.queryByRole('button', { name: 'Preparar rastreamento facial' })
    ).not.toBeInTheDocument();
    expect(adapterMocks.initialize).not.toHaveBeenCalled();
  });

  it('loads the landmarker only after the diagnostic action and does not call detection', async () => {
    const { user } = renderCameraPreview();
    await startCamera(user);

    await user.click(
      screen.getByRole('button', { name: 'Preparar rastreamento facial' })
    );

    expect(adapterMocks.initialize).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole('heading', { name: 'Rastreamento preparado' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'O modelo foi carregado. Nenhum frame está sendo analisado nesta etapa.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Preparar rastreamento facial' })
    ).not.toBeInTheDocument();
  });

  it('disposes the landmarker when the camera is stopped', async () => {
    const { user } = renderCameraPreview();
    await startCamera(user);
    await user.click(
      screen.getByRole('button', { name: 'Preparar rastreamento facial' })
    );

    adapterMocks.dispose.mockClear();
    await user.click(screen.getByRole('button', { name: 'Encerrar câmera' }));

    expect(adapterMocks.dispose).toHaveBeenCalled();
    expect(
      screen.queryByRole('heading', { name: 'Rastreamento preparado' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Preparar rastreamento facial' })
    ).not.toBeInTheDocument();
  });
});
