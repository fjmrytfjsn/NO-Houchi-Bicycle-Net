import { PrismaClient } from '@prisma/client';

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

/**
 * クーポンサービス - クーポンの発行・取得・使用を管理
 */
export class CouponService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 本解除時にクーポンを自動発行
   * @param markerId マーカーID
   * @param ownerEmail 持ち主のメールアドレス（オプション）
   * @returns 発行されたクーポン情報
   */
  async issueCouponForFinalUnlock(
    markerId: string,
    ownerEmail?: string
  ): Promise<CouponData | null> {
    try {
      // アクティブなクーポンを1つ取得（商店街のクーポン）
      const availableCoupon = await this.prisma.coupon.findFirst({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!availableCoupon) {
        console.warn('利用可能なクーポンが見つかりません');
        return null;
      }

      // クーポン有効期限を計算
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + availableCoupon.validDays);

      // クーポンを発行
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
    } catch (error) {
      console.error('クーポン発行エラー:', error);
      return null;
    }
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
  async useCoupon(couponIssuanceId: string): Promise<boolean> {
    try {
      const issuance = await this.prisma.couponIssuance.findUnique({
        where: { id: couponIssuanceId },
      });

      if (!issuance || issuance.status !== 'active') {
        return false;
      }

      // 有効期限チェック
      if (new Date() > issuance.expiresAt) {
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
          usedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('クーポン使用エラー:', error);
      return false;
    }
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
