import type { LucideIcon } from 'lucide-react';
import {
  LoaderCircle,
  Pause,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
  Video,
  VideoOff,
} from 'lucide-react';

import type { CameraPresentationError } from '@/features/camera/errors/camera-error';
import type { CameraStatus } from '@/features/camera/types/camera-state';

export type CameraStatusTone =
  'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type CameraStatusPresentation = {
  title: string;
  description: string;
  tone: CameraStatusTone;
  icon: LucideIcon;
  animateIcon: boolean;
  shouldAnnounce: boolean;
};

export type ResolveCameraStatusInput = {
  status: CameraStatus;
  error: CameraPresentationError | null;
  hasValidActiveTrack: boolean;
  hasValidPausedTrack: boolean;
  isRefreshingDevices: boolean;
};

type StaticPresentation = Omit<CameraStatusPresentation, 'shouldAnnounce'>;

const IDLE_PRESENTATION: StaticPresentation = {
  title: 'Câmera desligada',
  description: 'Inicie a câmera quando estiver pronto para continuar.',
  tone: 'neutral',
  icon: VideoOff,
  animateIcon: false,
};

const REQUESTING_PRESENTATION: StaticPresentation = {
  title: 'Aguardando permissão',
  description: 'Responda à solicitação apresentada pelo navegador.',
  tone: 'info',
  icon: LoaderCircle,
  animateIcon: true,
};

const ACTIVE_PRESENTATION: StaticPresentation = {
  title: 'Câmera ativa',
  description: 'A prévia está sendo exibida apenas neste dispositivo.',
  tone: 'success',
  icon: Video,
  animateIcon: false,
};

const PAUSED_PRESENTATION: StaticPresentation = {
  title: 'Câmera pausada',
  description: 'A imagem está temporariamente suspensa. Retome para continuar.',
  tone: 'warning',
  icon: Pause,
  animateIcon: false,
};

const SWITCHING_PRESENTATION: StaticPresentation = {
  title: 'Trocando câmera',
  description: 'Preparando o dispositivo selecionado.',
  tone: 'info',
  icon: RefreshCw,
  animateIcon: true,
};

const RESTARTING_PRESENTATION: StaticPresentation = {
  title: 'Reiniciando câmera',
  description: 'Criando uma nova conexão com o dispositivo.',
  tone: 'info',
  icon: RefreshCw,
  animateIcon: true,
};

const REFRESHING_DEVICES_PRESENTATION: StaticPresentation = {
  title: 'Atualizando câmeras',
  description: 'Buscando os dispositivos de vídeo disponíveis.',
  tone: 'info',
  icon: LoaderCircle,
  animateIcon: true,
};

const PERMISSION_REQUIRED_PRESENTATION: StaticPresentation = {
  title: 'Permissão necessária',
  description:
    'Revise a permissão da câmera no navegador antes de tentar novamente.',
  tone: 'danger',
  icon: ShieldAlert,
  animateIcon: false,
};

const SECURE_CONTEXT_PRESENTATION: StaticPresentation = {
  title: 'Conexão segura necessária',
  description: 'Utilize HTTPS ou localhost para permitir o acesso à câmera.',
  tone: 'danger',
  icon: ShieldAlert,
  animateIcon: false,
};

const API_UNAVAILABLE_PRESENTATION: StaticPresentation = {
  title: 'Câmera não suportada',
  description:
    'Este navegador ou ambiente não disponibiliza o acesso necessário à câmera.',
  tone: 'danger',
  icon: TriangleAlert,
  animateIcon: false,
};

const DEVICE_UNAVAILABLE_PRESENTATION: StaticPresentation = {
  title: 'Câmera indisponível',
  description:
    'Nenhuma câmera compatível foi encontrada ou o dispositivo não está acessível.',
  tone: 'danger',
  icon: TriangleAlert,
  animateIcon: false,
};

const DEVICE_DISCONNECTED_PRESENTATION: StaticPresentation = {
  title: 'Câmera desconectada',
  description: 'O dispositivo em uso foi removido ou deixou de responder.',
  tone: 'danger',
  icon: TriangleAlert,
  animateIcon: false,
};

function withAnnouncement(
  presentation: StaticPresentation,
  shouldAnnounce = true
): CameraStatusPresentation {
  return { ...presentation, shouldAnnounce };
}

function presentationFromError(
  error: CameraPresentationError
): StaticPresentation {
  switch (error.code) {
    case 'insecure-context':
      return SECURE_CONTEXT_PRESENTATION;
    case 'unsupported':
      return API_UNAVAILABLE_PRESENTATION;
    case 'permission-denied':
    case 'permission-blocked':
      return PERMISSION_REQUIRED_PRESENTATION;
    case 'device-not-found':
    case 'device-busy':
    case 'constraints-not-supported':
      return {
        ...DEVICE_UNAVAILABLE_PRESENTATION,
        title: error.title,
        description: error.message,
      };
    case 'device-disconnected':
      return DEVICE_DISCONNECTED_PRESENTATION;
    default:
      return {
        title: error.title,
        description: error.message,
        tone: error.severity === 'warning' ? 'warning' : 'danger',
        icon: TriangleAlert,
        animateIcon: false,
      };
  }
}

function isPermissionError(error: CameraPresentationError): boolean {
  return (
    error.code === 'permission-denied' || error.code === 'permission-blocked'
  );
}

function isEnvironmentError(error: CameraPresentationError): boolean {
  return error.code === 'insecure-context' || error.code === 'unsupported';
}

