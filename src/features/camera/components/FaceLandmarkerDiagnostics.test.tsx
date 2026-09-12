import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FaceLandmarkerDiagnostics } from '@/features/camera/components/FaceLandmarkerDiagnostics';

describe('FaceLandmarkerDiagnostics', () => {
  it('shows the idle copy and prepare action when preparation is allowed', async () => {
    const onPrepare = vi.fn();
    const user = userEvent.setup();
    render(
      <FaceLandmarkerDiagnostics
        canPrepare
        state={{ status: 'idle' }}
        onPrepare={onPrepare}
      />
    );

    expect(
      screen.getByRole('heading', {
        name: 'Rastreamento ainda não preparado',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Prepare o modelo local antes de iniciar a futura análise visual.'
      )
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Preparar rastreamento facial' })
    );
    expect(onPrepare).toHaveBeenCalledTimes(1);
  });

  it('hides the prepare action when the camera is not in a valid state', () => {
    render(
      <FaceLandmarkerDiagnostics
        canPrepare={false}
        state={{ status: 'idle' }}
        onPrepare={vi.fn()}
      />
    );

    expect(
      screen.queryByRole('button', { name: 'Preparar rastreamento facial' })
    ).not.toBeInTheDocument();
  });

  it('announces loading without offering a duplicate action', () => {
    render(
      <FaceLandmarkerDiagnostics
        canPrepare={false}
        state={{ status: 'loading' }}
        onPrepare={vi.fn()}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Preparando rastreamento' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Carregando os recursos locais de visão computacional.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Preparando rastreamento. Carregando os recursos locais de visão computacional.'
      )
    ).toHaveAttribute('aria-live', 'polite');
    expect(
      screen.queryByRole('button', { name: 'Preparar rastreamento facial' })
    ).not.toBeInTheDocument();
  });

  it('states that no frame is analyzed when ready', () => {
    render(
      <FaceLandmarkerDiagnostics
        canPrepare={false}
        state={{ status: 'ready' }}
        onPrepare={vi.fn()}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Rastreamento preparado' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'O modelo foi carregado. Nenhum frame está sendo analisado nesta etapa.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Preparar rastreamento facial' })
    ).not.toBeInTheDocument();
  });

  it('offers retry after a failure when preparation is still allowed', async () => {
    const onPrepare = vi.fn();
    const user = userEvent.setup();
    render(
      <FaceLandmarkerDiagnostics
        canPrepare
        state={{
          status: 'failed',
          error: {
            code: 'model-unavailable',
            message:
              'O modelo local de rastreamento facial não pôde ser carregado.',
          },
        }}
        onPrepare={onPrepare}
      />
    );

    expect(
      screen.getByRole('heading', {
        name: 'Não foi possível preparar o rastreamento',
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onPrepare).toHaveBeenCalledTimes(1);
  });
});
