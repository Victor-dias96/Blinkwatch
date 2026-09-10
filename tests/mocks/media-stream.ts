import { vi } from 'vitest';

export function installMediaStreamPolyfill(): void {
  if (typeof globalThis.MediaStream !== 'undefined') {
    return;
  }

  class MediaStreamPolyfill {
    getTracks(): MediaStreamTrack[] {
      return [];
    }

    getVideoTracks(): MediaStreamTrack[] {
      return [];
    }

    getAudioTracks(): MediaStreamTrack[] {
      return [];
    }
  }

  Object.defineProperty(globalThis, 'MediaStream', {
    configurable: true,
    writable: true,
    value: MediaStreamPolyfill,
  });
}

type FakeTrackOptions = {
  deviceId?: string;
  kind?: 'audio' | 'video';
  enabled?: boolean;
  readyState?: MediaStreamTrackState;
};

installMediaStreamPolyfill();

export class FakeMediaStreamTrack extends EventTarget {
  readonly kind: 'audio' | 'video';
  readonly deviceId: string;
  enabled: boolean;
  readyState: MediaStreamTrackState;
  readonly stop: ReturnType<typeof vi.fn>;
  readonly getSettings: ReturnType<typeof vi.fn>;

  constructor(options: FakeTrackOptions = {}) {
    super();
    this.kind = options.kind ?? 'video';
    this.deviceId = options.deviceId ?? 'cam-front';
    this.enabled = options.enabled ?? true;
    this.readyState = options.readyState ?? 'live';
    this.stop = vi.fn(() => {
      this.readyState = 'ended';
    });
    this.getSettings = vi.fn(() => ({
      deviceId: this.deviceId,
    }));
  }
}

export class FakeMediaStream {
  readonly id: string;
  private readonly tracks: FakeMediaStreamTrack[];

  constructor(tracks: FakeMediaStreamTrack[], id = 'fake-stream') {
    this.tracks = tracks;
    this.id = id;
  }

  getTracks(): FakeMediaStreamTrack[] {
    return [...this.tracks];
  }

  getVideoTracks(): FakeMediaStreamTrack[] {
    return this.tracks.filter((track) => track.kind === 'video');
  }

  getAudioTracks(): FakeMediaStreamTrack[] {
    return this.tracks.filter((track) => track.kind === 'audio');
  }
}

Object.setPrototypeOf(FakeMediaStream.prototype, MediaStream.prototype);

export function createFakeMediaStream(
  options: {
    deviceId?: string;
    audio?: boolean;
    enabled?: boolean;
    ended?: boolean;
    id?: string;
  } = {}
): MediaStream {
  const videoTrack = new FakeMediaStreamTrack({
    kind: 'video',
    deviceId: options.deviceId ?? 'cam-front',
    enabled: options.enabled ?? true,
    readyState: options.ended ? 'ended' : 'live',
  });
  const tracks = [videoTrack];

  if (options.audio) {
    tracks.push(
      new FakeMediaStreamTrack({
        kind: 'audio',
        deviceId: 'mic-1',
      })
    );
  }

  return new FakeMediaStream(tracks, options.id) as unknown as MediaStream;
}

export function getFakeVideoTrack(
  stream: MediaStream
): FakeMediaStreamTrack | undefined {
  return stream.getVideoTracks()[0] as unknown as
    FakeMediaStreamTrack | undefined;
}
