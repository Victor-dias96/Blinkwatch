import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CameraStatus } from '@/features/camera/components/CameraStatus';
import { createCameraPresentationError } from '@/features/camera/errors/camera-error';

describe('CameraStatus', () => {
  it('renders the idle title and description without a live region', () => {
    render(
      <CameraStatus
        error={null}
        hasValidActiveTrack={false}
        hasValidPausedTrack={false}
        status="idle"
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Câmera desligada' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Inicie a câmera quando estiver pronto para continuar.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/Câmera desligada\./)).not.toBeInTheDocument();
  });

  it('announces an active camera through a polite live region', () => {
    render(
      <CameraStatus
        error={null}
        hasValidActiveTrack
        hasValidPausedTrack={false}
        status="active"
      />
    );

    const announcement = screen.getByText(
      'Câmera ativa. A prévia está sendo exibida apenas neste dispositivo.'
    );
    expect(announcement).toHaveAttribute('aria-live', 'polite');
    expect(announcement).toHaveClass('sr-only');
  });

  it('keeps the active title when a recoverable error is shown elsewhere', () => {
    render(
      <CameraStatus
        error={createCameraPresentationError('enumeration-failed')}
        hasValidActiveTrack
        hasValidPausedTrack={false}
        status="active"
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Câmera ativa' })
    ).toBeInTheDocument();
  });
});
