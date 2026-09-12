import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFaceLandmarkerAdapter } from '@/infrastructure/mediapipe/face-landmarker-adapter';
import { FACE_LANDMARKER_MODEL_PATH } from '@/infrastructure/mediapipe/face-landmarker-config';
import type {
  FaceLandmarkerInstance,
  VisionTasksModule,
} from '@/infrastructure/mediapipe/types';

import { createDeferred } from '../../../tests/mocks/deferred';

function createVisionMocks() {
  const instance: FaceLandmarkerInstance & {
    detect: ReturnType<typeof vi.fn>;
    detectForVideo: ReturnType<typeof vi.fn>;
  } = {
    close: vi.fn(),
    detect: vi.fn(),
    detectForVideo: vi.fn(),
  };
  const wasmFileset = {
    wasmLoaderPath: '/wasm-loader',
    wasmBinaryPath: '/wasm',
  };
  const forVisionTasks = vi.fn().mockResolvedValue(wasmFileset);
  const createFromOptions = vi.fn().mockResolvedValue(instance);
  const loadVisionTasks = vi.fn(async (): Promise<VisionTasksModule> => {
    return {
      FilesetResolver: { forVisionTasks },
      FaceLandmarker: { createFromOptions },
    };
  });

  return {
    instance,
    wasmFileset,
    forVisionTasks,
    createFromOptions,
    loadVisionTasks,
  };
}

function createTestAdapter(
  mocks: ReturnType<typeof createVisionMocks>,
  overrides: Parameters<typeof createFaceLandmarkerAdapter>[0] = {}
) {
  return createFaceLandmarkerAdapter({
    loadVisionTasks: mocks.loadVisionTasks,
    isBrowserEnvironment: () => true,
    ...overrides,
  });
}

