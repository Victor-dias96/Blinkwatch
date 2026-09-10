'use client';

import Link from 'next/link';

import { Pause, Play, RotateCcw, VideoOff } from 'lucide-react';

import type { CameraStatus } from '@/features/camera/types/camera-state';
import { Button } from '@/shared/components/ui/button';

type CameraControlsProps = {
  status: CameraStatus;
  isRequesting: boolean;
  isSwitching: boolean;
  isRestarting: boolean;
  canPause: boolean;
  canResume: boolean;
  canRestart: boolean;
  canStop: boolean;
  showActivate: boolean;
  showPrimaryRetry: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onStop: () => void;
  onRetry: () => void;
};

export function CameraControls({
  status,
  isRequesting,
  isSwitching,
  isRestarting,
  canPause,
  canResume,
  canRestart,
  canStop,
  showActivate,
  showPrimaryRetry,
  onStart,
  onPause,
  onResume,
  onRestart,
  onStop,
  onRetry,
}: CameraControlsProps) {
  const operationInProgress = isRequesting || isSwitching || isRestarting;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {showActivate ? (
        <Button
          type="button"
          disabled={isRequesting}
          size="lg"
          className="min-h-11 w-full sm:w-auto"
          onClick={onStart}
        >
          {isRequesting ? 'Aguardando permissão...' : 'Iniciar câmera'}
        </Button>
      ) : null}

      {showPrimaryRetry ? (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="min-h-11 w-full sm:w-auto"
          disabled={operationInProgress}
          onClick={onRetry}
        >
          Tentar novamente
        </Button>
      ) : null}

      {canPause ? (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="min-h-11 w-full sm:w-auto"
          disabled={operationInProgress}
          onClick={onPause}
        >
          <Pause aria-hidden="true" className="size-4 shrink-0" />
          <span>Pausar</span>
        </Button>
      ) : null}

      {canResume ? (
        <Button
          type="button"
          size="lg"
          className="min-h-11 w-full sm:w-auto"
          disabled={operationInProgress}
          onClick={onResume}
        >
          <Play aria-hidden="true" className="size-4 shrink-0" />
          <span>Retomar</span>
        </Button>
      ) : null}

      {canRestart ? (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="min-h-11 w-full sm:w-auto"
          disabled={operationInProgress}
          onClick={onRestart}
        >
          <RotateCcw aria-hidden="true" className="size-4 shrink-0" />
          <span>{isRestarting ? 'Reiniciando câmera...' : 'Reiniciar'}</span>
        </Button>
      ) : null}

      {canStop ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-11 w-full sm:w-auto"
          disabled={operationInProgress}
          onClick={onStop}
        >
          <VideoOff aria-hidden="true" className="size-4 shrink-0" />
          <span>Encerrar câmera</span>
        </Button>
      ) : null}

      {status === 'restarting' ? (
        <p aria-live="polite" className="w-full text-sm text-zinc-400">
          Reiniciando câmera...
        </p>
      ) : null}

      <Link
        href="/play/setup"
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 bg-transparent px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-50 focus-visible:ring-3 focus-visible:ring-zinc-400/50 focus-visible:outline-none sm:w-auto"
      >
        Voltar para a preparação
      </Link>
    </div>
  );
}
