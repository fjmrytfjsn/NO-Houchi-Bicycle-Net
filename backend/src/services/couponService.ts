export interface CouponData {
  id: string;
  name: string;
  description: string;
  shopName: string;
  discount: number;
  discountType: string;
  expiresAt: Date;
  status: string;
  issuedAt: Date;
}

type CouponRecord = {
  id: string;
  name: string;
  description: string;
  shopName: string;
  discount: number;
  discountType: string;
  validDays: number;
  isActive: boolean;
  createdAt: Date;
};

type CouponIssuanceRecord = {
  id: string;
  couponId: string;
  markerId: string | null;
  ownerEmail: string | null;
  expiresAt: Date;
  issuedAt: Date;
  usedAt: Date | null;
  status: string;
};

type CouponPrisma = {
  coupon: {
    findFirst(args: {
      where: { isActive: boolean };
      orderBy: { createdAt: 'asc' | 'desc' };
    }): Promise<CouponRecord | null>;
    count(): Promise<number>;
    createMany(args: {
      data: Array<{
        name: string;
        description: string;
        shopName: string;
        discount: number;
        discountType: string;
        validDays: number;
        isActive: boolean;
      }>;
    }): Promise<{ count: number }>;
  };
  couponIssuance: {
    create(args: {
      data: {
        couponId: string;
        markerId: string;
        ownerEmail?: string | null;
        expiresAt: Date;
        status: string;
      };
      include: { coupon: boolean };
    }): Promise<CouponIssuanceRecord & { coupon: CouponRecord }>;
    findMany(args: {
      where: { markerId: string; status: { in: string[] } };
      include: { coupon: boolean };
      orderBy: { issuedAt: 'asc' | 'desc' };
    }): Promise<Array<CouponIssuanceRecord & { coupon: CouponRecord }>>;
    findUnique(args: { where: { id: string } }): Promise<CouponIssuanceRecord | null>;
    update(args: {
      where: { id: string };
      data: { status: string; usedAt?: Date | null };
    }): Promise<CouponIssuanceRecord>;
  };
};

/**
 * クーポンサービス - クーポンの発行・取得・使用を管理
 */
export class CouponService {
  constructor(private readonly prisma: CouponPrisma) {}

  /**
   * 本解除時にクーポンを自動発行
   * @param markerId マーカーID
   * @param ownerEmail 持ち主のメールアドレス（オプション）
   * @returns 発行されたクーポン情報
   */
  async issueCouponForFinalUnlock(
    markerId: string,
    ownerEmail?: string | null,
    issuedAt: Date = new Date()
  ): Promise<CouponData | null> {
    const availableCoupon = await this.prisma.coupon.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!availableCoupon) {
      return null;
    }

    const expiresAt = new Date(issuedAt);
    expiresAt.setDate(expiresAt.getDate() + availableCoupon.validDays);

    const issuance = await this.prisma.couponIssuance.create({
      data: {
        couponId: availableCoupon.id,
        markerId,
        ownerEmail,
        expiresAt,
        status: 'active',
      },
      include: {
        coupon: true,
      },
    });

    return {
      id: issuance.id,
      name: issuance.coupon.name,
      description: issuance.coupon.description,
      shopName: issuance.coupon.shopName,
      discount: issuance.coupon.discount,
      discountType: issuance.coupon.discountType,
      expiresAt: issuance.expiresAt,
      status: issuance.status,
      issuedAt: issuance.issuedAt,
    };
  }

  /**
   * マーカーに紐づくクーポンを取得
   * @param markerId マーカーID
   * @returns クーポン一覧
   */
  async getCouponsByMarker(markerId: string): Promise<CouponData[]> {
    const issuances = await this.prisma.couponIssuance.findMany({
      where: {
        markerId,
        status: {
          in: ['active', 'used'],
        },
      },
      include: {
        coupon: true,
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });

    return issuances.map((issuance) => ({
      id: issuance.id,
      name: issuance.coupon.name,
      description: issuance.coupon.description,
      shopName: issuance.coupon.shopName,
      discount: issuance.coupon.discount,
      discountType: issuance.coupon.discountType,
      expiresAt: issuance.expiresAt,
      status: issuance.status,
      issuedAt: issuance.issuedAt,
    }));
  }

  /**
   * クーポンを使用済みにする
   * @param couponIssuanceId クーポン発行ID
   * @returns 成功したかどうか
   */
  async useCoupon(couponIssuanceId: string, now: Date = new Date()): Promise<boolean> {
    const issuance = await this.prisma.couponIssuance.findUnique({
      where: { id: couponIssuanceId },
    });

    if (!issuance || issuance.status !== 'active') {
      return false;
    }

    if (now > issuance.expiresAt) {
      await this.prisma.couponIssuance.update({
        where: { id: couponIssuanceId },
        data: { status: 'expired' },
      });
      return false;
    }

    await this.prisma.couponIssuance.update({
      where: { id: couponIssuanceId },
      data: {
        status: 'used',
        usedAt: now,
      },
    });

    return true;
  }

  /**
   * デフォルトクーポンを作成（初期データ）
   */
  async createDefaultCoupons(): Promise<void> {
    const existingCoupons = await this.prisma.coupon.count();
    if (existingCoupons > 0) {
      return; // 既にクーポンが存在する場合はスキップ
    }

    await this.prisma.coupon.createMany({
      data: [
        {
          name: '商店街お買い物券500円',
          description: '商店街の加盟店で使える500円分のお買い物券',
          shopName: '北区商店街',
          discount: 500,
          discountType: 'amount',
          validDays: 30,
          isActive: true,
        },
        {
          name: 'カフェ20%割引券',
          description: 'カフェ利用時に20%割引',
          shopName: '商店街カフェ',
          discount: 20,
          discountType: 'percentage',
          validDays: 14,
          isActive: true,
        },
      ],
    });
  }
}
