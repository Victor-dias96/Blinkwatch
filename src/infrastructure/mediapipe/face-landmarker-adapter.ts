import {
  createFaceLandmarkerOptions,
  FACE_LANDMARKER_MODEL_PATH,
  FACE_LANDMARKER_WASM_PATH,
} from '@/infrastructure/mediapipe/face-landmarker-config';
import type {
  FaceLandmarkerAdapter,
  FaceLandmarkerAdapterDependencies,
  FaceLandmarkerError,
  FaceLandmarkerErrorCode,
  FaceLandmarkerInitResult,
  FaceLandmarkerInstance,
  FaceLandmarkerLoadState,
  VisionTasksModule,
} from '@/infrastructure/mediapipe/types';

const USER_SAFE_ERROR_MESSAGES: Record<FaceLandmarkerErrorCode, string> = {
  'incompatible-environment':
    'O ambiente atual não permite carregar o modelo de visão.',
  'wasm-unavailable':
    'Os recursos WASM de visão computacional não puderam ser carregados.',
  'model-unavailable':
    'O modelo local de rastreamento facial não pôde ser carregado.',
  'task-creation-failed':
    'A tarefa de rastreamento facial não pôde ser criada.',
  'stale-initialization':
    'A inicialização foi cancelada porque o recurso já havia sido descartado.',
  unknown: 'Os recursos de visão computacional não puderam ser carregados.',
};

function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function createIdleState(): FaceLandmarkerLoadState {
  return { status: 'idle' };
}

function createError(
  code: FaceLandmarkerErrorCode,
  details?: string
): FaceLandmarkerError {
  return {
    code,
    message: details
      ? `${USER_SAFE_ERROR_MESSAGES[code]} ${sanitizeErrorDetails(details)}`.trim()
      : USER_SAFE_ERROR_MESSAGES[code],
  };
}

function sanitizeErrorDetails(details: string): string {
  return details
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/file:\/\/[^\s]+/gi, '')
    .replace(/\b[\w./-]+\.(?:wasm|task|js)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return '';
}

function isFaceLandmarkerError(error: unknown): error is FaceLandmarkerError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

function classifyCreateError(error: unknown): FaceLandmarkerError {
  const message = getErrorMessage(error).toLowerCase();

  if (
    message.includes('404') ||
    message.includes('failed to fetch') ||
    message.includes('not found') ||
    message.includes('no such file') ||
    message.includes('model')
  ) {
    return createError('model-unavailable', getErrorMessage(error));
  }

  return createError('task-creation-failed', getErrorMessage(error));
}

function closeInstance(instance: FaceLandmarkerInstance | null): void {
  if (!instance) {
    return;
  }

  try {
    instance.close();
  } catch {
    // Idempotent dispose: a second close or a closed instance must not throw.
  }
}

async function loadVisionTasksModule(): Promise<VisionTasksModule> {
  const vision = await import('@mediapipe/tasks-vision');

  return {
    FilesetResolver: vision.FilesetResolver,
    FaceLandmarker: vision.FaceLandmarker,
  } as VisionTasksModule;
}

function resolveAssetUrl(path: string, canUseWindow: boolean): string {
  if (
    !canUseWindow ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

export function createFaceLandmarkerAdapter(
  dependencies: FaceLandmarkerAdapterDependencies = {}
): FaceLandmarkerAdapter {
  const loadVisionTasks = dependencies.loadVisionTasks ?? loadVisionTasksModule;
  const wasmBasePath = dependencies.wasmBasePath ?? FACE_LANDMARKER_WASM_PATH;
  const modelAssetPath =
    dependencies.modelAssetPath ?? FACE_LANDMARKER_MODEL_PATH;
  const isBrowser = dependencies.isBrowserEnvironment ?? isBrowserEnvironment;

  let state: FaceLandmarkerLoadState = createIdleState();
  let instance: FaceLandmarkerInstance | null = null;
  let pending: Promise<FaceLandmarkerInitResult> | null = null;
  let generation = 0;
  const listeners = new Set<(next: FaceLandmarkerLoadState) => void>();

  function emit(next: FaceLandmarkerLoadState): void {
    state = next;

    for (const listener of listeners) {
      listener(state);
    }
  }

  function staleResult(): FaceLandmarkerInitResult {
    return {
      ok: false,
      error: createError('stale-initialization'),
    };
  }

  async function runInitialize(
    operationGeneration: number
  ): Promise<FaceLandmarkerInitResult> {
    try {
      if (!isBrowser()) {
        throw createError('incompatible-environment');
      }

      let vision: VisionTasksModule;

      try {
        vision = await loadVisionTasks();
      } catch (error) {
        throw createError('wasm-unavailable', getErrorMessage(error));
      }

      if (operationGeneration !== generation) {
        return staleResult();
      }

      let wasmFileset: unknown;

      try {
        wasmFileset = await vision.FilesetResolver.forVisionTasks(
          resolveAssetUrl(wasmBasePath, true)
        );
      } catch (error) {
        throw createError('wasm-unavailable', getErrorMessage(error));
      }

      if (operationGeneration !== generation) {
        return staleResult();
      }

      let created: FaceLandmarkerInstance;

      try {
        created = await vision.FaceLandmarker.createFromOptions(
          wasmFileset,
          createFaceLandmarkerOptions(resolveAssetUrl(modelAssetPath, true))
        );
      } catch (error) {
        throw classifyCreateError(error);
      }

      if (operationGeneration !== generation) {
        closeInstance(created);
        return staleResult();
      }

      instance = created;
      emit({ status: 'ready' });
      return { ok: true };
    } catch (error) {
      if (operationGeneration !== generation) {
        return staleResult();
      }

      const typedError = isFaceLandmarkerError(error)
        ? error
        : createError('unknown', getErrorMessage(error));

      emit({ status: 'failed', error: typedError });
      return { ok: false, error: typedError };
    } finally {
      if (operationGeneration === generation) {
        pending = null;
      }
    }
  }

  return {
    initialize() {
      if (state.status === 'ready' && instance) {
        return Promise.resolve({ ok: true });
      }

      if (pending) {
        return pending;
      }

      const operationGeneration = generation;
      emit({ status: 'loading' });
      pending = runInitialize(operationGeneration);
      return pending;
    },
    getState() {
      return state;
    },
    isReady() {
      return state.status === 'ready' && instance !== null;
    },
    dispose() {
      generation += 1;
      pending = null;
      closeInstance(instance);
      instance = null;

      if (state.status !== 'disposed') {
        emit({ status: 'disposed' });
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
