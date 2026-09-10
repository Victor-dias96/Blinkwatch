import {
  type CameraState,
  createCameraState,
} from '@/features/camera/types/camera-state';

export const VIDEO_ONLY_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: 'user' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
};

export function isMediaDevicesSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

export function createDeviceVideoConstraints(
  deviceId: string
): MediaStreamConstraints {
  return {
    video: {
      deviceId: {
        exact: deviceId,
      },
    },
    audio: false,
  };
}

export function requestVideoStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia(VIDEO_ONLY_CONSTRAINTS);
}

export function requestVideoStreamForDevice(
  deviceId: string
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia(
    createDeviceVideoConstraints(deviceId)
  );
}

export function stopMediaStream(
  stream: MediaStream | null,
  videoElement: HTMLVideoElement | null = null
): void {
  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }

  if (videoElement) {
    videoElement.srcObject = null;
  }
}

export async function attachStreamToVideo(
  videoElement: HTMLVideoElement,
  stream: MediaStream
): Promise<void> {
  videoElement.srcObject = stream;

  try {
    await videoElement.play();
  } catch {
    throw new Error('Não foi possível reproduzir a prévia da câmera.');
  }
}

export function classifyGetUserMediaError(error: unknown): CameraState {
  if (!(error instanceof DOMException)) {
    return createCameraState(
      'error',
      'Não foi possível ativar a câmera. Tente novamente.'
    );
  }

  switch (error.name) {
    case 'NotAllowedError':
      return createCameraState(
        'denied',
        'O acesso à câmera foi negado. Você pode revisar a permissão do navegador e tentar novamente.'
      );
    case 'NotFoundError':
      return createCameraState(
        'unavailable',
        'Nenhuma câmera compatível foi encontrada neste dispositivo.'
      );
    case 'NotReadableError':
      return createCameraState(
        'error',
        'A câmera não pôde ser iniciada. Outro aplicativo pode estar utilizando o dispositivo.'
      );
    case 'OverconstrainedError':
      return createCameraState(
        'error',
        'A câmera disponível não atende à configuração solicitada.'
      );
    case 'AbortError':
      return createCameraState(
        'error',
        'A ativação da câmera foi interrompida. Tente novamente.'
      );
    case 'SecurityError':
      return createCameraState(
        'unavailable',
        'O acesso à câmera requer um contexto seguro (HTTPS) ou localhost, além de um navegador compatível.'
      );
    default:
      return createCameraState(
        'error',
        'Não foi possível ativar a câmera. Tente novamente.'
      );
  }
}

export const MEDIA_DEVICES_UNAVAILABLE_MESSAGE =
  'Seu navegador não disponibiliza acesso à câmera neste contexto. Utilize um navegador compatível e, se necessário, acesse por HTTPS ou localhost.';

export function classifySwitchDeviceError(error: unknown): string {
  if (!(error instanceof DOMException)) {
    return 'Não foi possível trocar de câmera. A câmera anterior continuará ativa.';
  }

  switch (error.name) {
    case 'NotFoundError':
      return 'A câmera selecionada não está mais disponível.';
    case 'NotReadableError':
      return 'A câmera selecionada não pôde ser iniciada. Outro aplicativo pode estar utilizando o dispositivo.';
    case 'OverconstrainedError':
      return 'A câmera selecionada não pôde atender à configuração solicitada.';
    case 'NotAllowedError':
      return 'O navegador não permitiu utilizar a câmera selecionada.';
    default:
      return 'Não foi possível trocar de câmera. A câmera anterior continuará ativa.';
  }
}
