export type CameraStatus =
  'idle' | 'requesting' | 'active' | 'denied' | 'unavailable' | 'error';

export type CameraState = {
  status: CameraStatus;
  message: string | null;
};

export const CAMERA_STATUS_LABELS: Record<CameraStatus, string> = {
  idle: 'Câmera desligada',
  requesting: 'Aguardando permissão',
  active: 'Câmera ativa',
  denied: 'Permissão negada',
  unavailable: 'Câmera indisponível',
  error: 'Falha ao iniciar',
};

export function createCameraState(
  status: CameraStatus,
  message: string | null = null
): CameraState {
  return { status, message };
}

export function resolveDisplayCameraState(
  state: CameraState,
  mediaDevicesSupported: boolean,
  unavailableMessage: string
): CameraState {
  if (
    !mediaDevicesSupported &&
    (state.status === 'idle' || state.status === 'requesting')
  ) {
    return createCameraState('unavailable', unavailableMessage);
  }

  return state;
}
