import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  attachStreamToVideo,
  createDeviceVideoConstraints,
  getAssignedMediaStream,
  getPrimaryVideoTrack,
  hasValidActiveVideoTrack,
  hasValidPausedVideoTrack,
  isVideoTrackPausable,
  isVideoTrackResumable,
  pauseVideoTrack,
  releaseMediaStream,
  requestVideoStream,
  requestVideoStreamForDevice,
  resumeVideoTrack,
  VIDEO_ONLY_CONSTRAINTS,
} from '@/features/camera/services/camera-stream';

import { installBrowserMediaMocks } from '../../../../tests/mocks/browser-media';
import {
  createFakeMediaStream,
  getFakeVideoTrack,
} from '../../../../tests/mocks/media-stream';

describe('camera-stream', () => {
  it('requests video only with an ideal user-facing 1280x720 profile', () => {
    expect(VIDEO_ONLY_CONSTRAINTS).toEqual({
      video: {
        facingMode: { ideal: 'user' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  });

  it('builds device constraints without audio', () => {
    expect(createDeviceVideoConstraints('cam-back')).toEqual({
      video: {
        deviceId: {
          exact: 'cam-back',
        },
      },
      audio: false,
    });
  });
});

describe('requestVideoStream', () => {
  let mocks: ReturnType<typeof installBrowserMediaMocks>;

  beforeEach(() => {
    mocks = installBrowserMediaMocks();
  });

  afterEach(() => {
    mocks.restore();
  });

  it('forwards VIDEO_ONLY_CONSTRAINTS to getUserMedia', async () => {
    await requestVideoStream();

    expect(mocks.getUserMedia).toHaveBeenCalledTimes(1);
    expect(mocks.getUserMedia).toHaveBeenCalledWith(VIDEO_ONLY_CONSTRAINTS);
  });

  it('requests a specific device without enabling audio', async () => {
    await requestVideoStreamForDevice('cam-back');

    expect(mocks.getUserMedia).toHaveBeenCalledWith({
      video: {
        deviceId: {
          exact: 'cam-back',
        },
      },
      audio: false,
    });
  });
});

describe('releaseMediaStream', () => {
  it('is a no-op when the stream is missing', () => {
    expect(() => {
      releaseMediaStream(null);
    }).not.toThrow();
  });

  it('stops every track and removes a provided ended listener', () => {
    const stream = createFakeMediaStream();
    const track = getFakeVideoTrack(stream);
    const endedHandler = vi.fn();

    expect(track).toBeDefined();
    track?.addEventListener('ended', endedHandler);

    releaseMediaStream(stream, { endedHandler });

    expect(track?.stop).toHaveBeenCalledTimes(1);
    expect(track?.readyState).toBe('ended');
    track?.dispatchEvent(new Event('ended'));
    expect(endedHandler).not.toHaveBeenCalled();
  });

  it('clears video.srcObject only when it still points at the released stream', () => {
    const released = createFakeMediaStream({ id: 'released' });
    const other = createFakeMediaStream({ id: 'other' });
    const video = document.createElement('video');
    video.srcObject = released;

    releaseMediaStream(released, { videoElement: video });
    expect(video.srcObject).toBeNull();

    video.srcObject = other;
    releaseMediaStream(released, { videoElement: video });
    expect(video.srcObject).toBe(other);
  });

  it('can be called twice without throwing', () => {
    const stream = createFakeMediaStream();

    releaseMediaStream(stream);
    expect(() => {
      releaseMediaStream(stream);
    }).not.toThrow();
    expect(getFakeVideoTrack(stream)?.stop).toHaveBeenCalledTimes(2);
  });
});

describe('attachStreamToVideo', () => {
  let mocks: ReturnType<typeof installBrowserMediaMocks>;

  beforeEach(() => {
    mocks = installBrowserMediaMocks();
  });

  afterEach(() => {
    mocks.restore();
  });

  it('assigns the stream and starts playback', async () => {
    const stream = createFakeMediaStream();
    const video = document.createElement('video');

    await attachStreamToVideo(video, stream);

    expect(video.srcObject).toBe(stream);
    expect(mocks.play).toHaveBeenCalledTimes(1);
  });

  it('throws playback-failed when play rejects', async () => {
    mocks.play.mockRejectedValueOnce(new Error('play interrupted'));
    const stream = createFakeMediaStream();
    const video = document.createElement('video');

    await expect(attachStreamToVideo(video, stream)).rejects.toThrow(
      'playback-failed'
    );
  });
});

describe('video track helpers', () => {
  it('identifies the primary video track', () => {
    const stream = createFakeMediaStream({ audio: true });
    expect(getPrimaryVideoTrack(stream)?.kind).toBe('video');
  });

  it('reads the assigned media stream from a video element', () => {
    const stream = createFakeMediaStream();
    const video = document.createElement('video');

    expect(getAssignedMediaStream(video)).toBeNull();
    video.srcObject = stream;
    expect(getAssignedMediaStream(video)).toBe(stream);
  });

  it('pauses and resumes a live track without stopping it', () => {
    const stream = createFakeMediaStream();
    const track = getFakeVideoTrack(stream);

    expect(isVideoTrackPausable(stream)).toBe(true);
    expect(pauseVideoTrack(stream)).toBe(true);
    expect(track?.enabled).toBe(false);
    expect(track?.readyState).toBe('live');
    expect(hasValidPausedVideoTrack(stream)).toBe(true);
    expect(isVideoTrackResumable(stream)).toBe(true);

    expect(resumeVideoTrack(stream)).toBe(true);
    expect(track?.enabled).toBe(true);
    expect(track?.stop).not.toHaveBeenCalled();
    expect(hasValidActiveVideoTrack(stream)).toBe(true);
  });

  it('rejects pause and resume when the track has already ended', () => {
    const stream = createFakeMediaStream({ ended: true });

    expect(isVideoTrackPausable(stream)).toBe(false);
    expect(isVideoTrackResumable(stream)).toBe(false);
    expect(pauseVideoTrack(stream)).toBe(false);
    expect(resumeVideoTrack(stream)).toBe(false);
    expect(hasValidActiveVideoTrack(stream)).toBe(false);
    expect(hasValidPausedVideoTrack(null)).toBe(false);
  });
});
