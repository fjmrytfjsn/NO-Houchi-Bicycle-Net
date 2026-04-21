/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../pages';
import UnresolvedPage from '../pages/unresolved';
import ReportDetailPage from '../pages/reports/[id]';
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
    useRouter.mockReturnValue({ pathname: '/', query: {} });

    render(<HomePage />);

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

  it('shows only reported and temporary items on the unresolved page', () => {
    useRouter.mockReturnValue({ pathname: '/unresolved', query: {} });

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
    });

    render(<ReportDetailPage />);

    expect(
      screen.getByRole('heading', { level: 2, name: '通報詳細' }),
    ).toBeInTheDocument();
    expect(screen.getByText('シール 8842 / 銀のクロスバイク')).toBeInTheDocument();
    expect(screen.getByText('履歴')).toBeInTheDocument();
    expect(screen.getByText('持ち主が仮解除')).toBeInTheDocument();
  });

  it('shows the collection request form and confirmation text', () => {
    useRouter.mockReturnValue({
      pathname: '/collection-request/[id]',
      query: { id: 'R-001' },
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
    });

    render(<CollectionResultPage />);

    expect(screen.getByText('回収結果記録')).toBeInTheDocument();
    expect(screen.getByLabelText('回収完了')).toBeInTheDocument();
    expect(screen.getByLabelText('現地で現物なし')).toBeInTheDocument();
    expect(screen.getByText('結果メモ')).toBeInTheDocument();
  });
});
