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

import { CameraDeviceSelect } from '@/features/camera/components/CameraDeviceSelect';
import {
  type CameraDeviceOption,
  enumerateVideoInputDevices,
  getActiveDeviceIdFromStream,
  supportsDeviceChangeEvent,
} from '@/features/camera/services/camera-devices';
import {
  attachStreamToVideo,
  classifyGetUserMediaError,
  classifySwitchDeviceError,
  isMediaDevicesSupported,
  MEDIA_DEVICES_UNAVAILABLE_MESSAGE,
  requestVideoStream,
  requestVideoStreamForDevice,
  stopMediaStream,
} from '@/features/camera/services/camera-stream';
import {
  CAMERA_STATUS_LABELS,
  type CameraState,
  createCameraState,
  resolveDisplayCameraState,
} from '@/features/camera/types/camera-state';
import { Button } from '@/shared/components/ui/button';

const DEVICE_LIST_ERROR_MESSAGE =
  'Não foi possível carregar a lista de câmeras.';

const ACTIVE_DEVICE_DISCONNECTED_MESSAGE =
  'A câmera em uso foi desconectada. Ative ou selecione outra câmera.';

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
  const isSwitchingRef = useRef(false);
  const operationGenerationRef = useRef(0);

  const [cameraState, setCameraState] = useState<CameraState>(
    createCameraState('idle')
  );
  const [devices, setDevices] = useState<CameraDeviceOption[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [deviceListError, setDeviceListError] = useState<string | null>(null);
  const [switchMessage, setSwitchMessage] = useState<string | null>(null);
  const [isRefreshingList, setIsRefreshingList] = useState(false);

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

  const invalidateOperations = useCallback(() => {
    operationGenerationRef.current += 1;
  }, []);

  const stopActiveStream = useCallback(() => {
    const videoElement = videoRef.current;
    const streamFromRef = streamRef.current;
    const streamFromVideo =
      videoElement?.srcObject instanceof MediaStream
        ? videoElement.srcObject
        : null;

    stopMediaStream(streamFromRef, videoElement);
    streamRef.current = null;

    if (streamFromVideo && streamFromVideo !== streamFromRef) {
      stopMediaStream(streamFromVideo, videoElement);
    }
  }, []);

  const resetDeviceState = useCallback(() => {
    setDevices([]);
    setActiveDeviceId(null);
    setDeviceListError(null);
    setSwitchMessage(null);
    setIsRefreshingList(false);
  }, []);

  const loadDeviceList = useCallback(async (): Promise<boolean> => {
    if (!isMediaDevicesSupported()) {
      return false;
    }

    try {
      const nextDevices = await enumerateVideoInputDevices();

      if (!isMountedRef.current) {
        return false;
      }

      setDevices(nextDevices);
      setDeviceListError(null);
      return true;
    } catch {
      if (!isMountedRef.current) {
        return false;
      }

      setDeviceListError(DEVICE_LIST_ERROR_MESSAGE);
      return false;
    }
  }, []);

  const handleActiveDeviceRemoved = useCallback(() => {
    invalidateOperations();
    isSwitchingRef.current = false;
    isRequestingRef.current = false;
    stopActiveStream();
    resetDeviceState();
    setCameraState(
      createCameraState('idle', ACTIVE_DEVICE_DISCONNECTED_MESSAGE)
    );
  }, [invalidateOperations, resetDeviceState, stopActiveStream]);

  const refreshDeviceList = useCallback(async () => {
    if (isRefreshingList || isSwitchingRef.current) {
      return;
    }

    if (!isMediaDevicesSupported()) {
      return;
    }

    setIsRefreshingList(true);

    try {
      let nextDevices: CameraDeviceOption[];

      try {
        nextDevices = await enumerateVideoInputDevices();
      } catch {
        if (!isMountedRef.current) {
          return;
        }

        setDeviceListError(DEVICE_LIST_ERROR_MESSAGE);
        return;
      }

      if (!isMountedRef.current) {
        return;
      }

      setDevices(nextDevices);
      setDeviceListError(null);

      const currentDeviceId =
        activeDeviceId ??
        (streamRef.current
          ? getActiveDeviceIdFromStream(streamRef.current)
          : null);

      if (
        currentDeviceId &&
        streamRef.current &&
        !nextDevices.some((device) => device.deviceId === currentDeviceId)
      ) {
        handleActiveDeviceRemoved();
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshingList(false);
      }
    }
  }, [activeDeviceId, handleActiveDeviceRemoved, isRefreshingList]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      invalidateOperations();
      isRequestingRef.current = false;
      isSwitchingRef.current = false;
      stopActiveStream();
    };
  }, [invalidateOperations, stopActiveStream]);

  useEffect(() => {
    if (cameraState.status !== 'active' && cameraState.status !== 'switching') {
      return;
    }

    if (!supportsDeviceChangeEvent()) {
      return;
    }

    const handleDeviceChange = () => {
      void refreshDeviceList();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        handleDeviceChange
      );
    };
  }, [cameraState.status, refreshDeviceList]);

  async function handleActivateCamera() {
    if (
      isRequestingRef.current ||
      isSwitchingRef.current ||
      cameraState.status === 'active' ||
      cameraState.status === 'requesting' ||
      cameraState.status === 'switching'
    ) {
      return;
    }

    if (!isMediaDevicesSupported()) {
      setCameraState(
        createCameraState('unavailable', MEDIA_DEVICES_UNAVAILABLE_MESSAGE)
      );
      return;
    }

    const generation = ++operationGenerationRef.current;
    isRequestingRef.current = true;
    stopActiveStream();
    resetDeviceState();
    setCameraState(createCameraState('requesting'));

    try {
      const stream = await requestVideoStream();

      if (
        !isMountedRef.current ||
        generation !== operationGenerationRef.current
      ) {
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

      if (
        !isMountedRef.current ||
        generation !== operationGenerationRef.current
      ) {
        stopMediaStream(stream, videoElement);
        return;
      }

      streamRef.current = stream;
      setCameraState(createCameraState('active'));
      setActiveDeviceId(getActiveDeviceIdFromStream(stream));
      await loadDeviceList();
    } catch (error) {
      if (
        !isMountedRef.current ||
        generation !== operationGenerationRef.current
      ) {
        return;
      }

      setCameraState(classifyGetUserMediaError(error));
    } finally {
      if (generation === operationGenerationRef.current) {
        isRequestingRef.current = false;
      }
    }
  }

  async function handleSwitchDevice(selectedDeviceId: string) {
    if (
      !selectedDeviceId ||
      selectedDeviceId === activeDeviceId ||
      isSwitchingRef.current ||
      isRequestingRef.current ||
      cameraState.status !== 'active'
    ) {
      return;
    }

    if (!isMediaDevicesSupported()) {
      return;
    }

    const generation = ++operationGenerationRef.current;
    isSwitchingRef.current = true;
    setSwitchMessage(null);
    setCameraState(createCameraState('switching'));

    const previousStream = streamRef.current;
    const videoElement = videoRef.current;

    try {
      const nextStream = await requestVideoStreamForDevice(selectedDeviceId);

      if (
        !isMountedRef.current ||
        generation !== operationGenerationRef.current
      ) {
        stopMediaStream(nextStream);
        return;
      }

      if (nextStream.getAudioTracks().length > 0) {
        stopMediaStream(nextStream);
        setSwitchMessage(
          'Não foi possível trocar de câmera. A câmera anterior continuará ativa.'
        );
        setCameraState(createCameraState('active'));
        return;
      }

      if (!videoElement) {
        stopMediaStream(nextStream);
        setSwitchMessage(
          'Não foi possível trocar de câmera. A câmera anterior continuará ativa.'
        );
        setCameraState(createCameraState('active'));
        return;
      }

      try {
        await attachStreamToVideo(videoElement, nextStream);
      } catch {
        stopMediaStream(nextStream, videoElement);
        setSwitchMessage(
          'Não foi possível trocar de câmera. A câmera anterior continuará ativa.'
        );
        setCameraState(createCameraState('active'));
        return;
      }

      if (
        !isMountedRef.current ||
        generation !== operationGenerationRef.current
      ) {
        stopMediaStream(nextStream, videoElement);
        return;
      }

      stopMediaStream(previousStream);
      streamRef.current = nextStream;

      const confirmedDeviceId =
        getActiveDeviceIdFromStream(nextStream) ?? selectedDeviceId;

      setActiveDeviceId(confirmedDeviceId);
      setSwitchMessage(null);
      setCameraState(createCameraState('active'));
      await loadDeviceList();
    } catch (error) {
      if (
        !isMountedRef.current ||
        generation !== operationGenerationRef.current
      ) {
        return;
      }

      setSwitchMessage(classifySwitchDeviceError(error));
      setCameraState(createCameraState('active'));
    } finally {
      if (generation === operationGenerationRef.current) {
        isSwitchingRef.current = false;
      }
    }
  }

  function handleDeactivateCamera() {
    invalidateOperations();
    isRequestingRef.current = false;
    isSwitchingRef.current = false;
    stopActiveStream();
    resetDeviceState();
    setCameraState(createCameraState('idle'));
  }

  function handleRetry() {
    void handleActivateCamera();
  }

  function handleRefreshDeviceList() {
    void refreshDeviceList();
  }

  const isPreviewVisible =
    displayState.status === 'active' || displayState.status === 'switching';
  const isRequesting = displayState.status === 'requesting';
  const isSwitching = displayState.status === 'switching';
  const showRetry =
    displayState.status === 'denied' ||
    displayState.status === 'error' ||
    (displayState.status === 'unavailable' && mediaDevicesSupported);
  const showActivate = displayState.status === 'idle';
  const showDeviceSelector =
    mediaDevicesSupported &&
    (displayState.status === 'active' || displayState.status === 'switching');
  const showRefreshButton =
    showDeviceSelector &&
    (deviceListError !== null || !supportsDeviceChangeEvent());
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
          {!isPreviewVisible ? (
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
            className={`size-full object-cover ${isPreviewVisible ? 'block' : 'hidden'}`}
            muted
            playsInline
          />

          {isPreviewVisible ? (
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

        {switchMessage ? (
          <p className="text-sm leading-relaxed text-zinc-300" role="alert">
            {switchMessage}
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

      {showDeviceSelector ? (
        <CameraDeviceSelect
          activeDeviceId={activeDeviceId}
          devices={devices}
          disabled={false}
          isRefreshingList={isRefreshingList}
          isSwitching={isSwitching}
          listError={deviceListError}
          showRefreshButton={showRefreshButton}
          onDeviceChange={(deviceId) => {
            void handleSwitchDevice(deviceId);
          }}
          onRefreshList={handleRefreshDeviceList}
        />
      ) : null}

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

        {isPreviewVisible ? (
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
            disabled={isRequesting || isSwitching}
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
