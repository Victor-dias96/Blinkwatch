import type { CameraPresentationError } from '@/features/camera/errors/camera-error';

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
