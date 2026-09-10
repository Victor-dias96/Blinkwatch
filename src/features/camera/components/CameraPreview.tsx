'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { VideoOff } from 'lucide-react';

import { CameraDeviceSelect } from '@/features/camera/components/CameraDeviceSelect';
import { CameraErrorMessage } from '@/features/camera/components/CameraErrorMessage';
import {
  type CameraPresentationError,
  classifyGetUserMediaError,
  classifySwitchDeviceError,
  createCameraStateFromError,
  createDeviceDisconnectedError,
  createEnumerationFailedError,
  createPlaybackFailedError,
  createPreActivationError,
  createUnexpectedAudioTrackError,
  isMediaDevicesApiAvailable,
  isSecureBrowserContext,
} from '@/features/camera/errors/camera-error';
import {
  type CameraDeviceOption,
  enumerateVideoInputDevices,
  getActiveDeviceIdFromStream,
  supportsDeviceChangeEvent,
} from '@/features/camera/services/camera-devices';
import {
  attachStreamToVideo,
  getPrimaryVideoTrack,
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

export function CameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackEndedHandlerRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);
  const isRequestingRef = useRef(false);
  const isSwitchingRef = useRef(false);
  const isManualStopRef = useRef(false);
  const operationGenerationRef = useRef(0);

  const [cameraState, setCameraState] = useState<CameraState>(
    createCameraState('idle')
  );
  const [devices, setDevices] = useState<CameraDeviceOption[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [deviceListError, setDeviceListError] =
    useState<CameraPresentationError | null>(null);
  const [switchError, setSwitchError] =
    useState<CameraPresentationError | null>(null);
  const [isRefreshingList, setIsRefreshingList] = useState(false);

  const displayState = resolveDisplayCameraState(cameraState);

  const invalidateOperations = useCallback(() => {
    operationGenerationRef.current += 1;
  }, []);

  const detachTrackEndedListener = useCallback(() => {
    const stream = streamRef.current;
    const handler = trackEndedHandlerRef.current;

    if (!stream || !handler) {
      trackEndedHandlerRef.current = null;
      return;
    }

    const track = getPrimaryVideoTrack(stream);

    if (track) {
      track.removeEventListener('ended', handler);
    }

    trackEndedHandlerRef.current = null;
  }, []);

  const stopActiveStream = useCallback(() => {
    detachTrackEndedListener();

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
  }, [detachTrackEndedListener]);

  const resetDeviceState = useCallback(() => {
    setDevices([]);
    setActiveDeviceId(null);
    setDeviceListError(null);
    setSwitchError(null);
    setIsRefreshingList(false);
  }, []);

  const handleActiveDeviceRemoved = useCallback(() => {
    invalidateOperations();
    isSwitchingRef.current = false;
    isRequestingRef.current = false;
    stopActiveStream();
    resetDeviceState();

    const error = createDeviceDisconnectedError();
    setCameraState(createCameraState('idle', error));
  }, [invalidateOperations, resetDeviceState, stopActiveStream]);

  const attachTrackEndedListener = useCallback(
    (stream: MediaStream) => {
      detachTrackEndedListener();

      const track = getPrimaryVideoTrack(stream);

      if (!track) {
        return;
      }

      const handleTrackEnded = () => {
        if (isManualStopRef.current) {
          return;
        }

        handleActiveDeviceRemoved();
      };

      trackEndedHandlerRef.current = handleTrackEnded;
      track.addEventListener('ended', handleTrackEnded);
    },
    [detachTrackEndedListener, handleActiveDeviceRemoved]
  );

  const loadDeviceList = useCallback(async (): Promise<boolean> => {
    if (!isMediaDevicesApiAvailable()) {
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

      setDeviceListError(createEnumerationFailedError());
      return false;
    }
  }, []);

  const refreshDeviceList = useCallback(async () => {
    if (isRefreshingList || isSwitchingRef.current) {
      return;
    }

    if (!isMediaDevicesApiAvailable()) {
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

        setDeviceListError(createEnumerationFailedError());
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
      isManualStopRef.current = true;
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

    if (!isSecureBrowserContext()) {
      setCameraState(
        createCameraState(
          'unavailable',
          createPreActivationError('insecure-context')
        )
      );
      return;
    }

    if (!isMediaDevicesApiAvailable()) {
      setCameraState(
        createCameraState(
          'unavailable',
          createPreActivationError('unsupported')
        )
      );
      return;
    }

    const generation = ++operationGenerationRef.current;
    isManualStopRef.current = false;
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
          createCameraStateFromError(createUnexpectedAudioTrackError())
        );
        return;
      }

      const videoElement = videoRef.current;

      if (!videoElement) {
        stopMediaStream(stream);
        setCameraState(createCameraStateFromError(createPlaybackFailedError()));
        return;
      }

      try {
        await attachStreamToVideo(videoElement, stream);
      } catch {
        stopMediaStream(stream, videoElement);
        setCameraState(createCameraStateFromError(createPlaybackFailedError()));
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
      attachTrackEndedListener(stream);
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

      const presentationError = await classifyGetUserMediaError(error);
      setCameraState(createCameraStateFromError(presentationError));
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

    if (!isMediaDevicesApiAvailable()) {
      return;
    }

    const generation = ++operationGenerationRef.current;
    isSwitchingRef.current = true;
    setSwitchError(null);
    setCameraState(createCameraState('switching'));

    const previousStream = streamRef.current;
    const previousDeviceId = activeDeviceId;
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
        setSwitchError(
          classifySwitchDeviceError(new Error('unexpected-audio'), true)
        );
        setCameraState(createCameraState('active'));
        return;
      }

      if (!videoElement) {
        stopMediaStream(nextStream);
        setSwitchError(classifySwitchDeviceError(new Error('no-video'), true));
        setCameraState(createCameraState('active'));
        return;
      }

      try {
        await attachStreamToVideo(videoElement, nextStream);
      } catch {
        stopMediaStream(nextStream, videoElement);
        setSwitchError(
          classifySwitchDeviceError(new Error('playback-failed'), true)
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

      detachTrackEndedListener();
      isManualStopRef.current = false;
      stopMediaStream(previousStream);
      streamRef.current = nextStream;
      attachTrackEndedListener(nextStream);

      const confirmedDeviceId =
        getActiveDeviceIdFromStream(nextStream) ?? selectedDeviceId;

      setActiveDeviceId(confirmedDeviceId);
      setSwitchError(null);
      setCameraState(createCameraState('active'));
      await loadDeviceList();
    } catch (error) {
      if (
        !isMountedRef.current ||
        generation !== operationGenerationRef.current
      ) {
        return;
      }

      const streamStillValid =
        previousStream !== null &&
        getPrimaryVideoTrack(previousStream)?.readyState === 'live';

      if (streamStillValid && videoElement && previousStream) {
        videoElement.srcObject = previousStream;
        streamRef.current = previousStream;
        attachTrackEndedListener(previousStream);
        setActiveDeviceId(previousDeviceId);
        setSwitchError(classifySwitchDeviceError(error, true));
        setCameraState(createCameraState('active'));
        return;
      }

      stopActiveStream();
      resetDeviceState();
      setSwitchError(null);
      setCameraState(
        createCameraStateFromError(classifySwitchDeviceError(error, false))
      );
    } finally {
      if (generation === operationGenerationRef.current) {
        isSwitchingRef.current = false;
      }
    }
  }

  function handleDeactivateCamera() {
    invalidateOperations();
    isManualStopRef.current = true;
    isRequestingRef.current = false;
    isSwitchingRef.current = false;
    stopActiveStream();
    resetDeviceState();
    setCameraState(createCameraState('idle'));
  }

  function handleRetry() {
    setCameraState(createCameraState('idle'));
    void handleActivateCamera();
  }

  function handleRefreshDeviceList() {
    void refreshDeviceList();
  }

  const isPreviewVisible =
    displayState.status === 'active' || displayState.status === 'switching';
  const isRequesting = displayState.status === 'requesting';
  const isSwitching = displayState.status === 'switching';
  const primaryError = displayState.error;
  const showActivate = displayState.status === 'idle';
  const showPrimaryRetry =
    primaryError !== null &&
    primaryError.canRetry &&
    (displayState.status === 'denied' ||
      displayState.status === 'error' ||
      displayState.status === 'unavailable' ||
      displayState.status === 'idle');
  const showDeviceSelector =
    isMediaDevicesApiAvailable() &&
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
          Aguardando sua decisão no navegador.
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
                {displayState.status === 'unavailable'
                  ? 'Verifique o navegador, a permissão e a conexão segura antes de tentar novamente.'
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

        {primaryError ? (
          <CameraErrorMessage
            error={primaryError}
            isRetryDisabled={isRequesting || isSwitching}
            streamActive={isPreviewVisible}
            onRetry={showPrimaryRetry ? handleRetry : undefined}
          />
        ) : null}

        {switchError ? (
          <CameraErrorMessage error={switchError} streamActive />
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

      {deviceListError ? (
        <CameraErrorMessage
          error={deviceListError}
          isRefreshDisabled={isRefreshingList || isSwitching}
          streamActive={isPreviewVisible}
          onRefreshDevices={handleRefreshDeviceList}
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
