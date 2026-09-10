import type { CameraPresentationError } from '@/features/camera/errors/camera-error';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

type CameraErrorMessageProps = {
  error: CameraPresentationError;
  streamActive?: boolean;
  onRetry?: () => void;
  onRefreshDevices?: () => void;
  isRetryDisabled?: boolean;
  isRefreshDisabled?: boolean;
};

const SEVERITY_STYLES: Record<
  CameraPresentationError['severity'],
  { container: string; title: string }
> = {
  info: {
    container: 'border-zinc-700 bg-zinc-900/60',
    title: 'text-zinc-200',
  },
  warning: {
    container: 'border-amber-900/60 bg-amber-950/30',
    title: 'text-amber-100',
  },
  error: {
    container: 'border-red-900/60 bg-red-950/30',
    title: 'text-red-100',
  },
};

export function CameraErrorMessage({
  error,
  streamActive = false,
  onRetry,
  onRefreshDevices,
  isRetryDisabled = false,
  isRefreshDisabled = false,
}: CameraErrorMessageProps) {
  const styles = SEVERITY_STYLES[error.severity];
  const isInterrupting = error.severity === 'error' && !streamActive;
  const showRefresh =
    error.code === 'enumeration-failed' && onRefreshDevices !== undefined;
  const showRetry = error.canRetry && onRetry !== undefined;

  return (
    <div
      aria-live={isInterrupting ? undefined : 'polite'}
      className={cn('space-y-3 rounded-lg border px-4 py-3', styles.container)}
      role={isInterrupting ? 'alert' : undefined}
    >
      <div className="space-y-1">
        <h3 className={cn('text-sm font-semibold', styles.title)}>
          {error.title}
        </h3>
        <p className="text-sm leading-relaxed text-zinc-300">{error.message}</p>
        {error.recovery ? (
          <p className="text-sm leading-relaxed text-zinc-400">
            {error.recovery}
          </p>
        ) : null}
      </div>

      {showRefresh || showRetry ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {showRefresh ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-11 w-full sm:w-auto"
              disabled={isRefreshDisabled}
              onClick={onRefreshDevices}
            >
              Atualizar câmeras
            </Button>
          ) : null}

          {showRetry ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-11 w-full sm:w-auto"
              disabled={isRetryDisabled}
              onClick={onRetry}
            >
              Tentar novamente
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
