import {
  type CameraState,
  type CameraStatus,
  createCameraState,
} from '@/features/camera/types/camera-state';

export type CameraErrorCode =
  | 'unsupported'
  | 'insecure-context'
  | 'permission-denied'
  | 'permission-blocked'
  | 'device-not-found'
  | 'device-busy'
  | 'constraints-not-supported'
  | 'request-aborted'
  | 'inactive-document'
  | 'device-disconnected'
  | 'enumeration-failed'
  | 'switch-failed'
  | 'playback-failed'
  | 'unknown';

export type CameraErrorSeverity = 'info' | 'warning' | 'error';

export type CameraPresentationError = {
  code: CameraErrorCode;
  title: string;
  message: string;
  recovery: string | null;
  canRetry: boolean;
  severity: CameraErrorSeverity;
};

type CameraErrorDefinition = Omit<CameraPresentationError, 'code'>;

const CAMERA_ERROR_DEFINITIONS: Record<CameraErrorCode, CameraErrorDefinition> =
  {
    unsupported: {
      title: 'Câmera indisponível',
      message:
        'Este navegador ou ambiente não oferece suporte ao acesso à câmera.',
      recovery: 'Tente utilizar uma versão atual de um navegador compatível.',
      canRetry: false,
      severity: 'error',
    },
    'insecure-context': {
      title: 'Conexão insegura',
      message:
        'O acesso à câmera exige uma conexão segura. Utilize HTTPS ou execute o projeto em localhost.',
      recovery: null,
      canRetry: false,
      severity: 'error',
    },
    'permission-denied': {
      title: 'Permissão indisponível',
      message:
        'Não foi possível acessar a câmera porque a permissão não está disponível.',
      recovery:
        'Revise a permissão da câmera nas configurações do navegador e tente novamente.',
      canRetry: true,
      severity: 'error',
    },
    'permission-blocked': {
      title: 'Permissão bloqueada',
      message:
        'A permissão da câmera está bloqueada nas configurações do navegador.',
      recovery:
        'Abra as configurações do site, localize a permissão da câmera, permita o acesso e retorne para tentar novamente.',
      canRetry: false,
      severity: 'error',
    },
    'device-not-found': {
      title: 'Câmera não encontrada',
      message: 'Nenhuma câmera compatível foi encontrada neste dispositivo.',
      recovery: 'Verifique se uma câmera está conectada e tente novamente.',
      canRetry: true,
      severity: 'error',
    },
    'device-busy': {
      title: 'Câmera indisponível',
      message:
        'A câmera não pôde ser iniciada. Outro aplicativo ou aba pode estar utilizando o dispositivo.',
      recovery:
        'Feche outros aplicativos ou abas que possam estar usando a câmera e tente novamente.',
      canRetry: true,
      severity: 'error',
    },
    'constraints-not-supported': {
      title: 'Configuração incompatível',
      message: 'A câmera selecionada não atende à configuração solicitada.',
      recovery: 'Selecione outra câmera ou tente novamente.',
      canRetry: true,
      severity: 'error',
    },
    'request-aborted': {
      title: 'Ativação interrompida',
      message: 'A ativação da câmera foi interrompida antes de ser concluída.',
      recovery: 'Tente ativar a câmera novamente.',
      canRetry: true,
      severity: 'warning',
    },
    'inactive-document': {
      title: 'Página inativa',
      message:
        'A câmera não pôde ser iniciada porque esta página não está ativa.',
      recovery: 'Retorne para esta aba e tente novamente.',
      canRetry: true,
      severity: 'warning',
    },
    'device-disconnected': {
      title: 'Câmera desconectada',
      message: 'A câmera em uso foi desconectada ou deixou de responder.',
      recovery: 'Conecte a câmera novamente ou selecione outro dispositivo.',
      canRetry: true,
      severity: 'error',
    },
    'enumeration-failed': {
      title: 'Lista de câmeras indisponível',
      message: 'A lista de câmeras não pôde ser carregada.',
      recovery:
        'A prévia continua ativa. Você pode atualizar a lista ou continuar com a câmera atual.',
      canRetry: true,
      severity: 'warning',
    },
    'switch-failed': {
      title: 'Troca de câmera não concluída',
      message:
        'Não foi possível utilizar a câmera selecionada. A câmera anterior continua ativa.',
      recovery: 'Selecione outra câmera ou tente novamente.',
      canRetry: true,
      severity: 'warning',
    },
    'playback-failed': {
      title: 'Prévia indisponível',
      message: 'A câmera foi acessada, mas a prévia não pôde ser exibida.',
      recovery: 'Tente ativar a câmera novamente.',
      canRetry: true,
      severity: 'error',
    },
    unknown: {
      title: 'Falha na câmera',
      message: 'Não foi possível concluir a operação com a câmera.',
      recovery: 'Tente novamente ou volte à etapa anterior.',
      canRetry: true,
      severity: 'error',
    },
  };

export function createCameraPresentationError(
  code: CameraErrorCode,
  overrides: Partial<CameraErrorDefinition> = {}
): CameraPresentationError {
  const definition = CAMERA_ERROR_DEFINITIONS[code];

  return {
    code,
    title: overrides.title ?? definition.title,
    message: overrides.message ?? definition.message,
    recovery: overrides.recovery ?? definition.recovery,
    canRetry: overrides.canRetry ?? definition.canRetry,
    severity: overrides.severity ?? definition.severity,
  };
}

export function isSecureBrowserContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext;
}

