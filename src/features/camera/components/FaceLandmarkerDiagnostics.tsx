'use client';

import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  LoaderCircle,
} from 'lucide-react';

import type { FaceLandmarkerLoadState } from '@/infrastructure/mediapipe/types';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

type FaceLandmarkerDiagnosticsProps = {
  state: FaceLandmarkerLoadState;
  canPrepare: boolean;
  onPrepare: () => void;
};

const PRESENTATION = {
  idle: {
    title: 'Rastreamento ainda não preparado',
    description:
      'Prepare o modelo local antes de iniciar a futura análise visual.',
    icon: CircleDashed,
    tone: 'neutral',
  },
  loading: {
    title: 'Preparando rastreamento',
    description: 'Carregando os recursos locais de visão computacional.',
    icon: LoaderCircle,
    tone: 'pending',
  },
  ready: {
    title: 'Rastreamento preparado',
    description:
      'O modelo foi carregado. Nenhum frame está sendo analisado nesta etapa.',
    icon: CircleCheck,
    tone: 'success',
  },
  failed: {
    title: 'Não foi possível preparar o rastreamento',
    description:
      'Os recursos de visão computacional não puderam ser carregados.',
    icon: CircleAlert,
    tone: 'danger',
  },
} as const;

const TONE_STYLES = {
  neutral: {
    container: 'border-zinc-800 bg-zinc-900/40',
    icon: 'text-zinc-400',
    title: 'text-zinc-100',
  },
  pending: {
    container: 'border-sky-900/50 bg-sky-950/20',
    icon: 'text-sky-300',
    title: 'text-sky-100',
  },
  success: {
    container: 'border-emerald-900/50 bg-emerald-950/20',
    icon: 'text-emerald-300',
    title: 'text-emerald-100',
  },
  danger: {
    container: 'border-red-900/60 bg-red-950/30',
    icon: 'text-red-300',
    title: 'text-red-100',
  },
} as const;

function resolvePresentation(state: FaceLandmarkerLoadState) {
  if (state.status === 'disposed') {
    return PRESENTATION.idle;
  }

  return PRESENTATION[state.status];
}

export function FaceLandmarkerDiagnostics({
  state,
  canPrepare,
  onPrepare,
}: FaceLandmarkerDiagnosticsProps) {
  const presentation = resolvePresentation(state);
  const styles = TONE_STYLES[presentation.tone];
  const Icon = presentation.icon;
  const isLoading = state.status === 'loading';
  const showRetry = state.status === 'failed' && canPrepare;
  const showPrepare = canPrepare && state.status !== 'failed';
  const announceText = `${presentation.title}. ${presentation.description}`;

  return (
    <section
      aria-labelledby="face-landmarker-diagnostics-title"
      className={cn('rounded-lg border px-4 py-3', styles.container)}
    >
      <div className="flex items-start gap-3">
        <Icon
          aria-hidden="true"
          className={cn(
            'mt-0.5 size-5 shrink-0',
            styles.icon,
            isLoading && 'motion-safe:animate-spin'
          )}
        />

        <div className="min-w-0 flex-1 space-y-2">
          <h2
            id="face-landmarker-diagnostics-title"
            className={cn('text-sm font-semibold', styles.title)}
          >
            {presentation.title}
          </h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            {presentation.description}
          </p>

          {isLoading || state.status === 'failed' ? (
            <p aria-live="polite" aria-atomic="true" className="sr-only">
              {announceText}
            </p>
          ) : null}

          {showPrepare ? (
            <Button
              type="button"
              size="lg"
              className="min-h-11 w-full sm:w-auto"
              disabled={isLoading}
              onClick={onPrepare}
            >
              Preparar rastreamento facial
            </Button>
          ) : null}

          {showRetry ? (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="min-h-11 w-full sm:w-auto"
              onClick={onPrepare}
            >
              Tentar novamente
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
