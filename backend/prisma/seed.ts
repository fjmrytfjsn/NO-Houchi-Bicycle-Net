import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const now = new Date('2026-05-11T09:00:00.000Z');

function daysAgo(days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number) {
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

function daysFromNow(days: number) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.test' },
    update: {
      name: '北区 管理担当',
      password,
      role: 'admin',
    },
    create: {
      id: 'seed-user-admin',
      name: '北区 管理担当',
      email: 'admin@example.test',
      password,
      role: 'admin',
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.test' },
    update: {
      name: '開発用 持ち主',
      password,
      role: 'user',
    },
    create: {
      id: 'seed-user-owner',
      name: '開発用 持ち主',
      email: 'owner@example.test',
      password,
      role: 'user',
    },
  });

  const activeBike = await prisma.bike.upsert({
    where: { serialNumber: 'SEED-BIKE-001' },
    update: {
      status: 'rented',
      location: '大阪市北区中之島',
    },
    create: {
      id: 'seed-bike-001',
      serialNumber: 'SEED-BIKE-001',
      status: 'rented',
      location: '大阪市北区中之島',
    },
  });

  await prisma.bike.upsert({
    where: { serialNumber: 'SEED-BIKE-002' },
    update: {
      status: 'available',
      location: '大阪市北区梅田',
    },
    create: {
      id: 'seed-bike-002',
      serialNumber: 'SEED-BIKE-002',
      status: 'available',
      location: '大阪市北区梅田',
    },
  });

  await prisma.rental.upsert({
    where: { id: 'seed-rental-active' },
    update: {
      userId: owner.id,
      bikeId: activeBike.id,
      startAt: daysAgo(1),
      endAt: null,
      status: 'active',
    },
    create: {
      id: 'seed-rental-active',
      userId: owner.id,
      bikeId: activeBike.id,
      startAt: daysAgo(1),
      status: 'active',
    },
  });

  const markers = await Promise.all([
    upsertMarker('seed-marker-reported', 'SEED-REP-001', '大阪市北区中之島 1-2-3'),
    upsertMarker('seed-marker-reported-auto', 'SEED-REP-002', '大阪市北区南森町 2-6-4'),
    upsertMarker('seed-marker-reported-manual-on', 'SEED-REP-003', '大阪市北区大深町 4-20'),
    upsertMarker('seed-marker-reported-manual-off', 'SEED-REP-004', '大阪市北区曽根崎 2-11-5'),
    upsertMarker('seed-marker-temporary', 'SEED-TMP-001', '大阪市北区梅田 2-4-9'),
    upsertMarker('seed-marker-collection', 'SEED-COL-001', '大阪市北区天満 3-8-1'),
    upsertMarker('seed-marker-collected', 'SEED-DONE-001', '大阪市北区堂島 1-5-2'),
    upsertMarker('seed-marker-not-found', 'SEED-NF-001', '大阪市北区芝田 1-1-4'),
    upsertMarker('seed-marker-resolved', 'SEED-RES-001', '大阪市北区扇町 2-1-7'),
  ]);

  const [
    reportedMarker,
    reportedAutoMarker,
    reportedManualOnMarker,
    reportedManualOffMarker,
    temporaryMarker,
    collectionMarker,
    collectedMarker,
    notFoundMarker,
    resolvedMarker,
  ] = markers;

  const reports = await Promise.all([
    upsertReport({
      id: 'seed-report-reported',
      markerId: reportedMarker.id,
      imageUrl: 'https://example.com/seed/report-reported.jpg',
      latitude: 34.693724,
      longitude: 135.502254,
      address: '大阪市北区中之島 1-2-3',
      identifierText: '防犯登録 SEED-1001 / 黒のシティサイクル',
      status: 'reported',
      notes: '開発用: reported 全件にのみ出る未対象案件',
      createdAt: hoursAgo(6),
    }),
    upsertReport({
      id: 'seed-report-reported-auto-candidate',
      markerId: reportedAutoMarker.id,
      imageUrl: 'https://example.com/seed/report-reported-auto-candidate.jpg',
      latitude: 34.698921,
      longitude: 135.513082,
      address: '大阪市北区南森町 2-6-4',
      identifierText: '防犯登録 SEED-1002 / 紺のシティサイクル',
      status: 'reported',
      notes: '開発用: 24時間経過で自動的に回収対象になった案件',
      createdAt: daysAgo(2),
      isCollectionCandidate: true,
      collectionCandidateDecision: 'auto',
      collectionCandidateFlaggedAt: daysAgo(1),
    }),
    upsertReport({
      id: 'seed-report-reported-manual-on',
      markerId: reportedManualOnMarker.id,
      imageUrl: 'https://example.com/seed/report-reported-manual-on.jpg',
      latitude: 34.705938,
      longitude: 135.496524,
      address: '大阪市北区大深町 4-20',
      identifierText: '防犯登録 SEED-1003 / 黄色のクロスバイク',
      status: 'reported',
      notes: '開発用: 管理者が手動で回収対象にした案件',
      createdAt: hoursAgo(10),
      isCollectionCandidate: true,
      collectionCandidateDecision: 'manual_on',
      collectionCandidateFlaggedAt: hoursAgo(2),
    }),
    upsertReport({
      id: 'seed-report-reported-manual-off',
      markerId: reportedManualOffMarker.id,
      imageUrl: 'https://example.com/seed/report-reported-manual-off.jpg',
      latitude: 34.701454,
      longitude: 135.504239,
      address: '大阪市北区曽根崎 2-11-5',
      identifierText: '防犯登録 SEED-1004 / 赤のミニベロ',
      status: 'reported',
      notes: '開発用: 24時間超過後に手動除外した案件',
      createdAt: daysAgo(3),
      isCollectionCandidate: false,
      collectionCandidateDecision: 'manual_off',
      collectionCandidateFlaggedAt: null,
    }),
    upsertReport({
      id: 'seed-report-temporary',
      markerId: temporaryMarker.id,
      imageUrl: 'https://example.com/seed/report-temporary.jpg',
      latitude: 34.702485,
      longitude: 135.495951,
      address: '大阪市北区梅田 2-4-9',
      identifierText: 'シール SEED-2001 / 銀のクロスバイク',
      status: 'temporary',
      notes: '開発用: 持ち主が仮解除済みの案件',
      createdAt: daysAgo(2),
    }),
    upsertReport({
      id: 'seed-report-collection-requested',
      markerId: collectionMarker.id,
      imageUrl: 'https://example.com/seed/report-collection-requested.jpg',
      latitude: 34.697587,
      longitude: 135.511032,
      address: '大阪市北区天満 3-8-1',
      identifierText: '防犯登録 SEED-3001 / 青のママチャリ',
      status: 'collection_requested',
      notes: '開発用: 回収依頼中の案件',
      createdAt: daysAgo(3),
      isCollectionCandidate: false,
      collectionCandidateDecision: 'none',
      collectionCandidateFlaggedAt: null,
    }),
    upsertReport({
      id: 'seed-report-collected',
      markerId: collectedMarker.id,
      imageUrl: 'https://example.com/seed/report-collected.jpg',
      latitude: 34.696112,
      longitude: 135.498924,
      address: '大阪市北区堂島 1-5-2',
      identifierText: '防犯登録 SEED-4001 / 白のミニベロ',
      status: 'collected',
      notes: '開発用: 回収完了案件',
      createdAt: daysAgo(4),
      isCollectionCandidate: false,
      collectionCandidateDecision: 'none',
      collectionCandidateFlaggedAt: null,
    }),
    upsertReport({
      id: 'seed-report-not-found',
      markerId: notFoundMarker.id,
      imageUrl: 'https://example.com/seed/report-not-found.jpg',
      latitude: 34.705534,
      longitude: 135.49811,
      address: '大阪市北区芝田 1-1-4',
      identifierText: 'ステッカー SEED-5001 / 赤のロードバイク',
      status: 'not_found_on_collection',
      notes: '開発用: 現地で現物なしの案件',
      createdAt: daysAgo(5),
      isCollectionCandidate: false,
      collectionCandidateDecision: 'none',
      collectionCandidateFlaggedAt: null,
    }),
    upsertReport({
      id: 'seed-report-resolved',
      markerId: resolvedMarker.id,
      imageUrl: 'https://example.com/seed/report-resolved.jpg',
      latitude: 34.704177,
      longitude: 135.510109,
      address: '大阪市北区扇町 2-1-7',
      identifierText: '防犯登録 SEED-6001 / 緑のシティサイクル',
      status: 'resolved',
      notes: '開発用: 持ち主が本解除済みの案件',
      createdAt: daysAgo(6),
      isCollectionCandidate: false,
      collectionCandidateDecision: 'none',
      collectionCandidateFlaggedAt: null,
    }),
  ]);

  await Promise.all([
    upsertDeclaration({
      id: 'seed-declaration-temporary',
      markerId: temporaryMarker.id,
      declaredAt: daysAgo(1),
      eligibleFinalAt: new Date(daysAgo(1).getTime() + 15 * 60 * 1000),
      expiresAt: daysFromNow(1),
      finalizedAt: null,
      status: 'temporary',
      notes: '開発用: 仮解除中',
    }),
    upsertDeclaration({
      id: 'seed-declaration-resolved',
      markerId: resolvedMarker.id,
      declaredAt: daysAgo(6),
      eligibleFinalAt: new Date(daysAgo(6).getTime() + 15 * 60 * 1000),
      expiresAt: daysAgo(5),
      finalizedAt: daysAgo(5),
      status: 'resolved',
      notes: '開発用: 本解除済み',
    }),
  ]);

  await Promise.all([
    upsertCollectionRequest({
      id: 'seed-collection-request-pending',
      reportId: reports[2].id,
      requestedBy: admin.name,
      requestedAt: daysAgo(2),
      result: 'pending',
      resultRecordedBy: null,
      resultRecordedAt: null,
      notes: '歩道上に継続駐輪。回収を依頼済み。',
    }),
    upsertCollectionRequest({
      id: 'seed-collection-request-collected',
      reportId: reports[3].id,
      requestedBy: admin.name,
      requestedAt: daysAgo(3),
      result: 'collected',
      resultRecordedBy: '北区 回収業者',
      resultRecordedAt: daysAgo(2),
      notes: '回収業者が現地で回収完了。',
    }),
    upsertCollectionRequest({
      id: 'seed-collection-request-not-found',
      reportId: reports[4].id,
      requestedBy: admin.name,
      requestedAt: daysAgo(4),
      result: 'not_found_on_collection',
      resultRecordedBy: '北区 回収業者',
      resultRecordedAt: daysAgo(3),
      notes: '現地確認時に現物なし。',
    }),
  ]);

  const coupons = await Promise.all([
    upsertCoupon({
      id: 'seed-coupon-shopping-500',
      name: '商店街お買い物券500円',
      description: '商店街の加盟店で使える500円分のお買い物券',
      shopName: '北区商店街',
      discount: 500,
      discountType: 'amount',
      validDays: 30,
      isActive: true,
    }),
    upsertCoupon({
      id: 'seed-coupon-cafe-20',
      name: 'カフェ20%割引券',
      description: 'カフェ利用時に20%割引',
      shopName: '商店街カフェ',
      discount: 20,
      discountType: 'percentage',
      validDays: 14,
      isActive: true,
    }),
  ]);

  await Promise.all([
    upsertCouponIssuance({
      id: 'seed-coupon-issuance-active',
      couponId: coupons[0].id,
      userId: owner.id,
      markerId: resolvedMarker.id,
      ownerEmail: owner.email,
      issuedAt: daysAgo(5),
      expiresAt: daysFromNow(25),
      usedAt: null,
      status: 'active',
    }),
    upsertCouponIssuance({
      id: 'seed-coupon-issuance-used',
      couponId: coupons[1].id,
      userId: null,
      markerId: resolvedMarker.id,
      ownerEmail: 'guest-owner@example.test',
      issuedAt: daysAgo(10),
      expiresAt: daysFromNow(4),
      usedAt: daysAgo(8),
      status: 'used',
    }),
  ]);
}

