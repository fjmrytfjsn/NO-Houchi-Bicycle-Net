/** @jest-environment jsdom */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MarkerPage from '../pages/markers/[code]';

jest.mock('next/router', () => ({
  useRouter: () => ({ query: { code: 'ABC123' }, back: jest.fn() }),
}));

describe('MarkerPage', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('can perform temporary unlock and final unlock flow', async () => {
    // Use inline timestamps to avoid any variable name collisions

    // mock fetch implementation
    (global as any).fetch = jest.fn(async (url: string, opts?: any) => {
      if (
        url.endsWith('/api/owner/markers/ABC123') &&
        (!opts || opts.method === 'GET')
      ) {
        return {
          ok: true,
          json: async () => ({
            status: 'ok',
            data: {
              marker: { code: 'ABC123' },
              report: {
                id: 'r-ABC123',
                status: 'temporary',
                imageUrl: '',
                ocr_text: '',
              },
              declaration: {
                declaredAt: '2026-01-19T12:00:00.000Z',
                eligibleFinalAt: '2000-01-01T00:00:00.000Z',
                expiresAt: '2026-01-20T12:00:00.000Z',
                status: 'temporary',
              },
            },
          }),
        };
      }

      if (
        url.endsWith('/api/owner/markers/ABC123/unlock-temp') &&
        opts?.method === 'POST'
      ) {
        return {
          ok: true,
          json: async () => ({
            status: 'ok',
            data: {
              declaredAt: '2026-01-19T12:00:00.000Z',
              eligibleFinalAt: '2000-01-01T00:00:00.000Z',
              expiresAt: '2026-01-20T12:00:00.000Z',
              status: 'temporary',
            },
          }),
        };
      }

      if (
        url.endsWith('/api/owner/markers/ABC123/unlock-final') &&
        opts?.method === 'POST'
      ) {
        return {
          ok: true,
          json: async () => ({
            status: 'ok',
            data: { finalizedAt: new Date().toISOString(), status: 'resolved' },
          }),
        };
      }

      return { ok: false, status: 404, json: async () => ({}) };
    });

    render(<MarkerPage />);

    // wait for initial fetch
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const tempBtn = await screen.findByText('解除（仮）');
    fireEvent.click(tempBtn);

    await waitFor(() => screen.getByText('仮解除しました'));

    const finalBtn = await screen.findByText('本解除を実行');
    expect(finalBtn).toBeEnabled();

    fireEvent.click(finalBtn);

    await waitFor(() => screen.getByText('本解除が完了しました'));
  });
});
