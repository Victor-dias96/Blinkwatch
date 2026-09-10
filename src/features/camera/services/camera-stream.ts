export const VIDEO_ONLY_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: 'user' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
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

export function stopMediaStream(
  stream: MediaStream | null,
  videoElement: HTMLVideoElement | null = null
): void {
  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }

  if (videoElement) {
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
