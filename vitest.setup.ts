import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import { installSrcObjectPolyfill } from './tests/mocks/media-element';
import { installMediaStreamPolyfill } from './tests/mocks/media-stream';

installMediaStreamPolyfill();
installSrcObjectPolyfill();

afterEach(() => {
  cleanup();
});