async function upsertMarker(id: string, code: string, location: string) {
  return prisma.marker.upsert({
    where: { code },
    update: { location },
    create: { id, code, location },
  });
}

async function upsertReport(input: {
  id: string;
  markerId: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address: string;
  identifierText: string;
  status: string;
  notes: string;
  createdAt: Date;
  isCollectionCandidate?: boolean;
  collectionCandidateDecision?: string;
  collectionCandidateFlaggedAt?: Date | null;
}) {
  return prisma.bicycleReport.upsert({
    where: { id: input.id },
    update: {
      markerId: input.markerId,
      imageUrl: input.imageUrl,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address,
      identifierText: input.identifierText,
      status: input.status,
      notes: input.notes,
      createdAt: input.createdAt,
      isCollectionCandidate: input.isCollectionCandidate,
      collectionCandidateDecision: input.collectionCandidateDecision,
      collectionCandidateFlaggedAt: input.collectionCandidateFlaggedAt,
    },
    create: input,
  });
}

async function upsertDeclaration(input: {
  id: string;
  markerId: string;
  declaredAt: Date;
  eligibleFinalAt: Date;
  expiresAt: Date;
  finalizedAt: Date | null;
  status: string;
  notes: string;
}) {
  return prisma.declaration.upsert({
    where: { id: input.id },
    update: input,
    create: input,
  });
}

async function upsertCollectionRequest(input: {
  id: string;
  reportId: string;
  requestedBy: string | null;
  requestedAt: Date;
  result: string;
  resultRecordedBy: string | null;
  resultRecordedAt: Date | null;
  notes: string;
}) {
  return prisma.collectionRequest.upsert({
    where: { id: input.id },
    update: input,
    create: input,
  });
}

async function upsertCoupon(input: {
  id: string;
  name: string;
  description: string;
  shopName: string;
  discount: number;
  discountType: string;
  validDays: number;
  isActive: boolean;
}) {
  return prisma.coupon.upsert({
    where: { id: input.id },
    update: input,
    create: input,
  });
}

async function upsertCouponIssuance(input: {
  id: string;
  couponId: string;
  userId: string | null;
  markerId: string;
  ownerEmail: string;
  issuedAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
  status: string;
}) {
  return prisma.couponIssuance.upsert({
    where: { id: input.id },
    update: input,
    create: input,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
