/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HomePage, { getServerSideProps } from '../pages';
import UnresolvedPage from '../pages/unresolved';
import ReportDetailPage, {
  getServerSideProps as getReportDetailServerSideProps,
} from '../pages/reports/[id]';
import CollectionRequestPage from '../pages/collection-request/[id]';
import CollectionResultPage from '../pages/collection-result/[id]';
import LoginPage from '../pages/login';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const { useRouter } = jest.requireMock('next/router') as {
  useRouter: jest.Mock;
};

describe('Admin Dashboard pages', () => {
  it('shows report summary and main columns on the report list page', () => {
    useRouter.mockReturnValue({ pathname: '/', query: {}, isReady: true, push: jest.fn() });

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
    expect(
      screen.getByRole('link', { name: '回収依頼候補へ' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        '通報状況の確認、未解除案件の回収依頼、回収結果の記録を行う管理画面の雛形です。',
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('全通報を状態、日時、位置で確認する起点画面です。'),
    ).not.toBeInTheDocument();
  });

  it('shows API report fields on the report list page', () => {
    useRouter.mockReturnValue({ pathname: '/', query: {}, isReady: true, push: jest.fn() });

    render(
      <HomePage
        reports={[
          {
            id: 'r-api-1',
            imageUrl: 'https://example.com/report-api-1.jpg',
            reportedAt: '2026-04-20 18:15',
            location: '34.705500, 135.498300',
            latitude: 34.7055,
            longitude: 135.4983,
            address: '大阪府大阪市北区梅田1丁目1',
            mapEmbedUrl: 'https://www.google.com/maps/embed/v1/place?key=test&q=34.7055%2C135.4983',
            mapLinkUrl: 'https://www.google.com/maps?q=34.7055%2C135.4983',
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
    expect(screen.getByText('大阪府大阪市北区梅田1丁目1')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Google Mapsで開く' }),
    ).toHaveAttribute('href', 'https://www.google.com/maps?q=34.7055%2C135.4983');
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
      push: jest.fn(),
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
      push: jest.fn(),
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
      req: {
        headers: {
          cookie: 'admin_access_token=test-token',
        },
      },
    } as never);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/reports?status=resolved',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer test-token',
        }),
      }),
    );

    global.fetch = originalFetch;
  });

  it('shows an error when report list API fetch fails', () => {
    useRouter.mockReturnValue({ pathname: '/', query: {}, isReady: true, push: jest.fn() });

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
          address: '大阪府大阪市北区中之島1丁目',
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
      req: {
        headers: {
          cookie: 'admin_access_token=test-token',
        },
      },
    } as never);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/reports?status=temporary',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer test-token',
        }),
      }),
    );
    expect(result).toMatchObject({
      props: {
        selectedStatus: 'temporary',
        reports: [
          {
            id: 'r-api-2',
            reportedAt: '2026-04-20 18:15',
            location: '大阪府大阪市北区中之島1丁目',
            latitude: 34.7,
            longitude: 135.49,
            address: '大阪府大阪市北区中之島1丁目',
            mapLinkUrl: 'https://www.google.com/maps?q=34.7%2C135.49',
            status: 'temporary',
          },
        ],
      },
    });

    global.fetch = originalFetch;
  });

  it('redirects to login when report list page is accessed without a token', async () => {
    const result = await getServerSideProps({
      resolvedUrl: '/',
      req: { headers: {} },
    } as never);

    expect(result).toEqual({
      redirect: {
        destination: '/login?next=%2F',
        permanent: false,
      },
    });
  });

  it('shows the login form', () => {
    useRouter.mockReturnValue({
      pathname: '/login',
      query: {},
      isReady: true,
      push: jest.fn(),
    });

    render(<LoginPage nextPath="/unresolved" />);

    expect(screen.getByRole('heading', { level: 1, name: '管理者ログイン' })).toBeInTheDocument();
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
  });

  it('logs in from the login page and redirects to the next path', async () => {
    const push = jest.fn();
    useRouter.mockReturnValue({
      pathname: '/login',
      query: { next: '/unresolved' },
      isReady: true,
      push,
    });

    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);
    global.fetch = fetchMock;

    render(<LoginPage nextPath="/unresolved" />);

    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'admin@example.test' },
    });
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/session/login',
        expect.objectContaining({
          method: 'POST',
        }),
      ),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/unresolved'));

    global.fetch = originalFetch;
  });

  it('shows an error on the login page when credentials are invalid', async () => {
    useRouter.mockReturnValue({
      pathname: '/login',
      query: {},
      isReady: true,
      push: jest.fn(),
    });

    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'invalid credentials' }),
    } as Response);
    global.fetch = fetchMock;

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'admin@example.test' },
    });
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));

    expect(
      await screen.findByText('メールアドレスまたはパスワードが正しくありません。'),
    ).toBeInTheDocument();

    global.fetch = originalFetch;
  });

  it('shows reported list filters and collection candidate state on the unresolved page', () => {
    useRouter.mockReturnValue({
      pathname: '/unresolved',
      query: {},
      isReady: true,
      push: jest.fn(),
    });

    render(
      <UnresolvedPage
        selectedView="all"
        reports={[
          {
            id: 'r-1',
            imageUrl: 'https://example.com/r-1.jpg',
            reportedAt: '2026-04-20 09:15',
            location: '大阪市北区中之島 1-2-3',
            latitude: 34.7,
            longitude: 135.49,
            address: '大阪市北区中之島 1-2-3',
            mapEmbedUrl: null,
            mapLinkUrl: 'https://www.google.com/maps?q=34.7%2C135.49',
            identifierText: '防犯登録 1234 / 黒のシティサイクル',
            status: 'reported',
            elapsedLabel: '3時間',
            currentStatusLabel: 'reported',
            isCollectionCandidate: false,
            collectionCandidateDecision: 'none',
            collectionCandidateFlaggedAt: null,
            history: [],
          },
          {
            id: 'r-2',
            imageUrl: 'https://example.com/r-2.jpg',
            reportedAt: '2026-04-19 18:40',
            location: '大阪市北区梅田 2-4-9',
            latitude: 34.701,
            longitude: 135.491,
            address: '大阪市北区梅田 2-4-9',
            mapEmbedUrl: null,
            mapLinkUrl: 'https://www.google.com/maps?q=34.701%2C135.491',
            identifierText: 'シール 8842 / 銀のクロスバイク',
            status: 'reported',
            elapsedLabel: '17時間',
            currentStatusLabel: 'reported',
            isCollectionCandidate: true,
            collectionCandidateDecision: 'auto',
            collectionCandidateFlaggedAt: '2026-04-20T18:40:00.000Z',
            history: [],
          },
        ]}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: '回収依頼候補' }),
    ).toBeInTheDocument();
    expect(screen.getByText('対象: reported')).toBeInTheDocument();
    expect(screen.getByText('自動条件: 通報から24時間超過で回収対象')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'reported全件' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '回収対象のみ' })).toBeInTheDocument();
    expect(screen.getByText('防犯登録 1234 / 黒のシティサイクル')).toBeInTheDocument();
    expect(screen.getByText('シール 8842 / 銀のクロスバイク')).toBeInTheDocument();
    expect(screen.getByText('未対象')).toBeInTheDocument();
    expect(screen.getByText('回収対象（自動）')).toBeInTheDocument();
  });

  it('shows only collection candidates on the unresolved page when candidate filter is selected', () => {
    useRouter.mockReturnValue({
      pathname: '/unresolved',
      query: { view: 'candidate' },
      isReady: true,
      push: jest.fn(),
    });

    render(
      <UnresolvedPage
        selectedView="candidate"
        reports={[
          {
            id: 'r-1',
            imageUrl: 'https://example.com/r-1.jpg',
            reportedAt: '2026-04-20 09:15',
            location: '大阪市北区中之島 1-2-3',
            latitude: 34.7,
            longitude: 135.49,
            address: '大阪市北区中之島 1-2-3',
            mapEmbedUrl: null,
            mapLinkUrl: 'https://www.google.com/maps?q=34.7%2C135.49',
            identifierText: '防犯登録 1234 / 黒のシティサイクル',
            status: 'reported',
            elapsedLabel: '3時間',
            currentStatusLabel: 'reported',
            isCollectionCandidate: false,
            collectionCandidateDecision: 'manual_off',
            collectionCandidateFlaggedAt: null,
            history: [],
          },
          {
            id: 'r-2',
            imageUrl: 'https://example.com/r-2.jpg',
            reportedAt: '2026-04-19 18:40',
            location: '大阪市北区梅田 2-4-9',
            latitude: 34.701,
            longitude: 135.491,
            address: '大阪市北区梅田 2-4-9',
            mapEmbedUrl: null,
            mapLinkUrl: 'https://www.google.com/maps?q=34.701%2C135.491',
            identifierText: 'シール 8842 / 銀のクロスバイク',
            status: 'reported',
            elapsedLabel: '17時間',
            currentStatusLabel: 'reported',
            isCollectionCandidate: true,
            collectionCandidateDecision: 'manual_on',
            collectionCandidateFlaggedAt: '2026-04-20T18:40:00.000Z',
            history: [],
          },
        ]}
      />,
    );

    expect(
      screen.getByRole('link', { name: '回収対象のみ' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByText('防犯登録 1234 / 黒のシティサイクル')).not.toBeInTheDocument();
    expect(screen.getByText('シール 8842 / 銀のクロスバイク')).toBeInTheDocument();
  });

  it('shows an empty state on the unresolved page when no collection candidate exists', () => {
    useRouter.mockReturnValue({
      pathname: '/unresolved',
      query: { view: 'candidate' },
      isReady: true,
      push: jest.fn(),
    });

    render(
      <UnresolvedPage
        selectedView="candidate"
        reports={[]}
      />,
    );

    expect(
      screen.getByText('回収対象の未解除案件はありません。'),
    ).toBeInTheDocument();
  });

  it('updates a report as collection candidate from the unresolved page', async () => {
    useRouter.mockReturnValue({
      pathname: '/unresolved',
      query: {},
      isReady: true,
      push: jest.fn(),
    });

    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'r-1',
        markerId: 'm-1',
        imageUrl: 'https://example.com/r-1.jpg',
        latitude: 34.7,
        longitude: 135.49,
        address: '大阪市北区中之島 1-2-3',
        identifierText: '防犯登録 1234 / 黒のシティサイクル',
        status: 'reported',
        createdAt: '2026-04-20T00:15:00.000Z',
        updatedAt: '2026-04-21T12:00:00.000Z',
        isCollectionCandidate: true,
        collectionCandidateDecision: 'manual_on',
        collectionCandidateFlaggedAt: '2026-04-21T12:00:00.000Z',
      }),
    } as Response);
    global.fetch = fetchMock;

    render(
      <UnresolvedPage
        selectedView="all"
        reports={[
          {
            id: 'r-1',
            imageUrl: 'https://example.com/r-1.jpg',
            reportedAt: '2026-04-20 09:15',
            location: '大阪市北区中之島 1-2-3',
            latitude: 34.7,
            longitude: 135.49,
            address: '大阪市北区中之島 1-2-3',
            mapEmbedUrl: null,
            mapLinkUrl: 'https://www.google.com/maps?q=34.7%2C135.49',
            identifierText: '防犯登録 1234 / 黒のシティサイクル',
            status: 'reported',
            elapsedLabel: '3時間',
            currentStatusLabel: 'reported',
            isCollectionCandidate: false,
            collectionCandidateDecision: 'none',
            collectionCandidateFlaggedAt: null,
            history: [],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '回収対象にする' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/session/reports/r-1/collection-candidate',
        expect.objectContaining({
          method: 'PATCH',
        }),
      ),
    );
    expect(await screen.findByText('回収対象（手動）')).toBeInTheDocument();

    global.fetch = originalFetch;
  });

  it('removes a report from candidate-only view after turning the flag off', async () => {
    useRouter.mockReturnValue({
      pathname: '/unresolved',
      query: { view: 'candidate' },
      isReady: true,
      push: jest.fn(),
    });

    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'r-2',
        markerId: 'm-2',
        imageUrl: 'https://example.com/r-2.jpg',
        latitude: 34.701,
        longitude: 135.491,
        address: '大阪市北区梅田 2-4-9',
        identifierText: 'シール 8842 / 銀のクロスバイク',
        status: 'reported',
        createdAt: '2026-04-19T09:40:00.000Z',
        updatedAt: '2026-04-21T12:00:00.000Z',
        isCollectionCandidate: false,
        collectionCandidateDecision: 'manual_off',
        collectionCandidateFlaggedAt: null,
      }),
    } as Response);
    global.fetch = fetchMock;

    render(
      <UnresolvedPage
        selectedView="candidate"
        reports={[
          {
            id: 'r-2',
            imageUrl: 'https://example.com/r-2.jpg',
            reportedAt: '2026-04-19 18:40',
            location: '大阪市北区梅田 2-4-9',
            latitude: 34.701,
            longitude: 135.491,
            address: '大阪市北区梅田 2-4-9',
            mapEmbedUrl: null,
            mapLinkUrl: 'https://www.google.com/maps?q=34.701%2C135.491',
            identifierText: 'シール 8842 / 銀のクロスバイク',
            status: 'reported',
            elapsedLabel: '1日 17時間',
            currentStatusLabel: 'reported',
            isCollectionCandidate: true,
            collectionCandidateDecision: 'manual_on',
            collectionCandidateFlaggedAt: '2026-04-20T18:40:00.000Z',
            history: [],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '回収対象から外す' }));

    await waitFor(() =>
      expect(
        screen.getByText('回収対象の未解除案件はありません。'),
      ).toBeInTheDocument(),
    );

    global.fetch = originalFetch;
  });

  it('fetches reported unresolved reports from the server side', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-21T12:00:00.000Z'));
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'r-api-1',
          imageUrl: 'https://example.com/report-api-1.jpg',
          markerId: 'm-api-1',
          latitude: 34.7055,
          longitude: 135.4983,
          address: '大阪府大阪市北区梅田1丁目',
          identifierText: 'API-0001 / 黒のシティサイクル',
          status: 'reported',
          createdAt: '2026-04-20T00:15:00.000Z',
          updatedAt: '2026-04-20T00:15:00.000Z',
          isCollectionCandidate: true,
          collectionCandidateDecision: 'auto',
          collectionCandidateFlaggedAt: '2026-04-21T12:00:00.000Z',
        },
        {
          id: 'r-api-2',
          imageUrl: 'https://example.com/report-api-2.jpg',
          markerId: 'm-api-2',
          latitude: 34.706,
          longitude: 135.4984,
          address: null,
          identifierText: 'API-0002 / 銀のクロスバイク',
          status: 'reported',
          createdAt: '2026-04-21T06:20:00.000Z',
          updatedAt: '2026-04-21T06:20:00.000Z',
          isCollectionCandidate: false,
          collectionCandidateDecision: 'none',
          collectionCandidateFlaggedAt: null,
        },
        {
          id: 'r-api-3',
          imageUrl: 'https://example.com/report-api-3.jpg',
          markerId: 'm-api-3',
          latitude: 34.707,
          longitude: 135.4985,
          address: '大阪府大阪市北区天満1丁目',
          identifierText: 'API-0003 / 白のミニベロ / temporary',
          status: 'temporary',
          createdAt: '2026-04-19T00:25:00.000Z',
          updatedAt: '2026-04-19T00:25:00.000Z',
          isCollectionCandidate: false,
          collectionCandidateDecision: 'none',
          collectionCandidateFlaggedAt: null,
        },
      ],
    } as Response);
    global.fetch = fetchMock;

    const { getServerSideProps } = await import('../pages/unresolved');
    const result = await getServerSideProps({
      req: {
        headers: {
          cookie: 'admin_access_token=test-token',
        },
      },
    } as never);
    const request = fetchMock.mock.calls[0];

    expect(request[0]).toBe('http://localhost:3000/api/reports?status=reported');
    expect(result).toMatchObject({
      props: {
        selectedView: 'all',
        reports: [
          expect.objectContaining({
            id: 'r-api-1',
            status: 'reported',
            elapsedLabel: '1日 11時間',
            isCollectionCandidate: true,
          }),
          expect.objectContaining({
            id: 'r-api-2',
            status: 'reported',
            isCollectionCandidate: false,
          }),
        ],
      },
    });

    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('normalizes candidate view query and keeps reported reports on the server side', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-21T12:00:00.000Z'));
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'r-api-1',
          imageUrl: 'https://example.com/report-api-1.jpg',
          markerId: 'm-api-1',
          latitude: 34.7055,
          longitude: 135.4983,
          address: '大阪府大阪市北区梅田1丁目',
          identifierText: 'API-0001 / 黒のシティサイクル',
          status: 'reported',
          createdAt: '2026-04-21T00:15:00.000Z',
          updatedAt: '2026-04-21T00:15:00.000Z',
          isCollectionCandidate: false,
          collectionCandidateDecision: 'none',
          collectionCandidateFlaggedAt: null,
        },
        {
          id: 'r-api-2',
          imageUrl: 'https://example.com/report-api-2.jpg',
          markerId: 'm-api-2',
          latitude: 34.706,
          longitude: 135.4984,
          address: null,
          identifierText: 'API-0002 / 銀のクロスバイク',
          status: 'reported',
          createdAt: '2026-04-19T00:20:00.000Z',
          updatedAt: '2026-04-19T00:20:00.000Z',
          isCollectionCandidate: true,
          collectionCandidateDecision: 'manual_on',
          collectionCandidateFlaggedAt: '2026-04-20T00:20:00.000Z',
        },
      ],
    } as Response);
    global.fetch = fetchMock;

    const { getServerSideProps } = await import('../pages/unresolved');
    const result = await getServerSideProps({
      query: { view: 'unexpected' },
      req: {
        headers: {
          cookie: 'admin_access_token=test-token',
        },
      },
    } as never);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/reports?status=reported',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer test-token',
        }),
      }),
    );
    expect(result).toMatchObject({
      props: {
        selectedView: 'all',
        reports: [
          expect.objectContaining({ id: 'r-api-1', isCollectionCandidate: false }),
          expect.objectContaining({ id: 'r-api-2', isCollectionCandidate: true }),
        ],
      },
    });

    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('uses candidate-only view on the server side when requested', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-21T12:00:00.000Z'));
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'r-api-1',
          imageUrl: 'https://example.com/report-api-1.jpg',
          markerId: 'm-api-1',
          latitude: 34.7055,
          longitude: 135.4983,
          address: '大阪府大阪市北区梅田1丁目',
          identifierText: 'API-0001 / 黒のシティサイクル',
          status: 'reported',
          createdAt: '2026-04-20T00:15:00.000Z',
          updatedAt: '2026-04-20T00:15:00.000Z',
          isCollectionCandidate: true,
          collectionCandidateDecision: 'auto',
          collectionCandidateFlaggedAt: '2026-04-21T12:00:00.000Z',
        },
      ],
    } as Response);
    global.fetch = fetchMock;

    const { getServerSideProps } = await import('../pages/unresolved');
    const result = await getServerSideProps({
      query: { view: 'candidate' },
      req: {
        headers: {
          cookie: 'admin_access_token=test-token',
        },
      },
    } as never);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/reports?status=reported',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer test-token',
        }),
      }),
    );
    expect(result).toMatchObject({
      props: {
        selectedView: 'candidate',
        reports: [expect.objectContaining({ id: 'r-api-1', status: 'reported' })],
      },
    });

    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('shows overview and history on the report detail page', () => {
    useRouter.mockReturnValue({
      pathname: '/reports/[id]',
      query: { id: 'R-002' },
      isReady: true,
      push: jest.fn(),
    });

    render(
      <ReportDetailPage
        report={{
          id: 'R-002',
          imageUrl: '/mock/report-002.png',
          reportedAt: '2026-04-19 18:40',
          location: '大阪市北区梅田 2-4-9',
          latitude: 34.701,
          longitude: 135.491,
          address: '大阪市北区梅田 2-4-9',
          mapEmbedUrl: null,
          mapLinkUrl: 'https://www.google.com/maps?q=34.701%2C135.491',
          identifierText: 'シール 8842 / 銀のクロスバイク',
          status: 'temporary',
          elapsedLabel: '17時間',
          currentStatusLabel: 'temporary',
          history: [
            {
              id: 'H-002',
              timestamp: '2026-04-19 18:40',
              label: '通報を受付',
            },
            {
              id: 'H-003',
              timestamp: '2026-04-19 19:10',
              label: '持ち主が仮解除',
            },
          ],
        }}
      />,
    );

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
      push: jest.fn(),
    });

    render(
      <ReportDetailPage
        report={{
          id: 'r-api-3',
          imageUrl: 'https://example.com/report-api-3.jpg',
          reportedAt: '2026-04-21 08:30',
          location: '大阪府大阪市北区堂島1丁目',
          latitude: 34.71,
          longitude: 135.5,
          address: '大阪府大阪市北区堂島1丁目',
          mapEmbedUrl: 'https://www.google.com/maps/embed/v1/place?key=test&q=34.71%2C135.5',
          mapLinkUrl: 'https://www.google.com/maps?q=34.71%2C135.5',
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
    expect(screen.getByText('大阪府大阪市北区堂島1丁目')).toBeInTheDocument();
    expect(screen.getByText('34.710000, 135.500000')).toBeInTheDocument();
    expect(screen.getByTitle('通報位置の地図')).toHaveAttribute(
      'src',
      'https://www.google.com/maps/embed/v1/place?key=test&q=34.71%2C135.5',
    );
    expect(screen.getByText('履歴はありません。')).toBeInTheDocument();
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
        address: null,
        identifierText: 'API-0004',
        status: 'collection_requested',
        notes: null,
        createdAt: '2026-04-21T00:30:00.000Z',
        updatedAt: '2026-04-21T00:30:00.000Z',
        history: [
          {
            id: 'h-api-1',
            timestamp: '2026-04-21T00:30:00.000Z',
            label: '通報を受付',
          },
          {
            id: 'h-api-2',
            timestamp: '2026-04-21T02:00:00.000Z',
            label: '回収依頼を登録',
            notes: '歩道上に継続駐輪',
          },
        ],
      }),
    } as Response);
    global.fetch = fetchMock;

    const result = await getReportDetailServerSideProps({
      params: { id: 'r-api-4' },
      req: {
        headers: {
          cookie: 'admin_access_token=test-token',
        },
      },
    } as never);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/reports/r-api-4',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer test-token',
        }),
      }),
    );
    expect(result).toMatchObject({
      props: {
        report: {
          id: 'r-api-4',
          reportedAt: '2026-04-21 09:30',
          location: '34.710000, 135.500000',
          latitude: 34.71,
          longitude: 135.5,
          address: null,
          mapLinkUrl: 'https://www.google.com/maps?q=34.71%2C135.5',
          status: 'collection_requested',
          history: [
            {
              id: 'h-api-1',
              timestamp: '2026-04-21 09:30',
              label: '通報を受付',
            },
            {
              id: 'h-api-2',
              timestamp: '2026-04-21 11:00',
              label: '回収依頼を登録',
              notes: '歩道上に継続駐輪',
            },
          ],
        },
      },
    });

    global.fetch = originalFetch;
  });

  it('redirects to login when report detail fetch returns unauthorized', async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers(),
    } as Response);
    global.fetch = fetchMock;

    const result = await getReportDetailServerSideProps({
      params: { id: 'r-api-4' },
      resolvedUrl: '/reports/r-api-4',
      req: {
        headers: {
          cookie: 'admin_access_token=expired-token',
        },
      },
      res: {
        setHeader: jest.fn(),
      },
    } as never);

    expect(result).toEqual({
      redirect: {
        destination: '/login?next=%2Freports%2Fr-api-4',
        permanent: false,
      },
    });

    global.fetch = originalFetch;
  });

  it('shows API-backed history notes on the report detail page', () => {
    useRouter.mockReturnValue({
      pathname: '/reports/[id]',
      query: { id: 'r-api-5' },
      isReady: true,
      push: jest.fn(),
    });

    render(
      <ReportDetailPage
        report={{
          id: 'r-api-5',
          imageUrl: 'https://example.com/report-api-5.jpg',
          reportedAt: '2026-04-21 08:30',
          location: '大阪府大阪市北区堂島1丁目',
          latitude: 34.71,
          longitude: 135.5,
          address: '大阪府大阪市北区堂島1丁目',
          mapEmbedUrl: null,
          mapLinkUrl: 'https://www.google.com/maps?q=34.71%2C135.5',
          identifierText: 'API-0005 / 白のミニベロ',
          status: 'collected',
          elapsedLabel: '',
          currentStatusLabel: 'collected',
          history: [
            {
              id: 'h-api-3',
              timestamp: '2026-04-21 08:30',
              label: '通報を受付',
            },
            {
              id: 'h-api-4',
              timestamp: '2026-04-21 11:00',
              label: '回収結果を記録',
              notes: '現地で回収完了',
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('回収結果を記録')).toBeInTheDocument();
    expect(screen.getByText('現地で回収完了')).toBeInTheDocument();
  });

  it('shows the collection request form and confirmation text', () => {
    useRouter.mockReturnValue({
      pathname: '/collection-request/[id]',
      query: { id: 'R-001' },
      isReady: true,
      push: jest.fn(),
    });

    render(
      <CollectionRequestPage
        report={{
          id: 'R-001',
          imageUrl: '/mock/report-001.png',
          reportedAt: '2026-04-20 09:15',
          location: '大阪市北区中之島 1-2-3',
          latitude: 34.7,
          longitude: 135.49,
          address: '大阪市北区中之島 1-2-3',
          mapEmbedUrl: null,
          mapLinkUrl: 'https://www.google.com/maps?q=34.7%2C135.49',
          identifierText: '防犯登録 1234 / 黒のシティサイクル',
          status: 'reported',
          elapsedLabel: '3時間',
          currentStatusLabel: 'reported',
          history: [],
        }}
      />,
    );

    expect(screen.getByText('回収依頼')).toBeInTheDocument();
    expect(screen.getByText('依頼メモ')).toBeInTheDocument();
    expect(screen.getByText('確認: collection_requested に更新')).toBeInTheDocument();
    expect(
      screen.queryByText('対象案件に依頼メモを付け、回収依頼状態へ更新する雛形です。'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '回収依頼登録' })).toBeInTheDocument();
  });

  it('shows the collection result options', () => {
    useRouter.mockReturnValue({
      pathname: '/collection-result/[id]',
      query: { id: 'R-003' },
      isReady: true,
      push: jest.fn(),
    });

    render(
      <CollectionResultPage
        report={{
          id: 'R-003',
          imageUrl: '/mock/report-003.png',
          reportedAt: '2026-04-18 07:20',
          location: '大阪市北区天満 3-8-1',
          latitude: 34.702,
          longitude: 135.492,
          address: '大阪市北区天満 3-8-1',
          mapEmbedUrl: null,
          mapLinkUrl: 'https://www.google.com/maps?q=34.702%2C135.492',
          identifierText: '防犯登録 9981 / 青のママチャリ',
          status: 'collection_requested',
          elapsedLabel: '2日',
          currentStatusLabel: 'collection_requested',
          history: [],
        }}
      />,
    );

    expect(screen.getByText('回収結果記録')).toBeInTheDocument();
    expect(screen.getByLabelText('回収完了')).toBeInTheDocument();
    expect(screen.getByLabelText('現地で現物なし')).toBeInTheDocument();
    expect(screen.getByText('結果メモ')).toBeInTheDocument();
    expect(
      screen.queryByText('回収完了または現地で現物なしの結果を記録する雛形です。'),
    ).not.toBeInTheDocument();
  });

  it('shows loading state until dynamic route params are ready', () => {
    useRouter.mockReturnValue({
      pathname: '/reports/[id]',
      query: {},
      isReady: false,
      push: jest.fn(),
    });

    render(<ReportDetailPage />);

    expect(screen.getByText('読み込み中…')).toBeInTheDocument();
    expect(screen.queryByText('対象の通報が見つかりません。')).not.toBeInTheDocument();
  });

  it('logs out from the app layout', async () => {
    const push = jest.fn();
    useRouter.mockReturnValue({ pathname: '/', query: {}, isReady: true, push });

    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);
    global.fetch = fetchMock;

    render(<HomePage reports={[]} selectedStatus="all" />);

    fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/session/logout',
        expect.objectContaining({
          method: 'POST',
        }),
      ),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'));

    global.fetch = originalFetch;
  });
});
