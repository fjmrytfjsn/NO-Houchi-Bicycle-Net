/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage, { getServerSideProps } from '../pages';
import UnresolvedPage from '../pages/unresolved';
import ReportDetailPage, {
  getServerSideProps as getReportDetailServerSideProps,
} from '../pages/reports/[id]';
import CollectionRequestPage from '../pages/collection-request/[id]';
import CollectionResultPage from '../pages/collection-result/[id]';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const { useRouter } = jest.requireMock('next/router') as {
  useRouter: jest.Mock;
};

describe('Admin Dashboard pages', () => {
  it('shows report summary and main columns on the report list page', () => {
    useRouter.mockReturnValue({ pathname: '/', query: {}, isReady: true });

    render(<HomePage reports={[]} selectedStatus="all" />);

    expect(
      screen.getByRole('heading', { level: 2, name: '通報一覧' }),
    ).toBeInTheDocument();
    expect(screen.getByText('全件')).toBeInTheDocument();
    expect(screen.getByText('未解除')).toBeInTheDocument();
    expect(screen.getByText('回収依頼中')).toBeInTheDocument();
    expect(screen.getByText('通報日時')).toBeInTheDocument();
    expect(screen.getByText('位置')).toBeInTheDocument();
    expect(screen.getByText('識別情報')).toBeInTheDocument();
  });

  it('shows API report fields on the report list page', () => {
    useRouter.mockReturnValue({ pathname: '/', query: {}, isReady: true });

    render(
      <HomePage
        reports={[
          {
            id: 'r-api-1',
            imageUrl: 'https://example.com/report-api-1.jpg',
            reportedAt: '2026-04-20 18:15',
            location: '34.705500, 135.498300',
            identifierText: 'API-0001 / 黒のシティサイクル',
            status: 'reported',
            elapsedLabel: '',
            currentStatusLabel: 'reported',
            history: [],
          },
        ]}
        selectedStatus="all"
      />,
    );

    expect(screen.getByText('2026-04-20 18:15')).toBeInTheDocument();
    expect(screen.getByText('34.705500, 135.498300')).toBeInTheDocument();
    expect(screen.getByText('API-0001 / 黒のシティサイクル')).toBeInTheDocument();
    expect(screen.getAllByText('reported')).toHaveLength(2);
    expect(
      screen.getByRole('img', { name: 'r-api-1 の写真サムネイル' }),
    ).toHaveAttribute('src', 'https://example.com/report-api-1.jpg');
  });

  it('marks the selected status filter on the report list page', () => {
    useRouter.mockReturnValue({
      pathname: '/',
      query: { status: 'temporary' },
      isReady: true,
    });

    render(<HomePage reports={[]} selectedStatus="temporary" />);

    expect(
      screen.getByRole('link', { name: 'temporary' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('marks resolved as a valid selected status filter', async () => {
    useRouter.mockReturnValue({
      pathname: '/',
      query: { status: 'resolved' },
      isReady: true,
    });

    render(<HomePage reports={[]} selectedStatus="resolved" />);

    expect(
      screen.getByRole('link', { name: 'resolved' }),
    ).toHaveAttribute('aria-current', 'page');

    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);
    global.fetch = fetchMock;

    await getServerSideProps({
      query: { status: 'resolved' },
    } as never);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/reports?status=resolved',
    );

    global.fetch = originalFetch;
  });

  it('shows an error when report list API fetch fails', () => {
    useRouter.mockReturnValue({ pathname: '/', query: {}, isReady: true });

    render(
      <HomePage
        reports={[]}
        selectedStatus="all"
        errorMessage="通報一覧を取得できませんでした。Backend API の起動状態を確認してください。"
      />,
    );

    expect(
      screen.getByText(
        '通報一覧を取得できませんでした。Backend API の起動状態を確認してください。',
      ),
    ).toBeInTheDocument();
  });

  it('fetches reports with the selected status query on the server side', async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'r-api-2',
          markerId: 'm-api-2',
          imageUrl: 'https://example.com/report-api-2.jpg',
          latitude: 34.7,
          longitude: 135.49,
          identifierText: 'API-0002',
          status: 'temporary',
          notes: null,
          createdAt: '2026-04-20T09:15:00.000Z',
          updatedAt: '2026-04-20T09:15:00.000Z',
        },
      ],
    } as Response);
    global.fetch = fetchMock;

    const result = await getServerSideProps({
      query: { status: 'temporary' },
    } as never);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/reports?status=temporary',
    );
    expect(result).toMatchObject({
      props: {
        selectedStatus: 'temporary',
        reports: [
          {
            id: 'r-api-2',
            reportedAt: '2026-04-20 18:15',
            location: '34.700000, 135.490000',
            status: 'temporary',
          },
        ],
      },
    });

    global.fetch = originalFetch;
  });

  it('shows only reported and temporary items on the unresolved page', () => {
    useRouter.mockReturnValue({
      pathname: '/unresolved',
      query: {},
      isReady: true,
    });

    render(<UnresolvedPage />);

    expect(screen.getByText('reported / temporary')).toBeInTheDocument();
    expect(screen.getByText('防犯登録 1234 / 黒のシティサイクル')).toBeInTheDocument();
    expect(screen.getByText('シール 8842 / 銀のクロスバイク')).toBeInTheDocument();
    expect(
      screen.queryByText('防犯登録 9981 / 青のママチャリ'),
    ).not.toBeInTheDocument();
  });

  it('shows overview and history on the report detail page', () => {
    useRouter.mockReturnValue({
      pathname: '/reports/[id]',
      query: { id: 'R-002' },
      isReady: true,
    });

    render(<ReportDetailPage />);

    expect(
      screen.getByRole('heading', { level: 2, name: '通報詳細' }),
    ).toBeInTheDocument();
    expect(screen.getByText('シール 8842 / 銀のクロスバイク')).toBeInTheDocument();
    expect(screen.getByText('履歴')).toBeInTheDocument();
    expect(screen.getByText('持ち主が仮解除')).toBeInTheDocument();
  });

  it('shows API-backed report detail for IDs from the report list', () => {
    useRouter.mockReturnValue({
      pathname: '/reports/[id]',
      query: { id: 'r-api-3' },
      isReady: true,
    });

    render(
      <ReportDetailPage
        report={{
          id: 'r-api-3',
          imageUrl: 'https://example.com/report-api-3.jpg',
          reportedAt: '2026-04-21 08:30',
          location: '34.710000, 135.500000',
          identifierText: 'API-0003 / 白のミニベロ',
          status: 'reported',
          elapsedLabel: '',
          currentStatusLabel: 'reported',
          history: [],
        }}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: '通報詳細' }),
    ).toBeInTheDocument();
    expect(screen.getByText('API-0003 / 白のミニベロ')).toBeInTheDocument();
    expect(screen.getByText('34.710000, 135.500000')).toBeInTheDocument();
  });

  it('fetches report detail by id on the server side', async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'r-api-4',
        markerId: 'm-api-4',
        imageUrl: 'https://example.com/report-api-4.jpg',
        latitude: 34.71,
        longitude: 135.5,
        identifierText: 'API-0004',
        status: 'collection_requested',
        notes: null,
        createdAt: '2026-04-21T00:30:00.000Z',
        updatedAt: '2026-04-21T00:30:00.000Z',
      }),
    } as Response);
    global.fetch = fetchMock;

    const result = await getReportDetailServerSideProps({
      params: { id: 'r-api-4' },
    } as never);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/reports/r-api-4',
    );
    expect(result).toMatchObject({
      props: {
        report: {
          id: 'r-api-4',
          reportedAt: '2026-04-21 09:30',
          location: '34.710000, 135.500000',
          status: 'collection_requested',
        },
      },
    });

    global.fetch = originalFetch;
  });

  it('shows the collection request form and confirmation text', () => {
    useRouter.mockReturnValue({
      pathname: '/collection-request/[id]',
      query: { id: 'R-001' },
      isReady: true,
    });

    render(<CollectionRequestPage />);

    expect(screen.getByText('回収依頼')).toBeInTheDocument();
    expect(screen.getByText('依頼メモ')).toBeInTheDocument();
    expect(screen.getByText('確認: collection_requested に更新')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '回収依頼登録' })).toBeInTheDocument();
  });

  it('shows the collection result options', () => {
    useRouter.mockReturnValue({
      pathname: '/collection-result/[id]',
      query: { id: 'R-003' },
      isReady: true,
    });

    render(<CollectionResultPage />);

    expect(screen.getByText('回収結果記録')).toBeInTheDocument();
    expect(screen.getByLabelText('回収完了')).toBeInTheDocument();
    expect(screen.getByLabelText('現地で現物なし')).toBeInTheDocument();
    expect(screen.getByText('結果メモ')).toBeInTheDocument();
  });

  it('shows loading state until dynamic route params are ready', () => {
    useRouter.mockReturnValue({
      pathname: '/reports/[id]',
      query: {},
      isReady: false,
    });

    render(<ReportDetailPage />);

    expect(screen.getByText('読み込み中…')).toBeInTheDocument();
    expect(screen.queryByText('対象の通報が見つかりません。')).not.toBeInTheDocument();
  });
});
