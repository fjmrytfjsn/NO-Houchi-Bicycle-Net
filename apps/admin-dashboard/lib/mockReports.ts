import type { ReportDetail, ReportStatus } from './types';

export const statusLabelMap: Record<ReportStatus, string> = {
  reported: 'reported',
  temporary: 'temporary',
  resolved: 'resolved',
  collection_requested: 'collection_requested',
  collected: 'collected',
  not_found_on_collection: 'not_found_on_collection',
};

export const mockReports: ReportDetail[] = [
  {
    id: 'R-001',
    imageUrl: '/mock/report-001.png',
    reportedAt: '2026-04-20 09:15',
    location: '大阪市北区中之島 1-2-3',
    identifierText: '防犯登録 1234 / 黒のシティサイクル',
    status: 'reported',
    elapsedLabel: '3時間',
    currentStatusLabel: 'reported',
    history: [
      {
        id: 'H-001',
        timestamp: '2026-04-20 09:15',
        label: '通報を受付',
      },
    ],
  },
  {
    id: 'R-002',
    imageUrl: '/mock/report-002.png',
    reportedAt: '2026-04-19 18:40',
    location: '大阪市北区梅田 2-4-9',
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
  },
  {
    id: 'R-003',
    imageUrl: '/mock/report-003.png',
    reportedAt: '2026-04-18 07:20',
    location: '大阪市北区天満 3-8-1',
    identifierText: '防犯登録 9981 / 青のママチャリ',
    status: 'collection_requested',
    elapsedLabel: '2日',
    currentStatusLabel: 'collection_requested',
    collectionRequestMemo: '歩道上に継続駐輪。回収を依頼済み。',
    history: [
      {
        id: 'H-004',
        timestamp: '2026-04-18 07:20',
        label: '通報を受付',
      },
      {
        id: 'H-005',
        timestamp: '2026-04-19 09:30',
        label: '回収依頼を登録',
        notes: '歩道上に継続駐輪。回収を依頼済み。',
      },
    ],
  },
  {
    id: 'R-004',
    imageUrl: '/mock/report-004.png',
    reportedAt: '2026-04-17 11:05',
    location: '大阪市北区堂島 1-5-2',
    identifierText: '防犯登録 7788 / 白のミニベロ',
    status: 'collected',
    elapsedLabel: '3日',
    currentStatusLabel: 'collected',
    collectionResultMemo: '回収業者が現地で回収完了。',
    history: [
      {
        id: 'H-006',
        timestamp: '2026-04-17 11:05',
        label: '通報を受付',
      },
      {
        id: 'H-007',
        timestamp: '2026-04-18 08:45',
        label: '回収依頼を登録',
      },
      {
        id: 'H-008',
        timestamp: '2026-04-18 15:00',
        label: '回収結果を記録',
        notes: '回収業者が現地で回収完了。',
      },
    ],
  },
  {
    id: 'R-005',
    imageUrl: '/mock/report-005.png',
    reportedAt: '2026-04-16 14:25',
    location: '大阪市北区芝田 1-1-4',
    identifierText: 'ステッカー 2201 / 赤のロードバイク',
    status: 'not_found_on_collection',
    elapsedLabel: '4日',
    currentStatusLabel: 'not_found_on_collection',
    collectionResultMemo: '現地確認時に現物なし。',
    history: [
      {
        id: 'H-009',
        timestamp: '2026-04-16 14:25',
        label: '通報を受付',
      },
      {
        id: 'H-010',
        timestamp: '2026-04-17 10:10',
        label: '回収依頼を登録',
      },
      {
        id: 'H-011',
        timestamp: '2026-04-17 17:50',
        label: '回収結果を記録',
        notes: '現地確認時に現物なし。',
      },
    ],
  },
];

export const unresolvedReports = mockReports.filter((report) =>
  ['reported', 'temporary'].includes(report.status),
);

export function getReportById(id?: string | string[]) {
  if (!id || Array.isArray(id)) {
    return undefined;
  }

  return mockReports.find((report) => report.id === id);
}
