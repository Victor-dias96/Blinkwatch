import {
  cleanup,
  render,
  type RenderResult,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { expect } from 'vitest';

import { CameraPreview } from '@/features/camera/components/CameraPreview';

import type { BrowserMediaMocks } from '../../../../tests/mocks/browser-media';

export function renderCameraPreview(): {
  user: UserEvent;
  view: RenderResult;
} {
  const user = userEvent.setup();
  const view = render(<CameraPreview />);
  return { user, view };
}

export function restoreCameraPreviewMocks(mocks: BrowserMediaMocks): void {
  cleanup();
  mocks.restore();
}

export function queryStatusHeading(name: string | RegExp): HTMLElement | null {
  return screen.queryByRole('heading', { level: 2, name });
}

export function getStatusHeading(name: string | RegExp): HTMLElement {
  return screen.getByRole('heading', { level: 2, name });
}

export function findStatusHeading(name: string | RegExp): Promise<HTMLElement> {
  return screen.findByRole('heading', { level: 2, name });
}

export function getPreviewVideo(): HTMLVideoElement {
  const video = document.querySelector('video');

  if (!video) {
    throw new Error('Expected the camera preview video element to be present.');
  }

  return video;
}

export async function startCamera(user: UserEvent): Promise<void> {
  await user.click(screen.getByRole('button', { name: 'Iniciar câmera' }));
  await findStatusHeading('Câmera ativa');
  await waitFor(() => {
    expect(getPreviewVideo()).not.toHaveClass('hidden');
  });
}