describe('createFaceLandmarkerAdapter', () => {
  let mocks: ReturnType<typeof createVisionMocks>;

  beforeEach(() => {
    mocks = createVisionMocks();
  });

  it('starts idle without loading vision resources', () => {
    const adapter = createTestAdapter(mocks);

    expect(adapter.getState()).toEqual({ status: 'idle' });
    expect(adapter.isReady()).toBe(false);
    expect(mocks.loadVisionTasks).not.toHaveBeenCalled();
    expect(mocks.forVisionTasks).not.toHaveBeenCalled();
    expect(mocks.createFromOptions).not.toHaveBeenCalled();
  });

  it('does not initialize when the adapter module is imported', async () => {
    await import('@/infrastructure/mediapipe/face-landmarker-adapter');

    expect(mocks.loadVisionTasks).not.toHaveBeenCalled();
    expect(mocks.forVisionTasks).not.toHaveBeenCalled();
    expect(mocks.createFromOptions).not.toHaveBeenCalled();
  });

  it('initializes with VIDEO mode, one face, and disabled extra outputs', async () => {
    const adapter = createTestAdapter(mocks);
    const result = await adapter.initialize();

    expect(result).toEqual({ ok: true });
    expect(adapter.getState()).toEqual({ status: 'ready' });
    expect(adapter.isReady()).toBe(true);
    expect(mocks.forVisionTasks).toHaveBeenCalledTimes(1);
    expect(mocks.forVisionTasks.mock.calls[0]?.[0]).toContain(
      '/mediapipe/wasm'
    );
    expect(mocks.createFromOptions).toHaveBeenCalledTimes(1);
    expect(mocks.createFromOptions).toHaveBeenCalledWith(
      mocks.wasmFileset,
      expect.objectContaining({
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        baseOptions: expect.objectContaining({
          delegate: 'GPU',
          modelAssetPath: expect.stringContaining(FACE_LANDMARKER_MODEL_PATH),
        }),
      })
    );
    expect(mocks.instance.detect).not.toHaveBeenCalled();
    expect(mocks.instance.detectForVideo).not.toHaveBeenCalled();
  });

  it('reuses the in-flight promise instead of creating two instances', async () => {
    const deferred = createDeferred<VisionTasksModule>();
    mocks.loadVisionTasks.mockReturnValueOnce(deferred.promise);
    const adapter = createTestAdapter(mocks);

    const first = adapter.initialize();
    const second = adapter.initialize();

    expect(adapter.getState()).toEqual({ status: 'loading' });
    expect(mocks.loadVisionTasks).toHaveBeenCalledTimes(1);
    expect(mocks.forVisionTasks).not.toHaveBeenCalled();

    deferred.resolve({
      FilesetResolver: { forVisionTasks: mocks.forVisionTasks },
      FaceLandmarker: { createFromOptions: mocks.createFromOptions },
    });
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toEqual({ ok: true });
    expect(secondResult).toEqual({ ok: true });
    expect(mocks.forVisionTasks).toHaveBeenCalledTimes(1);
    expect(mocks.createFromOptions).toHaveBeenCalledTimes(1);
    expect(adapter.isReady()).toBe(true);
  });

  it('does not recreate a ready instance', async () => {
    const adapter = createTestAdapter(mocks);
    await adapter.initialize();
    mocks.forVisionTasks.mockClear();
    mocks.createFromOptions.mockClear();
    mocks.loadVisionTasks.mockClear();

    const result = await adapter.initialize();

    expect(result).toEqual({ ok: true });
    expect(mocks.loadVisionTasks).not.toHaveBeenCalled();
    expect(mocks.forVisionTasks).not.toHaveBeenCalled();
    expect(mocks.createFromOptions).not.toHaveBeenCalled();
    expect(adapter.getState()).toEqual({ status: 'ready' });
  });

  it('marks failed when FilesetResolver cannot load WASM', async () => {
    mocks.forVisionTasks.mockRejectedValueOnce(new Error('wasm missing'));
    const adapter = createTestAdapter(mocks);
    const result = await adapter.initialize();

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected initialization to fail');
    }
    expect(result.error.code).toBe('wasm-unavailable');
    expect(adapter.getState()).toEqual({
      status: 'failed',
      error: result.error,
    });
    expect(adapter.isReady()).toBe(false);
    expect(mocks.createFromOptions).not.toHaveBeenCalled();
  });

  it('marks failed when the model cannot be loaded', async () => {
    mocks.createFromOptions.mockRejectedValueOnce(
      new Error('Failed to fetch model 404 Not Found')
    );
    const adapter = createTestAdapter(mocks);
    const result = await adapter.initialize();

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected initialization to fail');
    }
    expect(result.error.code).toBe('model-unavailable');
    expect(adapter.getState().status).toBe('failed');
  });

  it('retries after a failed initialization', async () => {
    mocks.forVisionTasks.mockRejectedValueOnce(new Error('wasm missing'));
    const adapter = createTestAdapter(mocks);

    await adapter.initialize();
    expect(adapter.getState().status).toBe('failed');

    mocks.forVisionTasks.mockResolvedValueOnce(mocks.wasmFileset);
    const result = await adapter.initialize();

    expect(result).toEqual({ ok: true });
    expect(adapter.getState()).toEqual({ status: 'ready' });
    expect(mocks.createFromOptions).toHaveBeenCalledTimes(1);
  });

  it('calls the official close method on dispose', async () => {
    const adapter = createTestAdapter(mocks);
    await adapter.initialize();

    adapter.dispose();

    expect(mocks.instance.close).toHaveBeenCalledTimes(1);
    expect(adapter.getState()).toEqual({ status: 'disposed' });
    expect(adapter.isReady()).toBe(false);
  });

  it('can dispose twice without throwing', async () => {
    const adapter = createTestAdapter(mocks);
    await adapter.initialize();

    adapter.dispose();
    expect(() => adapter.dispose()).not.toThrow();
    expect(mocks.instance.close).toHaveBeenCalledTimes(1);
    expect(adapter.getState()).toEqual({ status: 'disposed' });
  });

  it('discards a late createFromOptions result after dispose', async () => {
    const deferred = createDeferred<FaceLandmarkerInstance>();
    mocks.createFromOptions.mockReturnValueOnce(deferred.promise);
    const adapter = createTestAdapter(mocks);
    const resultPromise = adapter.initialize();

    await vi.waitFor(() => {
      expect(mocks.createFromOptions).toHaveBeenCalledTimes(1);
    });

    adapter.dispose();
    deferred.resolve(mocks.instance);

    const result = await resultPromise;

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected stale initialization to fail');
    }
    expect(result.error.code).toBe('stale-initialization');
    expect(mocks.instance.close).toHaveBeenCalledTimes(1);
    expect(adapter.getState()).toEqual({ status: 'disposed' });
    expect(adapter.isReady()).toBe(false);
    expect(mocks.instance.detect).not.toHaveBeenCalled();
    expect(mocks.instance.detectForVideo).not.toHaveBeenCalled();
  });

  it('does not continue WASM loading after dispose', async () => {
    const deferred = createDeferred<unknown>();
    mocks.forVisionTasks.mockReturnValueOnce(deferred.promise);
    const adapter = createTestAdapter(mocks);
    const resultPromise = adapter.initialize();

    adapter.dispose();
    deferred.resolve(mocks.wasmFileset);

    const result = await resultPromise;

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected stale initialization to fail');
    }
    expect(result.error.code).toBe('stale-initialization');
    expect(mocks.createFromOptions).not.toHaveBeenCalled();
    expect(adapter.getState()).toEqual({ status: 'disposed' });
  });

  it('allows a new initialization after dispose', async () => {
    const adapter = createTestAdapter(mocks);
    await adapter.initialize();
    adapter.dispose();

    const secondInstance = {
      close: vi.fn(),
      detect: vi.fn(),
      detectForVideo: vi.fn(),
    };
    mocks.createFromOptions.mockResolvedValueOnce(secondInstance);

    const result = await adapter.initialize();

    expect(result).toEqual({ ok: true });
    expect(adapter.getState()).toEqual({ status: 'ready' });
    expect(mocks.createFromOptions).toHaveBeenCalledTimes(2);
  });

  it('does not load vision tasks outside the browser', async () => {
    const adapter = createTestAdapter(mocks, {
      isBrowserEnvironment: () => false,
    });
    const result = await adapter.initialize();

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected initialization to fail');
    }
    expect(result.error.code).toBe('incompatible-environment');
    expect(mocks.loadVisionTasks).not.toHaveBeenCalled();
    expect(adapter.getState().status).toBe('failed');
  });

  it('treats task creation errors without leaking detection calls', async () => {
    mocks.createFromOptions.mockRejectedValueOnce(
      new Error('WebGL unavailable')
    );
    const adapter = createTestAdapter(mocks);
    const result = await adapter.initialize();

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected initialization to fail');
    }
    expect(result.error.code).toBe('task-creation-failed');
    expect(mocks.instance.detect).not.toHaveBeenCalled();
    expect(mocks.instance.detectForVideo).not.toHaveBeenCalled();
  });
});
