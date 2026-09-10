'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { VideoOff } from 'lucide-react';

import {
  attachStreamToVideo,
  classifyGetUserMediaError,
  isMediaDevicesSupported,
  MEDIA_DEVICES_UNAVAILABLE_MESSAGE,
  requestVideoStream,
  stopMediaStream,
} from '@/features/camera/services/camera-stream';
import {
  CAMERA_STATUS_LABELS,
  type CameraState,
  createCameraState,
  resolveDisplayCameraState,
} from '@/features/camera/types/camera-state';
import { Button } from '@/shared/components/ui/button';

function subscribeToMediaDevicesAvailability() {
  return () => {};
}

function getMediaDevicesAvailabilitySnapshot() {
  return isMediaDevicesSupported();
}

function getMediaDevicesAvailabilityServerSnapshot() {
  return true;
}

export function CameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);
  const isRequestingRef = useRef(false);

  const [cameraState, setCameraState] = useState<CameraState>(
    createCameraState('idle')
  );
  const mediaDevicesSupported = useSyncExternalStore(
    subscribeToMediaDevicesAvailability,
    getMediaDevicesAvailabilitySnapshot,
    getMediaDevicesAvailabilityServerSnapshot
  );
  const displayState = resolveDisplayCameraState(
    cameraState,
    mediaDevicesSupported,
    MEDIA_DEVICES_UNAVAILABLE_MESSAGE
  );

  const stopActiveStream = useCallback(() => {
    stopMediaStream(streamRef.current, videoRef.current);
    streamRef.current = null;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      isRequestingRef.current = false;
      stopActiveStream();
    };
  }, [stopActiveStream]);

  async function handleActivateCamera() {
    if (
      isRequestingRef.current ||
      cameraState.status === 'active' ||
      cameraState.status === 'requesting'
    ) {
      return;
    }

    if (!isMediaDevicesSupported()) {
      setCameraState(
        createCameraState('unavailable', MEDIA_DEVICES_UNAVAILABLE_MESSAGE)
      );
      return;
    }

    isRequestingRef.current = true;
    stopActiveStream();
    setCameraState(createCameraState('requesting'));

    try {
      const stream = await requestVideoStream();

      if (!isMountedRef.current) {
        stopMediaStream(stream);
        return;
      }

      if (stream.getAudioTracks().length > 0) {
        stopMediaStream(stream);
        setCameraState(
          createCameraState(
            'error',
            'Não foi possível ativar a câmera. Tente novamente.'
          )
        );
        return;
      }

      const videoElement = videoRef.current;

      if (!videoElement) {
        stopMediaStream(stream);
        setCameraState(
          createCameraState(
            'error',
            'Não foi possível exibir a prévia da câmera. Tente novamente.'
          )
        );
        return;
      }

      try {
        await attachStreamToVideo(videoElement, stream);
      } catch {
        stopMediaStream(stream, videoElement);
        setCameraState(
          createCameraState(
            'error',
            'Não foi possível reproduzir a prévia da câmera. Tente novamente.'
          )
        );
        return;
      }

      streamRef.current = stream;
      setCameraState(createCameraState('active'));
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setCameraState(classifyGetUserMediaError(error));
    } finally {
      isRequestingRef.current = false;
    }
  }

  function handleDeactivateCamera() {
    stopActiveStream();
    setCameraState(createCameraState('idle'));
  }

  function handleRetry() {
    void handleActivateCamera();
  }

  const isActive = displayState.status === 'active';
  const isRequesting = displayState.status === 'requesting';
  const showRetry =
    displayState.status === 'denied' ||
    displayState.status === 'error' ||
    (displayState.status === 'unavailable' && mediaDevicesSupported);
  const showActivate = displayState.status === 'idle';
  const statusLabel = CAMERA_STATUS_LABELS[displayState.status];

  return (
    <div className="mt-8 space-y-6">
      <p aria-live="polite" className="text-sm font-medium text-zinc-200">
        Estado atual: {statusLabel}
      </p>

      {displayState.status === 'requesting' ? (
        <p className="text-sm leading-relaxed text-zinc-400">
          O navegador aguarda sua decisão sobre a permissão de câmera.
        </p>
      ) : null}

      <section aria-labelledby="camera-preview-heading" className="space-y-3">
        <h2 id="camera-preview-heading" className="sr-only">
          Prévia da câmera
        </h2>

        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
          {!isActive ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
              <VideoOff aria-hidden="true" className="size-8 text-zinc-500" />
              <p className="text-sm text-zinc-400">A câmera está desligada</p>
              <p className="text-sm text-zinc-500">
                {displayState.status === 'unavailable' && !mediaDevicesSupported
                  ? 'Utilize um navegador compatível em contexto seguro para ativar a câmera.'
                  : 'Selecione "Ativar câmera" para solicitar permissão.'}
              </p>
            </div>
          ) : null}

          <video
            ref={videoRef}
            autoPlay
            className={`size-full object-cover ${isActive ? 'block' : 'hidden'}`}
            muted
            playsInline
          />

          {isActive ? (
            <p className="sr-only">Prévia local da câmera em reprodução.</p>
          ) : null}
        </div>

        {displayState.message ? (
          <p
            className="text-sm leading-relaxed text-zinc-300"
            role={displayState.status === 'active' ? undefined : 'alert'}
          >
            {displayState.message}
          </p>
        ) : null}

        {displayState.status === 'unavailable' && !mediaDevicesSupported ? (
          <p className="text-sm leading-relaxed text-zinc-400">
            O acesso à câmera depende de um navegador compatível, da sua
            permissão e de um contexto seguro (HTTPS ou localhost durante o
            desenvolvimento).
          </p>
        ) : null}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {showActivate ? (
          <Button
            type="button"
            disabled={isRequesting}
            size="lg"
            className="min-h-11 w-full sm:w-auto"
            onClick={() => {
              void handleActivateCamera();
            }}
          >
            {isRequesting ? 'Solicitando permissão...' : 'Ativar câmera'}
          </Button>
        ) : null}

        {isActive ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11 w-full sm:w-auto"
            onClick={handleDeactivateCamera}
          >
            Desligar câmera
          </Button>
        ) : null}

        {showRetry ? (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="min-h-11 w-full sm:w-auto"
            disabled={isRequesting}
            onClick={handleRetry}
          >
            Tentar novamente
          </Button>
        ) : null}

        <Link
          href="/play/setup"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 bg-transparent px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-50 focus-visible:ring-3 focus-visible:ring-zinc-400/50 focus-visible:outline-none sm:w-auto"
        >
          Voltar para a preparação
        </Link>
      </div>
    </div>
  );
}
