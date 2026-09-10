import {
  type CameraPresentationError,
  createPreActivationError,
  isMediaDevicesApiAvailable,
  isSecureBrowserContext,
} from '@/features/camera/errors/camera-error';

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'paused'
  | 'restarting'
  | 'switching'
  | 'denied'
  | 'unavailable'
  | 'error';

export type CameraState = {
  status: CameraStatus;
  error: CameraPresentationError | null;
};

export function createCameraState(
  status: CameraStatus,
  error: CameraPresentationError | null = null
): CameraState {
  return { status, error };
}

export function resolveDisplayCameraState(state: CameraState): CameraState {
  if (state.status === 'idle' || state.status === 'requesting') {
    if (!isSecureBrowserContext()) {
      return createCameraState(
        'unavailable',
        createPreActivationError('insecure-context')
      );
    }

    if (!isMediaDevicesApiAvailable()) {
      return createCameraState(
        'unavailable',
        createPreActivationError('unsupported')
      );
    }
  }

  return state;
}