function isDeviceUnavailableError(error: CameraPresentationError): boolean {
  return (
    error.code === 'device-not-found' ||
    error.code === 'device-busy' ||
    error.code === 'constraints-not-supported'
  );
}

function resolveErrorPresentation(
  error: CameraPresentationError
): StaticPresentation {
  if (isEnvironmentError(error)) {
    return presentationFromError(error);
  }

  if (isPermissionError(error)) {
    return PERMISSION_REQUIRED_PRESENTATION;
  }

  if (error.code === 'device-disconnected') {
    return DEVICE_DISCONNECTED_PRESENTATION;
  }

  if (isDeviceUnavailableError(error)) {
    return {
      ...DEVICE_UNAVAILABLE_PRESENTATION,
      title: error.title,
      description: error.message,
    };
  }

  return presentationFromError(error);
}

function shouldShowRefreshingDevices(input: ResolveCameraStatusInput): boolean {
  const {
    isRefreshingDevices,
    status,
    hasValidActiveTrack,
    hasValidPausedTrack,
  } = input;

  if (!isRefreshingDevices) {
    return false;
  }

  if (hasValidActiveTrack || hasValidPausedTrack) {
    return false;
  }

  return (
    status === 'idle' ||
    status === 'requesting' ||
    status === 'denied' ||
    status === 'unavailable' ||
    status === 'error'
  );
}

export function resolveCameraStatusPresentation(
  input: ResolveCameraStatusInput
): CameraStatusPresentation {
  const {
    status,
    error,
    hasValidActiveTrack,
    hasValidPausedTrack,
    isRefreshingDevices,
  } = input;

  if (shouldShowRefreshingDevices(input)) {
    return withAnnouncement(REFRESHING_DEVICES_PRESENTATION);
  }

  if (status === 'requesting') {
    return withAnnouncement(REQUESTING_PRESENTATION);
  }

  if (status === 'switching') {
    return withAnnouncement(SWITCHING_PRESENTATION);
  }

  if (status === 'restarting') {
    return withAnnouncement(RESTARTING_PRESENTATION);
  }

  if (status === 'active') {
    if (hasValidActiveTrack) {
      return withAnnouncement(ACTIVE_PRESENTATION);
    }

    if (error) {
      return withAnnouncement(resolveErrorPresentation(error));
    }

    return withAnnouncement(IDLE_PRESENTATION);
  }

  if (status === 'paused') {
    if (hasValidPausedTrack) {
      return withAnnouncement(PAUSED_PRESENTATION);
    }

    if (error) {
      return withAnnouncement(resolveErrorPresentation(error));
    }

    return withAnnouncement(IDLE_PRESENTATION);
  }

  if (status === 'idle') {
    if (error?.code === 'device-disconnected') {
      return withAnnouncement(DEVICE_DISCONNECTED_PRESENTATION);
    }

    if (error) {
      return withAnnouncement(resolveErrorPresentation(error));
    }

    return withAnnouncement(IDLE_PRESENTATION, false);
  }

  if (status === 'denied') {
    if (error && isPermissionError(error)) {
      return withAnnouncement(PERMISSION_REQUIRED_PRESENTATION);
    }

    if (error) {
      return withAnnouncement(resolveErrorPresentation(error));
    }

    return withAnnouncement(PERMISSION_REQUIRED_PRESENTATION);
  }

  if (status === 'unavailable') {
    if (error?.code === 'insecure-context') {
      return withAnnouncement(SECURE_CONTEXT_PRESENTATION);
    }

    if (error?.code === 'unsupported') {
      return withAnnouncement(API_UNAVAILABLE_PRESENTATION);
    }

    if (error && isDeviceUnavailableError(error)) {
      return withAnnouncement({
        ...DEVICE_UNAVAILABLE_PRESENTATION,
        title: error.title,
        description: error.message,
      });
    }

    if (error) {
      return withAnnouncement(resolveErrorPresentation(error));
    }

    return withAnnouncement(DEVICE_UNAVAILABLE_PRESENTATION);
  }

  if (status === 'error') {
    if (error) {
      return withAnnouncement(resolveErrorPresentation(error));
    }

    return withAnnouncement({
      title: 'Não foi possível iniciar a câmera',
      description: 'Tente novamente ou volte à etapa anterior.',
      tone: 'danger',
      icon: TriangleAlert,
      animateIcon: false,
    });
  }

  if (isRefreshingDevices) {
    return withAnnouncement(REFRESHING_DEVICES_PRESENTATION, false);
  }

  return withAnnouncement(IDLE_PRESENTATION, false);
}

export const CAMERA_STATUS_TONE_STYLES: Record<
  CameraStatusTone,
  { container: string; icon: string; title: string }
> = {
  neutral: {
    container: 'border-zinc-700 bg-zinc-900/60',
    icon: 'text-zinc-400',
    title: 'text-zinc-100',
  },
  info: {
    container: 'border-sky-900/50 bg-sky-950/20',
    icon: 'text-sky-300',
    title: 'text-sky-50',
  },
  success: {
    container: 'border-emerald-900/50 bg-emerald-950/20',
    icon: 'text-emerald-300',
    title: 'text-emerald-50',
  },
  warning: {
    container: 'border-amber-900/50 bg-amber-950/20',
    icon: 'text-amber-300',
    title: 'text-amber-50',
  },
  danger: {
    container: 'border-red-900/50 bg-red-950/20',
    icon: 'text-red-300',
    title: 'text-red-50',
  },
};
