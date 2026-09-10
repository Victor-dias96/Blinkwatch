'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Pause, VideoOff } from 'lucide-react';

import { CameraControls } from '@/features/camera/components/CameraControls';
import { CameraDeviceSelect } from '@/features/camera/components/CameraDeviceSelect';
import { CameraErrorMessage } from '@/features/camera/components/CameraErrorMessage';
import { CameraMirrorControl } from '@/features/camera/components/CameraMirrorControl';
import { CameraStatus } from '@/features/camera/components/CameraStatus';
import {
  type CameraPresentationError,
  classifyGetUserMediaError,
  classifySwitchDeviceError,
  createCameraStateFromError,
  createDeviceDisconnectedError,
  createDeviceUnavailableRestartWarning,
  createEnumerationFailedError,
  createPlaybackFailedError,
  createPreActivationError,
  createUnexpectedAudioTrackError,
  isMediaDevicesApiAvailable,
  isMissingDeviceError,
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
  getAssignedMediaStream,
  getPrimaryVideoTrack,
  isVideoTrackPausable,
  isVideoTrackResumable,
  pauseVideoTrack,
  releaseMediaStream,
  requestVideoStream,
  requestVideoStreamForDevice,
  resumeVideoTrack,
} from '@/features/camera/services/camera-stream';
import {
  type CameraState,
  createCameraState,
} from '@/features/camera/types/camera-state';
import { cn } from '@/shared/lib/utils';

