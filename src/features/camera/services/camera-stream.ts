export const VIDEO_ONLY_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: 'user' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
};

export type ReleaseMediaStreamOptions = {
  videoElement?: HTMLVideoElement | null;
  endedHandler?: EventListener | null;
};

export function createDeviceVideoConstraints(
  deviceId: string
): MediaStreamConstraints {
  return {
    video: {
      deviceId: {
        exact: deviceId,
      },
    },
    audio: false,
  };
}

export function requestVideoStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia(VIDEO_ONLY_CONSTRAINTS);
}

export function requestVideoStreamForDevice(
  deviceId: string
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia(
    createDeviceVideoConstraints(deviceId)
  );
}

export function getAssignedMediaStream(
  videoElement: HTMLVideoElement | null
): MediaStream | null {
  if (videoElement?.srcObject instanceof MediaStream) {
    return videoElement.srcObject;
  }

  return null;
}

/**
 * Stops every track on a stream without depending on the `ended` event.
 * Idempotent: a missing stream, a repeated call, or already-ended tracks are safe.
 * Clears `video.srcObject` only when it still points at the released stream.
 */
export function releaseMediaStream(
  stream: MediaStream | null,
  options: ReleaseMediaStreamOptions = {}
): void {
  if (!stream) {
    return;
  }

  const { videoElement = null, endedHandler = null } = options;

  for (const track of stream.getTracks()) {
    if (endedHandler) {
      track.removeEventListener('ended', endedHandler);
    }

    track.stop();
  }

  if (videoElement && videoElement.srcObject === stream) {
    videoElement.srcObject = null;
  }
}

export async function attachStreamToVideo(
  videoElement: HTMLVideoElement,
  stream: MediaStream
): Promise<void> {
  videoElement.srcObject = stream;

  try {
    await videoElement.play();
  } catch {
    throw new Error('playback-failed');
  }
}

export function getPrimaryVideoTrack(
  stream: MediaStream
): MediaStreamTrack | null {
  return stream.getVideoTracks()[0] ?? null;
}

export function isVideoTrackLive(
  track: MediaStreamTrack | null
): track is MediaStreamTrack {
  return track !== null && track.readyState === 'live';
}

export function isVideoTrackPausable(stream: MediaStream): boolean {
  const track = getPrimaryVideoTrack(stream);

  if (!isVideoTrackLive(track)) {
    return false;
  }

  return track.enabled;
}

export function isVideoTrackResumable(stream: MediaStream): boolean {
  const track = getPrimaryVideoTrack(stream);

  if (!isVideoTrackLive(track)) {
    return false;
  }

  return !track.enabled;
}

export function pauseVideoTrack(stream: MediaStream): boolean {
  const track = getPrimaryVideoTrack(stream);

  if (!isVideoTrackLive(track)) {
    return false;
  }

  track.enabled = false;
  return track.enabled === false;
}

export function resumeVideoTrack(stream: MediaStream): boolean {
  const track = getPrimaryVideoTrack(stream);

  if (!isVideoTrackLive(track)) {
    return false;
  }

  track.enabled = true;
  return track.enabled === true && track.readyState === 'live';
}

export function hasValidActiveVideoTrack(stream: MediaStream | null): boolean {
  if (!stream) {
    return false;
  }

  const track = getPrimaryVideoTrack(stream);

  return (
    isVideoTrackLive(track) &&
    track.enabled &&
    stream.getVideoTracks().length > 0
  );
}

export function hasValidPausedVideoTrack(stream: MediaStream | null): boolean {
  if (!stream) {
    return false;
  }

  const track = getPrimaryVideoTrack(stream);

  return (
    isVideoTrackLive(track) &&
    !track.enabled &&
    stream.getVideoTracks().length > 0
  );
}
