import { type Mock, vi } from 'vitest';

import {
  DEFAULT_VIDEO_DEVICES,
  resolveRequestedDeviceId,
} from './media-devices';
import { createFakeMediaStream } from './media-stream';

type NavigatorWithMedia = Navigator & {
  mediaDevices?: MediaDevices;
  permissions?: Permissions;
};

export type BrowserMediaMocks = {
  getUserMedia: Mock<
    (constraints?: MediaStreamConstraints) => Promise<MediaStream>
  >;
  enumerateDevices: Mock<() => Promise<MediaDeviceInfo[]>>;
  permissionsQuery: Mock<
    (descriptor: PermissionDescriptor) => Promise<PermissionStatus>
  >;
  play: Mock<() => Promise<void>>;
  streams: MediaStream[];
  emitDeviceChange: () => void;
  restore: () => void;
};

type InstallBrowserMediaMocksOptions = {
  secureContext?: boolean;
  devices?: MediaDeviceInfo[];
  permissionState?: PermissionState | null;
  createStream?: (constraints?: MediaStreamConstraints) => MediaStream;
};

function defineConfigurable<T extends object>(
  target: T,
  key: PropertyKey,
  value: unknown
): void {
  Object.defineProperty(target, key, {
    configurable: true,
    writable: true,
    value,
  });
}

export function setSecureContext(value: boolean): void {
  defineConfigurable(window, 'isSecureContext', value);
}

export function removeMediaDevices(): void {
  defineConfigurable(navigator, 'mediaDevices', undefined);
}

export function installBrowserMediaMocks(
  options: InstallBrowserMediaMocksOptions = {}
): BrowserMediaMocks {
  const navigatorWithMedia = navigator as NavigatorWithMedia;
  const originalMediaDevices = navigatorWithMedia.mediaDevices;
  const originalPermissions = navigatorWithMedia.permissions;
  const originalSecureContext = window.isSecureContext;
  const streams: MediaStream[] = [];
  const deviceChangeListeners = new Set<EventListener>();

  setSecureContext(options.secureContext ?? true);

  const getUserMedia = vi.fn(
    async (constraints?: MediaStreamConstraints): Promise<MediaStream> => {
      const stream =
        options.createStream?.(constraints) ??
        createFakeMediaStream({
          deviceId: resolveRequestedDeviceId(constraints),
        });
      streams.push(stream);
      return stream;
    }
  );

  const enumerateDevices = vi.fn(
    async () => options.devices ?? DEFAULT_VIDEO_DEVICES
  );

  const addEventListener = vi.fn(
    (type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === 'devicechange' && typeof listener === 'function') {
        deviceChangeListeners.add(listener);
      }
    }
  );

  const removeEventListener = vi.fn(
    (type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === 'devicechange' && typeof listener === 'function') {
        deviceChangeListeners.delete(listener);
      }
    }
  );

  const mediaDevices = {
    getUserMedia,
    enumerateDevices,
    addEventListener,
    removeEventListener,
  };

  defineConfigurable(navigator, 'mediaDevices', mediaDevices);

  const permissionsQuery = vi.fn(
    async (): Promise<PermissionStatus> =>
      ({
        state: options.permissionState ?? 'prompt',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
      }) as unknown as PermissionStatus
  );

  if (options.permissionState === null) {
    defineConfigurable(navigator, 'permissions', undefined);
  } else {
    defineConfigurable(navigator, 'permissions', {
      query: permissionsQuery,
    });
  }

  const play = vi
    .spyOn(HTMLMediaElement.prototype, 'play')
    .mockResolvedValue(undefined) as unknown as Mock<() => Promise<void>>;

  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  return {
    getUserMedia,
    enumerateDevices,
    permissionsQuery,
    play,
    streams,
    emitDeviceChange() {
      for (const listener of deviceChangeListeners) {
        listener(new Event('devicechange'));
      }
    },
    restore() {
      warn.mockRestore();
      play.mockRestore();

      defineConfigurable(
        navigator,
        'mediaDevices',
        originalMediaDevices ?? {
          getUserMedia: vi.fn(),
          enumerateDevices: vi.fn(async () => []),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }
      );

      if (originalPermissions) {
        defineConfigurable(navigator, 'permissions', originalPermissions);
      } else {
        defineConfigurable(navigator, 'permissions', undefined);
      }

      defineConfigurable(window, 'isSecureContext', originalSecureContext);
    },
  };
}
