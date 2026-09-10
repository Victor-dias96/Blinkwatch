import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  classifyDomExceptionName,
  classifyGetUserMediaError,
  classifySwitchDeviceError,
  classifyUnknownError,
  createCameraPresentationError,
  createCameraStateFromError,
  createDeviceDisconnectedError,
  createDeviceUnavailableRestartWarning,
  createEnumerationFailedError,
  createPlaybackFailedError,
  createPreActivationError,
  isMediaDevicesApiAvailable,
  isMissingDeviceError,
  isSecureBrowserContext,
  mapErrorCodeToCameraStatus,
  queryCameraPermissionState,
} from '@/features/camera/errors/camera-error';

import {
  installBrowserMediaMocks,
  removeMediaDevices,
  setSecureContext,
} from '../../../../tests/mocks/browser-media';

describe('createCameraPresentationError', () => {
  it.each([
    ['unsupported', false],
    ['insecure-context', false],
    ['permission-blocked', false],
    ['permission-denied', true],
    ['device-not-found', true],
    ['device-busy', true],
    ['switch-failed', true],
  ] as const)('%s has canRetry=%s', (code, canRetry) => {
    expect(createCameraPresentationError(code).canRetry).toBe(canRetry);
  });

  it('allows presentation overrides without exposing raw browser text', () => {
    const error = createCameraPresentationError('unknown', {
      message: 'Não foi possível ativar a câmera com a configuração esperada.',
    });

    expect(error.message).toContain('configuração esperada');
    expect(error.code).toBe('unknown');
  });
});

describe('classifyDomExceptionName', () => {
  it.each([
    ['NotAllowedError', 'permission-denied'],
    ['NotFoundError', 'device-not-found'],
    ['NotReadableError', 'device-busy'],
    ['OverconstrainedError', 'constraints-not-supported'],
    ['AbortError', 'request-aborted'],
    ['InvalidStateError', 'inactive-document'],
    ['SecurityError', 'permission-denied'],
    ['SomethingElse', 'unknown'],
  ] as const)('maps %s to %s', (name, code) => {
    expect(classifyDomExceptionName(name)).toBe(code);
  });
});

describe('classifyUnknownError', () => {
  let mocks: ReturnType<typeof installBrowserMediaMocks>;

  beforeEach(() => {
    mocks = installBrowserMediaMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    mocks.restore();
  });

  it('uses permission-blocked when NotAllowedError coincides with a denied permission', () => {
    expect(
      classifyUnknownError(
        new DOMException('Denied', 'NotAllowedError'),
        'denied'
      )
    ).toBe('permission-blocked');
  });

  it('keeps permission-denied when the user can still be prompted', () => {
    expect(
      classifyUnknownError(
        new DOMException('Denied', 'NotAllowedError'),
        'prompt'
      )
    ).toBe('permission-denied');
  });

  it('classifies NotAllowedError as insecure-context outside a secure context', () => {
    setSecureContext(false);
    expect(
      classifyUnknownError(new DOMException('Denied', 'NotAllowedError'))
    ).toBe('insecure-context');
  });

  it('classifies NotAllowedError as unsupported when mediaDevices is missing', () => {
    removeMediaDevices();
    expect(
      classifyUnknownError(new DOMException('Denied', 'NotAllowedError'))
    ).toBe('unsupported');
  });

  it('classifies SecurityError as insecure-context when the page is not secure', () => {
    setSecureContext(false);
    expect(
      classifyUnknownError(new DOMException('Blocked', 'SecurityError'))
    ).toBe('insecure-context');
  });

  it('classifies TypeError as unsupported when the media API is absent', () => {
    removeMediaDevices();
    expect(
      classifyUnknownError(new TypeError('getUserMedia is not a function'))
    ).toBe('unsupported');
  });

  it('returns unknown for non-DOM errors in a capable secure context', () => {
    expect(classifyUnknownError(new Error('unexpected'))).toBe('unknown');
    expect(classifyUnknownError('string-error')).toBe('unknown');
  });
});

describe('mapErrorCodeToCameraStatus', () => {
  it('maps permission, environment and disconnect codes to technical states', () => {
    expect(mapErrorCodeToCameraStatus('permission-denied')).toBe('denied');
    expect(mapErrorCodeToCameraStatus('permission-blocked')).toBe('denied');
    expect(mapErrorCodeToCameraStatus('unsupported')).toBe('unavailable');
    expect(mapErrorCodeToCameraStatus('insecure-context')).toBe('unavailable');
    expect(mapErrorCodeToCameraStatus('device-not-found')).toBe('unavailable');
    expect(mapErrorCodeToCameraStatus('device-disconnected')).toBe('idle');
    expect(mapErrorCodeToCameraStatus('playback-failed')).toBe('error');
  });
});

describe('error factories', () => {
  it('builds a camera state from a presentation error', () => {
    const error = createPreActivationError('insecure-context');
    expect(createCameraStateFromError(error)).toEqual({
      status: 'unavailable',
      error,
    });
  });

  it('creates specialized presentation errors used by the controller', () => {
    expect(createDeviceDisconnectedError().code).toBe('device-disconnected');
    expect(createEnumerationFailedError().code).toBe('enumeration-failed');
    expect(createPlaybackFailedError().code).toBe('playback-failed');
    expect(createDeviceUnavailableRestartWarning().severity).toBe('warning');
  });

  it('detects missing-device failures used for restart fallback', () => {
    expect(
      isMissingDeviceError(new DOMException('None', 'NotFoundError'))
    ).toBe(true);
    expect(
      isMissingDeviceError(
        new DOMException('Overconstrained', 'OverconstrainedError')
      )
    ).toBe(true);
    expect(
      isMissingDeviceError(new DOMException('Busy', 'NotReadableError'))
    ).toBe(false);
  });
});

describe('classifySwitchDeviceError', () => {
  let mocks: ReturnType<typeof installBrowserMediaMocks>;

  beforeEach(() => {
    mocks = installBrowserMediaMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    mocks.restore();
  });

  it('reports switch-failed when the previous stream remains live', () => {
    const error = classifySwitchDeviceError(
      new DOMException('Busy', 'NotReadableError'),
      true
    );
    expect(error.code).toBe('switch-failed');
  });

  it('keeps the underlying device code when the previous stream cannot be preserved', () => {
    const error = classifySwitchDeviceError(
      new DOMException('Gone', 'NotFoundError'),
      false
    );
    expect(error.code).toBe('device-not-found');
  });
});

describe('environment and permission probes', () => {
  let mocks: ReturnType<typeof installBrowserMediaMocks>;

  beforeEach(() => {
    mocks = installBrowserMediaMocks();
  });

  afterEach(() => {
    mocks.restore();
  });

  it('detects a secure context and an available media API', () => {
    expect(isSecureBrowserContext()).toBe(true);
    expect(isMediaDevicesApiAvailable()).toBe(true);
  });

  it('returns null when the Permissions API is missing', async () => {
    mocks.restore();
    installBrowserMediaMocks({ permissionState: null });
    await expect(queryCameraPermissionState()).resolves.toBeNull();
  });

  it('returns a supported permission state when the query succeeds', async () => {
    mocks.restore();
    installBrowserMediaMocks({ permissionState: 'granted' });
    await expect(queryCameraPermissionState()).resolves.toBe('granted');
  });

  it('classifies a getUserMedia rejection after querying permission', async () => {
    mocks.restore();
    installBrowserMediaMocks({ permissionState: 'denied' });
    const presentation = await classifyGetUserMediaError(
      new DOMException('Denied', 'NotAllowedError')
    );
    expect(presentation.code).toBe('permission-blocked');
  });
});
