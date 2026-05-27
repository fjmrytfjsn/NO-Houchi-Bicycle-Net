import { BadRequestError, ConflictError, NotFoundError } from '../lib/errors';
import {
  normalizeOptionalString,
  requireNonBlankString,
  validateOptionalEmail,
} from '../lib/validation';
import { CouponService } from './couponService';

type MarkerRecord = {
  id: string;
  code: string;
};

type BicycleReportRecord = {
  id: string;
  markerId: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  identifierText: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DeclarationRecord = {
  id: string;
  markerId: string;
  declaredAt: Date;
  eligibleFinalAt: Date;
  expiresAt: Date;
  finalizedAt: Date | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type OwnerPrisma = {
  marker: {
    findUnique(args: { where: { code?: string; id?: string } }): Promise<MarkerRecord | null>;
    create(args: { data: { code: string } }): Promise<MarkerRecord>;
  };
  bicycleReport: {
    findFirst(args: {
      where: { markerId: string };
      orderBy: { createdAt: 'asc' | 'desc' };
    }): Promise<BicycleReportRecord | null>;
    updateMany(args: {
      where: { markerId: string };
      data: { status: string };
    }): Promise<{ count: number }>;
  };
  declaration: {
    findFirst(args: {
      where: { markerId: string; status?: string };
      orderBy?: { declaredAt: 'asc' | 'desc' };
    }): Promise<DeclarationRecord | null>;
    create(args: {
      data: {
        markerId: string;
        declaredAt: Date;
        eligibleFinalAt: Date;
        expiresAt: Date;
        status: string;
        notes?: string | null;
      };
    }): Promise<DeclarationRecord>;
    update(args: {
      where: { id: string };
      data: { status?: string; finalizedAt?: Date; eligibleFinalAt?: Date; expiresAt?: Date };
    }): Promise<DeclarationRecord>;
    updateMany(args: {
      where: { markerId: string; status: string };
      data: { status: string };
    }): Promise<{ count: number }>;
    deleteMany(args: {
      where: { markerId: string };
    }): Promise<{ count: number }>;
  };
};

export class OwnerUnlockService {
  constructor(
    private readonly prisma: OwnerPrisma,
    private readonly couponService: CouponService,
    private readonly now: () => Date = () => new Date()
  ) { }

  async getMarkerEntry(code: string) {
    const normalizedCode = requireNonBlankString(code, 'marker code required');
    const marker = await this.prisma.marker.findUnique({
      where: { code: normalizedCode },
    });

    if (!marker) {
      throw new NotFoundError('Marker not found');
    }

    const [report, declaration] = await Promise.all([
      this.prisma.bicycleReport.findFirst({
        where: { markerId: marker.id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.declaration.findFirst({
        where: { markerId: marker.id },
        orderBy: { declaredAt: 'desc' },
      }),
    ]);

    return {
      marker: { code: marker.code },
      report: report ? { ...report } : null,
      declaration: declaration ? { ...declaration } : null,
    };
  }

  async getCouponsByMarkerCode(code: string) {
    const normalizedCode = requireNonBlankString(code, 'marker code required');
    const marker = await this.prisma.marker.findUnique({
      where: { code: normalizedCode },
    });

    if (!marker) {
      throw new NotFoundError('Marker not found');
    }

    const coupons = await this.couponService.getCouponsByMarker(marker.id);
    return {
      markerId: marker.id,
      code: marker.code,
      coupons,
    };
  }

  async createTemporaryUnlock(code: string, notes?: string) {
    const normalizedCode = requireNonBlankString(code, 'marker code required');
    const marker = await this.getOrCreateMarker(normalizedCode);

    // 問題5: 解決済みマーカーの再仮解除を禁止
    const resolvedDeclaration = await this.prisma.declaration.findFirst({
      where: {
        markerId: marker.id,
        status: 'resolved',
      },
    });
    if (resolvedDeclaration) {
      throw new ConflictError('このマーカーは既に本解除が完了しています');
    }

    const declaredAt = this.now();
    const eligibleFinalAt = new Date(declaredAt.getTime() + 15 * 60 * 1000);
    // 期限は「仮解除してから24時間後」
    const expiresAt = new Date(declaredAt.getTime() + 24 * 60 * 60 * 1000);

    // 問題3: 古い temporary declaration を expired に更新
    await this.prisma.declaration.updateMany({
      where: {
        markerId: marker.id,
        status: 'temporary',
      },
      data: {
        status: 'expired',
      },
    });

    const declaration = await this.prisma.declaration.create({
      data: {
        markerId: marker.id,
        declaredAt,
        eligibleFinalAt,
        expiresAt,
        status: 'temporary',
        notes: normalizeOptionalString(notes) ?? null,
      },
    });

    // 問題1: report の status も更新
    await this.prisma.bicycleReport.updateMany({
      where: { markerId: marker.id },
      data: { status: 'temporary' },
    });

    return {
      declaredAt: declaration.declaredAt,
      eligibleFinalAt: declaration.eligibleFinalAt,
      expiresAt: declaration.expiresAt,
      status: declaration.status,
    };
  }

  async finalizeUnlock(code: string, input: { scannedCode?: string; ownerEmail?: string | null }) {
    const normalizedCode = requireNonBlankString(code, 'marker code required');
    const scannedCode = requireNonBlankString(input.scannedCode, 'scannedCode required');
    const ownerEmail = validateOptionalEmail(input.ownerEmail, 'ownerEmail');

    if (scannedCode !== normalizedCode) {
      throw new BadRequestError('scannedCode does not match marker code');
    }

    const marker = await this.prisma.marker.findUnique({
      where: { code: normalizedCode },
    });
    if (!marker) {
      throw new NotFoundError('Marker not found');
    }

    const declaration = await this.prisma.declaration.findFirst({
      where: {
        markerId: marker.id,
        status: 'temporary',
      },
      orderBy: { declaredAt: 'desc' },
    });

    if (!declaration) {
      throw new ConflictError('No temporary declaration found');
    }

    const finalizedAt = this.now();
    if (finalizedAt < declaration.eligibleFinalAt) {
      throw new ConflictError('eligibleFinalAt has not arrived', {
        eligibleFinalAt: declaration.eligibleFinalAt,
        currentTime: finalizedAt,
      });
    }

    // 問題4: 24時間の期限チェック
    if (finalizedAt > declaration.expiresAt) {
      // 期限切れの declaration を expired に更新
      await this.prisma.declaration.update({
        where: { id: declaration.id },
        data: { status: 'expired' },
      });
      throw new ConflictError('仮解除の有効期限（24時間）が切れています。再度仮解除を行ってください');
    }

    await this.prisma.declaration.update({
      where: { id: declaration.id },
      data: {
        status: 'resolved',
        finalizedAt,
      },
    });

    // 問題1: report の status も resolved に更新
    await this.prisma.bicycleReport.updateMany({
      where: { markerId: marker.id },
      data: { status: 'resolved' },
    });

    const coupon = await this.couponService.issueCouponForFinalUnlock(
      marker.id,
      ownerEmail,
      finalizedAt
    );

    return {
      finalizedAt,
      status: 'resolved',
      coupon: coupon
        ? {
          id: coupon.id,
          name: coupon.name,
          description: coupon.description,
          shopName: coupon.shopName,
          discount: coupon.discount,
          discountType: coupon.discountType,
          expiresAt: coupon.expiresAt,
        }
        : null,
      message: coupon ? 'クーポンを獲得しました！商店街でご利用ください。' : '本解除が完了しました',
    };
  }

  async useCoupon(id: string): Promise<boolean> {
    return this.couponService.useCoupon(id, this.now());
  }

  private async getOrCreateMarker(code: string) {
    const existing = await this.prisma.marker.findUnique({
      where: { code },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.marker.create({
      data: { code },
    });
  }

  /** デモ用: マーカーの状態を初期化して一連のフローを繰り返せるようにする */
  async resetMarker(code: string) {
    const marker = await this.prisma.marker.findUnique({
      where: { code },
    });

    if (!marker) {
      throw new NotFoundError('Marker not found');
    }

    // declaration を全削除
    await this.prisma.declaration.deleteMany({
      where: { markerId: marker.id },
    });

    // report のステータスを初期状態に戻す
    await this.prisma.bicycleReport.updateMany({
      where: { markerId: marker.id },
      data: { status: 'reported' },
    });

    return { success: true, message: 'マーカーをリセットしました' };
  }

  /** デモ用: 15分の待機時間をスキップしてすぐに本解除可能にする */
  async fastForwardTime(code: string) {
    const marker = await this.prisma.marker.findUnique({
      where: { code },
    });

    if (!marker) {
      throw new NotFoundError('Marker not found');
    }

    const declaration = await this.prisma.declaration.findFirst({
      where: { markerId: marker.id, status: 'temporary' },
    });

    if (!declaration) {
      throw new BadRequestError('有効な仮解除データが見つかりません');
    }

    // eligibleFinalAt (本解除可能時間) だけを「今」に寄せ、期限は declaredAt 基準のまま維持する
    const now = this.now();
    await this.prisma.declaration.update({
      where: { id: declaration.id },
      data: {
        eligibleFinalAt: now,
        expiresAt: new Date(declaration.declaredAt.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    return { success: true, message: '待機時間をスキップしました' };
  }
}