export function isMediaDevicesApiAvailable(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

type CameraPermissionState = 'granted' | 'denied' | 'prompt';

/**
 * Progressive enhancement: query camera permission when supported.
 * Returns null when the Permissions API is unavailable or the query fails.
 */
export async function queryCameraPermissionState(): Promise<CameraPermissionState | null> {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.permissions?.query !== 'function'
  ) {
    return null;
  }

  try {
    const result = await navigator.permissions.query({
      name: 'camera' as PermissionName,
    });

    if (
      result.state === 'granted' ||
      result.state === 'denied' ||
      result.state === 'prompt'
    ) {
      return result.state;
    }

    return null;
  } catch {
    return null;
  }
}

function isDomException(value: unknown): value is DOMException {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof (value as { name: unknown }).name === 'string'
  );
}

function logCameraErrorForDevelopment(
  code: CameraErrorCode,
  errorName?: string
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (errorName) {
    console.warn(`[camera:${code}] ${errorName}`);
    return;
  }

  console.warn(`[camera:${code}]`);
}

export function classifyDomExceptionName(name: string): CameraErrorCode {
  switch (name) {
    case 'NotAllowedError':
      return 'permission-denied';
    case 'NotFoundError':
      return 'device-not-found';
    case 'NotReadableError':
      return 'device-busy';
    case 'OverconstrainedError':
      return 'constraints-not-supported';
    case 'AbortError':
      return 'request-aborted';
    case 'InvalidStateError':
      return 'inactive-document';
    case 'SecurityError':
      return 'permission-denied';
    default:
      return 'unknown';
  }
}

function resolveNotAllowedErrorCode(
  permissionState: CameraPermissionState | null
): CameraErrorCode {
  if (!isSecureBrowserContext()) {
    return 'insecure-context';
  }

  if (!isMediaDevicesApiAvailable()) {
    return 'unsupported';
  }

  if (permissionState === 'denied') {
    return 'permission-blocked';
  }

  return 'permission-denied';
}

function resolveSecurityErrorCode(): CameraErrorCode {
  if (!isSecureBrowserContext()) {
    return 'insecure-context';
  }

  return 'permission-denied';
}

export function classifyUnknownError(
  error: unknown,
  permissionState: CameraPermissionState | null = null
): CameraErrorCode {
  if (isDomException(error)) {
    if (error.name === 'NotAllowedError') {
      return resolveNotAllowedErrorCode(permissionState);
    }

    if (error.name === 'SecurityError') {
      return resolveSecurityErrorCode();
    }

    return classifyDomExceptionName(error.name);
  }

  if (error instanceof TypeError) {
    if (!isSecureBrowserContext()) {
      return 'insecure-context';
    }

    if (!isMediaDevicesApiAvailable()) {
      return 'unsupported';
    }

    logCameraErrorForDevelopment('unknown', 'TypeError');
    return 'unknown';
  }

  if (error instanceof Error) {
    logCameraErrorForDevelopment('unknown', error.name);
    return 'unknown';
  }

  logCameraErrorForDevelopment('unknown');
  return 'unknown';
}

export function mapErrorCodeToCameraStatus(
  code: CameraErrorCode
): CameraStatus {
  switch (code) {
    case 'permission-denied':
    case 'permission-blocked':
      return 'denied';
    case 'unsupported':
    case 'insecure-context':
    case 'device-not-found':
      return 'unavailable';
    case 'device-disconnected':
      return 'idle';
    default:
      return 'error';
  }
}

export function createCameraStateFromError(
  error: CameraPresentationError
): CameraState {
  return createCameraState(mapErrorCodeToCameraStatus(error.code), error);
}

export async function classifyGetUserMediaError(
  error: unknown
): Promise<CameraPresentationError> {
  const permissionState = await queryCameraPermissionState();
  const code = classifyUnknownError(error, permissionState);

  logCameraErrorForDevelopment(
    code,
    isDomException(error) ? error.name : undefined
  );

  return createCameraPresentationError(code);
}

export function classifySwitchDeviceError(
  error: unknown,
  streamPreserved: boolean
): CameraPresentationError {
  const underlyingCode = classifyUnknownError(error);

  if (streamPreserved) {
    const presentation = createCameraPresentationError('switch-failed');

    logCameraErrorForDevelopment(
      presentation.code,
      isDomException(error) ? error.name : undefined
    );

    return presentation;
  }

  const code =
    underlyingCode === 'device-not-found' ||
    underlyingCode === 'device-busy' ||
    underlyingCode === 'constraints-not-supported'
      ? underlyingCode
      : 'unknown';

  logCameraErrorForDevelopment(
    code,
    isDomException(error) ? error.name : undefined
  );

  return createCameraPresentationError(code);
}

export function createPreActivationError(
  code: 'unsupported' | 'insecure-context'
): CameraPresentationError {
  return createCameraPresentationError(code);
}

export function createEnumerationFailedError(): CameraPresentationError {
  return createCameraPresentationError('enumeration-failed');
}

export function createDeviceDisconnectedError(): CameraPresentationError {
  return createCameraPresentationError('device-disconnected');
}

export function createPlaybackFailedError(): CameraPresentationError {
  return createCameraPresentationError('playback-failed');
}

export function createUnexpectedAudioTrackError(): CameraPresentationError {
  return createCameraPresentationError('unknown', {
    message: 'Não foi possível ativar a câmera com a configuração esperada.',
    recovery: 'Tente novamente ou volte à etapa anterior.',
  });
}

export function isMissingDeviceError(error: unknown): boolean {
  const code = classifyUnknownError(error);
  return code === 'device-not-found' || code === 'constraints-not-supported';
}

export function createDeviceUnavailableRestartWarning(): CameraPresentationError {
  return createCameraPresentationError('device-not-found', {
    title: 'Câmera anterior indisponível',
    message: 'A câmera selecionada não está mais disponível.',
    recovery: 'A câmera padrão foi utilizada neste reinício.',
    severity: 'warning',
    canRetry: false,
  });
}
