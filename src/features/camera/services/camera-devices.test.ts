import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  enumerateVideoInputDevices,
  formatDeviceLabel,
  getActiveDeviceIdFromStream,
  mapVideoInputDevices,
  supportsDeviceChangeEvent,
} from '@/features/camera/services/camera-devices';

import {
  installBrowserMediaMocks,
  removeMediaDevices,
} from '../../../../tests/mocks/browser-media';
import { createFakeMediaDevice } from '../../../../tests/mocks/media-devices';
import { createFakeMediaStream } from '../../../../tests/mocks/media-stream';

describe('formatDeviceLabel', () => {
  it('keeps a non-empty device label', () => {
    expect(formatDeviceLabel('Câmera USB', 0)).toBe('Câmera USB');
  });

  it('falls back to a numbered generic label', () => {
    expect(formatDeviceLabel('   ', 1)).toBe('Câmera 2');
  });
});

describe('mapVideoInputDevices', () => {
  it('keeps only videoinput devices and indexes unlabeled cameras', () => {
    const devices = [
      createFakeMediaDevice({
        deviceId: 'mic',
        kind: 'audioinput',
        label: 'Microfone',
      }),
      createFakeMediaDevice({
        deviceId: 'cam-1',
        kind: 'videoinput',
        label: '',
      }),
      createFakeMediaDevice({
        deviceId: 'cam-2',
        kind: 'videoinput',
        label: 'Notebook',
      }),
    ];

    expect(mapVideoInputDevices(devices)).toEqual([
      { deviceId: 'cam-1', label: 'Câmera 1' },
      { deviceId: 'cam-2', label: 'Notebook' },
    ]);
  });
});

describe('getActiveDeviceIdFromStream', () => {
  it('reads deviceId from the primary video track settings', () => {
    const stream = createFakeMediaStream({ deviceId: 'cam-back' });
    expect(getActiveDeviceIdFromStream(stream)).toBe('cam-back');
  });

  it('returns null when no video track is present', () => {
    const audioOnly = createFakeMediaStream({ audio: true });
    audioOnly.getVideoTracks = () => [];
    expect(getActiveDeviceIdFromStream(audioOnly)).toBeNull();
  });
});

describe('enumerateVideoInputDevices', () => {
  let mocks: ReturnType<typeof installBrowserMediaMocks>;

  beforeEach(() => {
    mocks = installBrowserMediaMocks({
      devices: [
        createFakeMediaDevice({
          deviceId: 'cam-front',
          label: 'Frontal',
        }),
        createFakeMediaDevice({
          deviceId: 'speakers',
          kind: 'audiooutput',
          label: 'Alto-falantes',
        }),
      ],
    });
  });

  afterEach(() => {
    mocks.restore();
  });

  it('maps enumerated video devices through the public helper', async () => {
    await expect(enumerateVideoInputDevices()).resolves.toEqual([
      { deviceId: 'cam-front', label: 'Frontal' },
    ]);
  });
});

describe('supportsDeviceChangeEvent', () => {
  let mocks: ReturnType<typeof installBrowserMediaMocks>;

  afterEach(() => {
    mocks?.restore();
  });

  it('is true when mediaDevices event listeners exist', () => {
    mocks = installBrowserMediaMocks();
    expect(supportsDeviceChangeEvent()).toBe(true);
  });

  it('is false when mediaDevices is missing', () => {
    mocks = installBrowserMediaMocks();
    removeMediaDevices();
    expect(supportsDeviceChangeEvent()).toBe(false);
  });
});
