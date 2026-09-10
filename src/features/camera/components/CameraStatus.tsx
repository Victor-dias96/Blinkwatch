'use client';

import type { CameraPresentationError } from '@/features/camera/errors/camera-error';
import {
  CAMERA_STATUS_TONE_STYLES,
  resolveCameraStatusPresentation,
} from '@/features/camera/status/camera-status';
import type { CameraStatus as CameraTechnicalStatus } from '@/features/camera/types/camera-state';
import { cn } from '@/shared/lib/utils';

type CameraStatusProps = {
  status: CameraTechnicalStatus;
  error: CameraPresentationError | null;
  hasValidActiveTrack: boolean;
  hasValidPausedTrack: boolean;
  isRefreshingDevices?: boolean;
};

export function CameraStatus({
  status,
  error,
  hasValidActiveTrack,
  hasValidPausedTrack,
  isRefreshingDevices = false,
}: CameraStatusProps) {
  const presentation = resolveCameraStatusPresentation({
    status,
    error,
    hasValidActiveTrack,
    hasValidPausedTrack,
    isRefreshingDevices,
  });

  const styles = CAMERA_STATUS_TONE_STYLES[presentation.tone];
  const Icon = presentation.icon;

  return (
    <section
      aria-labelledby="camera-status-title"
      className={cn(
        'rounded-lg border px-4 py-3',
        'flex items-start gap-3',
        styles.container
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'mt-0.5 size-5 shrink-0',
          styles.icon,
          presentation.animateIcon && 'motion-safe:animate-spin'
        )}
      />

      <div className="min-w-0 flex-1 space-y-1">
        <h2
          id="camera-status-title"
          className={cn('text-sm font-semibold', styles.title)}
        >
          {presentation.title}
        </h2>
        <p className="text-sm leading-relaxed text-zinc-300">
          {presentation.description}
        </p>

        {presentation.shouldAnnounce ? (
          <p
            key={presentation.title}
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {presentation.title}. {presentation.description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