export function CameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);
  const trackEndedHandlerRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);
  const isRequestingRef = useRef(false);
  const isSwitchingRef = useRef(false);
  const isRestartingRef = useRef(false);
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
  const [restartWarning, setRestartWarning] =
    useState<CameraPresentationError | null>(null);
  const [isRefreshingList, setIsRefreshingList] = useState(false);
  const [hasValidActiveTrack, setHasValidActiveTrack] = useState(false);
  const [hasValidPausedTrack, setHasValidPausedTrack] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);

  const canApplyOperationResult = useCallback((generation: number) => {
    return (
      isMountedRef.current && generation === operationGenerationRef.current
    );
  }, []);

  const invalidateOperations = useCallback(() => {
    operationGenerationRef.current += 1;
  }, []);

  const clearTrackValidityState = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    setHasValidActiveTrack(false);
    setHasValidPausedTrack(false);
  }, []);

  const detachTrackEndedListener = useCallback(() => {
    const stream = streamRef.current;
    const handler = trackEndedHandlerRef.current;
    trackEndedHandlerRef.current = null;

    if (!stream || !handler) {
      return;
    }

    for (const track of stream.getTracks()) {
      track.removeEventListener('ended', handler);
    }
  }, []);

  const releaseStream = useCallback((stream: MediaStream | null) => {
    if (!stream) {
      return;
    }

    const handler =
      stream === streamRef.current ? trackEndedHandlerRef.current : null;

    if (stream === streamRef.current) {
      trackEndedHandlerRef.current = null;
    }

    releaseMediaStream(stream, {
      videoElement: videoRef.current,
      endedHandler: handler,
    });

    if (streamRef.current === stream) {
      streamRef.current = null;
    }

    if (pendingStreamRef.current === stream) {
      pendingStreamRef.current = null;
    }
  }, []);

  const releaseAllCameraMedia = useCallback(() => {
    const videoElement = videoRef.current;
    const handler = trackEndedHandlerRef.current;
    trackEndedHandlerRef.current = null;

    const knownStreams = new Set<MediaStream>();

    if (streamRef.current) {
      knownStreams.add(streamRef.current);
    }

    if (pendingStreamRef.current) {
      knownStreams.add(pendingStreamRef.current);
    }

    const videoStream = getAssignedMediaStream(videoElement);

    if (videoStream) {
      knownStreams.add(videoStream);
    }

    for (const stream of knownStreams) {
      releaseMediaStream(stream, {
        videoElement,
        endedHandler: handler,
      });
    }

    if (videoElement) {
      videoElement.srcObject = null;
    }

    streamRef.current = null;
    pendingStreamRef.current = null;
  }, []);

  const stopActiveStream = useCallback(() => {
    releaseAllCameraMedia();
    clearTrackValidityState();
  }, [clearTrackValidityState, releaseAllCameraMedia]);

  const resetDeviceState = useCallback(() => {
    setDevices([]);
    setActiveDeviceId(null);
    setDeviceListError(null);
    setSwitchError(null);
    setRestartWarning(null);
    setIsRefreshingList(false);
  }, []);

  const handleActiveDeviceRemoved = useCallback(() => {
    if (!isMountedRef.current || isManualStopRef.current) {
      return;
    }

    isManualStopRef.current = true;
    invalidateOperations();
    isSwitchingRef.current = false;
    isRestartingRef.current = false;
    isRequestingRef.current = false;
    stopActiveStream();
    resetDeviceState();

    const error = createDeviceDisconnectedError();
    setCameraState(createCameraState('idle', error));
  }, [invalidateOperations, resetDeviceState, stopActiveStream]);

  const attachTrackEndedListener = useCallback(
    (stream: MediaStream) => {
      detachTrackEndedListener();

      const handleTrackEnded = () => {
        if (isManualStopRef.current || !isMountedRef.current) {
          return;
        }

        handleActiveDeviceRemoved();
      };

      trackEndedHandlerRef.current = handleTrackEnded;

      for (const track of stream.getTracks()) {
        track.addEventListener('ended', handleTrackEnded);
      }
    },
    [detachTrackEndedListener, handleActiveDeviceRemoved]
  );

  const loadDeviceList = useCallback(
    async (generation?: number): Promise<boolean> => {
      const operationGeneration = generation ?? operationGenerationRef.current;

      if (!isMediaDevicesApiAvailable()) {
        return false;
      }

      try {
        const nextDevices = await enumerateVideoInputDevices();

        if (!canApplyOperationResult(operationGeneration)) {
          return false;
        }

        setDevices(nextDevices);
        setDeviceListError(null);
        return true;
      } catch {
        if (!canApplyOperationResult(operationGeneration)) {
          return false;
        }

        setDeviceListError(createEnumerationFailedError());
        return false;
      }
    },
    [canApplyOperationResult]
  );

  const refreshDeviceList = useCallback(async () => {
    if (
      isRefreshingList ||
      isSwitchingRef.current ||
      isRestartingRef.current ||
      cameraState.status === 'paused'
    ) {
      return;
    }

    if (!isMediaDevicesApiAvailable()) {
      return;
    }

    const generation = operationGenerationRef.current;
    setIsRefreshingList(true);

    try {
      let nextDevices: CameraDeviceOption[];

      try {
        nextDevices = await enumerateVideoInputDevices();
      } catch {
        if (!canApplyOperationResult(generation)) {
          return;
        }

        setDeviceListError(createEnumerationFailedError());
        return;
      }

      if (!canApplyOperationResult(generation)) {
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
      if (canApplyOperationResult(generation)) {
        setIsRefreshingList(false);
      }
    }
  }, [
    activeDeviceId,
    cameraState.status,
    canApplyOperationResult,
    handleActiveDeviceRemoved,
    isRefreshingList,
  ]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      isManualStopRef.current = true;
      operationGenerationRef.current += 1;
      isRequestingRef.current = false;
      isSwitchingRef.current = false;
      isRestartingRef.current = false;
      releaseAllCameraMedia();
    };
  }, [releaseAllCameraMedia]);

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
      navigator.mediaDevices?.removeEventListener(
        'devicechange',
        handleDeviceChange
      );
    };
  }, [cameraState.status, refreshDeviceList]);

  async function finalizeStreamActivation(
    stream: MediaStream,
    generation: number
  ): Promise<boolean> {
    pendingStreamRef.current = stream;

    if (!canApplyOperationResult(generation)) {
      releaseStream(stream);
      return false;
    }

    if (stream.getAudioTracks().length > 0) {
      releaseStream(stream);
      if (!canApplyOperationResult(generation)) {
        return false;
      }

      setCameraState(
        createCameraStateFromError(createUnexpectedAudioTrackError())
      );
      return false;
    }

    const videoElement = videoRef.current;

    if (!videoElement) {
      releaseStream(stream);
      if (!canApplyOperationResult(generation)) {
        return false;
      }

      setCameraState(createCameraStateFromError(createPlaybackFailedError()));
      return false;
    }

    try {
      await attachStreamToVideo(videoElement, stream);
    } catch {
      releaseStream(stream);
      if (!canApplyOperationResult(generation)) {
        return false;
      }

      setCameraState(createCameraStateFromError(createPlaybackFailedError()));
      return false;
    }

    if (!canApplyOperationResult(generation)) {
      releaseStream(stream);
      return false;
    }

    pendingStreamRef.current = null;
    streamRef.current = stream;
    isManualStopRef.current = false;
    attachTrackEndedListener(stream);

    const adoptedTrack = getPrimaryVideoTrack(stream);

    if (!adoptedTrack) {
      releaseStream(stream);
      if (!canApplyOperationResult(generation)) {
        return false;
      }

      setCameraState(createCameraStateFromError(createPlaybackFailedError()));
      return false;
    }

    if (adoptedTrack.readyState === 'ended') {
      handleActiveDeviceRemoved();
      return false;
    }

    setHasValidActiveTrack(true);
    setHasValidPausedTrack(false);
    setCameraState(createCameraState('active'));
    setActiveDeviceId(getActiveDeviceIdFromStream(stream));
    await loadDeviceList(generation);
    return true;
  }

  async function handleStartCamera() {
    if (
      isRequestingRef.current ||
      isSwitchingRef.current ||
      isRestartingRef.current ||
      cameraState.status === 'active' ||
      cameraState.status === 'paused' ||
      cameraState.status === 'requesting' ||
      cameraState.status === 'switching' ||
      cameraState.status === 'restarting'
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
    isManualStopRef.current = true;
    isRequestingRef.current = true;
    stopActiveStream();
    resetDeviceState();
    setCameraState(createCameraState('requesting'));

    try {
      const stream = await requestVideoStream();
      pendingStreamRef.current = stream;
      await finalizeStreamActivation(stream, generation);
    } catch (error) {
      if (!canApplyOperationResult(generation)) {
        return;
      }

      const presentationError = await classifyGetUserMediaError(error);

      if (!canApplyOperationResult(generation)) {
        return;
      }

      setCameraState(createCameraStateFromError(presentationError));
    } finally {
      if (generation === operationGenerationRef.current) {
        isRequestingRef.current = false;
      }
    }
  }

  function handlePauseCamera() {
    if (
      isRequestingRef.current ||
      isSwitchingRef.current ||
      isRestartingRef.current ||
      cameraState.status !== 'active'
    ) {
      return;
    }

    const stream = streamRef.current;

    if (!stream || !isVideoTrackPausable(stream)) {
      return;
    }

    if (!pauseVideoTrack(stream)) {
      handleActiveDeviceRemoved();
      return;
    }

    setRestartWarning(null);
    setSwitchError(null);
    setHasValidActiveTrack(false);
    setHasValidPausedTrack(true);
    setCameraState(createCameraState('paused'));
  }

  function handleResumeCamera() {
    if (
      isRequestingRef.current ||
      isSwitchingRef.current ||
      isRestartingRef.current ||
      cameraState.status !== 'paused'
    ) {
      return;
    }

    const stream = streamRef.current;

    if (!stream) {
      stopActiveStream();
      setCameraState(createCameraState('idle'));
      return;
    }

    if (!isVideoTrackResumable(stream)) {
      invalidateOperations();
      isManualStopRef.current = true;
      stopActiveStream();
      setCameraState(
        createCameraState('idle', createDeviceDisconnectedError())
      );
      return;
    }

    if (!resumeVideoTrack(stream)) {
      handleActiveDeviceRemoved();
      return;
    }

    setHasValidActiveTrack(true);
    setHasValidPausedTrack(false);
    setCameraState(createCameraState('active'));
  }

  async function handleRestartCamera() {
    if (
      isRestartingRef.current ||
      isRequestingRef.current ||
      isSwitchingRef.current ||
      (cameraState.status !== 'active' && cameraState.status !== 'paused')
    ) {
      return;
    }

    if (!isMediaDevicesApiAvailable()) {
      return;
    }

    const savedDeviceId = activeDeviceId;
    const generation = ++operationGenerationRef.current;
    isManualStopRef.current = true;
    isRestartingRef.current = true;
    setRestartWarning(null);
    setSwitchError(null);
    stopActiveStream();
    setCameraState(createCameraState('restarting'));

    try {
      let stream: MediaStream;
      let usedDefaultFallback = false;

      try {
        stream = savedDeviceId
          ? await requestVideoStreamForDevice(savedDeviceId)
          : await requestVideoStream();
      } catch (error) {
        if (savedDeviceId && isMissingDeviceError(error)) {
          await loadDeviceList(generation);

          if (!canApplyOperationResult(generation)) {
            return;
          }

          stream = await requestVideoStream();
          usedDefaultFallback = true;
        } else {
          throw error;
        }
      }

      pendingStreamRef.current = stream;
      const activated = await finalizeStreamActivation(stream, generation);

      if (!activated) {
        return;
      }

      if (usedDefaultFallback && canApplyOperationResult(generation)) {
        setRestartWarning(createDeviceUnavailableRestartWarning());
      }
    } catch (error) {
      if (!canApplyOperationResult(generation)) {
        return;
      }

      stopActiveStream();
      setActiveDeviceId(null);
      const presentationError = await classifyGetUserMediaError(error);

      if (!canApplyOperationResult(generation)) {
        return;
      }

      setCameraState(createCameraStateFromError(presentationError));
    } finally {
      if (generation === operationGenerationRef.current) {
        isRestartingRef.current = false;
      }
    }
  }

  async function handleSwitchDevice(selectedDeviceId: string) {
    if (
      !selectedDeviceId ||
      selectedDeviceId === activeDeviceId ||
      isSwitchingRef.current ||
      isRestartingRef.current ||
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
    setRestartWarning(null);
    setCameraState(createCameraState('switching'));

    const previousStream = streamRef.current;
    const previousDeviceId = activeDeviceId;
    const videoElement = videoRef.current;
    let nextStream: MediaStream | null = null;

    try {
      nextStream = await requestVideoStreamForDevice(selectedDeviceId);
      pendingStreamRef.current = nextStream;

      if (!canApplyOperationResult(generation)) {
        releaseStream(nextStream);
        return;
      }

      if (nextStream.getAudioTracks().length > 0) {
        releaseStream(nextStream);
        if (!canApplyOperationResult(generation)) {
          return;
        }

        setSwitchError(
          classifySwitchDeviceError(new Error('unexpected-audio'), true)
        );
        setCameraState(createCameraState('active'));
        return;
      }

      if (!videoElement) {
        releaseStream(nextStream);
        if (!canApplyOperationResult(generation)) {
          return;
        }

        setSwitchError(classifySwitchDeviceError(new Error('no-video'), true));
        setCameraState(createCameraState('active'));
        return;
      }

      try {
        await attachStreamToVideo(videoElement, nextStream);
      } catch {
        releaseStream(nextStream);
        if (!canApplyOperationResult(generation)) {
          return;
        }

        if (previousStream) {
          videoElement.srcObject = previousStream;
        }

        setSwitchError(
          classifySwitchDeviceError(new Error('playback-failed'), true)
        );
        setCameraState(createCameraState('active'));
        return;
      }

      if (!canApplyOperationResult(generation)) {
        releaseStream(nextStream);
        return;
      }

      detachTrackEndedListener();
      isManualStopRef.current = true;
      releaseStream(previousStream);
      isManualStopRef.current = false;
      pendingStreamRef.current = null;
      streamRef.current = nextStream;
      attachTrackEndedListener(nextStream);

      const adoptedTrack = getPrimaryVideoTrack(nextStream);

      if (adoptedTrack?.readyState === 'ended') {
        handleActiveDeviceRemoved();
        return;
      }

      const confirmedDeviceId =
        getActiveDeviceIdFromStream(nextStream) ?? selectedDeviceId;

      setActiveDeviceId(confirmedDeviceId);
      setSwitchError(null);
      setHasValidActiveTrack(true);
      setHasValidPausedTrack(false);
      setCameraState(createCameraState('active'));
      await loadDeviceList(generation);
    } catch (error) {
      if (nextStream && streamRef.current !== nextStream) {
        releaseStream(nextStream);
      }

      if (!canApplyOperationResult(generation)) {
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
        setHasValidActiveTrack(true);
        setHasValidPausedTrack(false);
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

  function handleStopCamera() {
    invalidateOperations();
    isManualStopRef.current = true;
    isRequestingRef.current = false;
    isSwitchingRef.current = false;
    isRestartingRef.current = false;
    stopActiveStream();
    resetDeviceState();

    if (!isMountedRef.current) {
      return;
    }

    setCameraState(createCameraState('idle'));
  }

  function handleRetry() {
    setCameraState(createCameraState('idle'));
    void handleStartCamera();
  }

  function handleRefreshDeviceList() {
    void refreshDeviceList();
  }

  const isPreviewVisible =
    cameraState.status === 'active' || cameraState.status === 'switching';
  const isPaused = cameraState.status === 'paused';
  const isRestarting = cameraState.status === 'restarting';
  const isRequesting = cameraState.status === 'requesting';
  const isSwitching = cameraState.status === 'switching';
  const operationInProgress = isRequesting || isSwitching || isRestarting;
  const primaryError = cameraState.error;
  const showActivate = cameraState.status === 'idle';
  const showPrimaryRetry =
    primaryError !== null &&
    primaryError.canRetry &&
    (cameraState.status === 'denied' ||
      cameraState.status === 'error' ||
      cameraState.status === 'unavailable' ||
      cameraState.status === 'idle');
  const hasActiveOrPausedStream =
    cameraState.status === 'active' ||
    cameraState.status === 'paused' ||
    cameraState.status === 'switching' ||
    cameraState.status === 'restarting';
  const showDeviceSelector =
    cameraState.status === 'active' ||
    cameraState.status === 'switching' ||
    cameraState.status === 'paused';
  const showRefreshButton =
    showDeviceSelector &&
    cameraState.status !== 'paused' &&
    (deviceListError !== null || !supportsDeviceChangeEvent());
  const canPause = cameraState.status === 'active';
  const canResume = cameraState.status === 'paused';
  const canRestart = hasActiveOrPausedStream;
  const canStop = hasActiveOrPausedStream;

  return (
    <div className="mt-8 space-y-6">
      <CameraStatus
        error={cameraState.error}
        hasValidActiveTrack={hasValidActiveTrack}
        hasValidPausedTrack={hasValidPausedTrack}
        isRefreshingDevices={isRefreshingList}
        status={cameraState.status}
      />

      <section aria-labelledby="camera-preview-heading" className="space-y-3">
        <h2 id="camera-preview-heading" className="sr-only">
          Prévia da câmera
        </h2>

        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
          {!isPreviewVisible ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
              {isPaused ? (
                <>
                  <Pause aria-hidden="true" className="size-8 text-zinc-500" />
                  <p className="text-sm font-medium text-zinc-300">
                    Câmera pausada
                  </p>
                  <p className="text-sm text-zinc-400">
                    A prévia foi interrompida temporariamente. O stream continua
                    em memória — selecione Retomar para reutilizá-lo sem nova
                    permissão. Para liberar completamente a câmera, use Encerrar
                    câmera.
                  </p>
                </>
              ) : isRestarting ? (
                <>
                  <VideoOff
                    aria-hidden="true"
                    className="size-8 text-zinc-500"
                  />
                  <p className="text-sm font-medium text-zinc-300">
                    Reiniciando câmera...
                  </p>
                  <p className="text-sm text-zinc-400">
                    Aguarde enquanto um novo stream é solicitado.
                  </p>
                </>
              ) : (
                <>
                  <VideoOff
                    aria-hidden="true"
                    className="size-8 text-zinc-500"
                  />
                  <p className="text-sm text-zinc-400">
                    A câmera está desligada
                  </p>
                  <p className="text-sm text-zinc-500">
                    {cameraState.status === 'unavailable'
                      ? 'Verifique o navegador, a permissão e a conexão segura antes de tentar novamente.'
                      : 'Selecione "Iniciar câmera" para solicitar permissão.'}
                  </p>
                </>
              )}
            </div>
          ) : null}

          <video
            ref={videoRef}
            autoPlay
            className={cn(
              'size-full object-cover',
              isPreviewVisible ? 'block' : 'hidden',
              isMirrored && '[transform:scaleX(-1)]'
            )}
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
            isRetryDisabled={operationInProgress}
            streamActive={isPreviewVisible}
            onRetry={showPrimaryRetry ? handleRetry : undefined}
          />
        ) : null}

        {switchError ? (
          <CameraErrorMessage
            error={switchError}
            streamActive={isPreviewVisible}
          />
        ) : null}

        {restartWarning ? (
          <CameraErrorMessage
            error={restartWarning}
            streamActive={isPreviewVisible}
          />
        ) : null}
      </section>

      {isPreviewVisible ? (
        <CameraMirrorControl
          checked={isMirrored}
          onCheckedChange={(checked) => {
            setIsMirrored(checked === true);
          }}
        />
      ) : null}

      {showDeviceSelector ? (
        <CameraDeviceSelect
          activeDeviceId={activeDeviceId}
          devices={devices}
          disabled={cameraState.status === 'paused'}
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

      {cameraState.status === 'paused' ? (
        <p className="text-sm text-zinc-400">
          Retome a câmera antes de trocar de dispositivo.
        </p>
      ) : null}

      {deviceListError ? (
        <CameraErrorMessage
          error={deviceListError}
          isRefreshDisabled={isRefreshingList || isSwitching || isRestarting}
          streamActive={isPreviewVisible}
          onRefreshDevices={handleRefreshDeviceList}
        />
      ) : null}

      <CameraControls
        canPause={canPause}
        canRestart={canRestart}
        canResume={canResume}
        canStop={canStop}
        isRequesting={isRequesting}
        isRestarting={isRestarting}
        isSwitching={isSwitching}
        showActivate={showActivate}
        showPrimaryRetry={showPrimaryRetry}
        onPause={handlePauseCamera}
        onRestart={() => {
          void handleRestartCamera();
        }}
        onResume={handleResumeCamera}
        onRetry={handleRetry}
        onStart={() => {
          void handleStartCamera();
        }}
        onStop={handleStopCamera}
      />
    </div>
  );
}
