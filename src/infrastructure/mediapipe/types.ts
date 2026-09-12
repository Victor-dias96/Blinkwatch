export type FaceLandmarkerLoadStatus =
  'idle' | 'loading' | 'ready' | 'failed' | 'disposed';

export type FaceLandmarkerErrorCode =
  | 'incompatible-environment'
  | 'wasm-unavailable'
  | 'model-unavailable'
  | 'task-creation-failed'
  | 'stale-initialization'
  | 'unknown';

export type FaceLandmarkerError = {
  code: FaceLandmarkerErrorCode;
  message: string;
};

export type FaceLandmarkerLoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'failed'; error: FaceLandmarkerError }
  | { status: 'disposed' };

export type FaceLandmarkerInitResult =
  { ok: true } | { ok: false; error: FaceLandmarkerError };

export type FaceLandmarkerInstance = {
  close: () => void;
};

export type VisionTasksModule = {
  FilesetResolver: {
    forVisionTasks(basePath: string): Promise<unknown>;
  };
  FaceLandmarker: {
    createFromOptions(
      wasmFileset: unknown,
      options: unknown
    ): Promise<FaceLandmarkerInstance>;
  };
};

export type FaceLandmarkerAdapterDependencies = {
  loadVisionTasks?: () => Promise<VisionTasksModule>;
  wasmBasePath?: string;
  modelAssetPath?: string;
  isBrowserEnvironment?: () => boolean;
};

export type FaceLandmarkerAdapter = {
  initialize: () => Promise<FaceLandmarkerInitResult>;
  getState: () => FaceLandmarkerLoadState;
  isReady: () => boolean;
  dispose: () => void;
  subscribe: (listener: (state: FaceLandmarkerLoadState) => void) => () => void;
};
