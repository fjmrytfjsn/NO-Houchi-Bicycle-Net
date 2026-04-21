import { BadRequestError, NotFoundError } from '../lib/errors';
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
  };
  declaration: {
    findFirst(args: {
      where: { markerId: string; status?: string };
      orderBy: { declaredAt: 'asc' | 'desc' };
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
      data: { status: string; finalizedAt: Date };
    }): Promise<DeclarationRecord>;
  };
};

export class OwnerUnlockService {
  constructor(
    private readonly prisma: OwnerPrisma,
    private readonly couponService: CouponService,
    private readonly now: () => Date = () => new Date()
  ) {}

  async getMarkerByCode(code: string) {
    const marker = await this.prisma.marker.findUnique({
      where: { code },
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
      marker: {
        code: marker.code,
      },
      report,
      declaration,
    };
  }

  async getCouponsByMarkerCode(code: string) {
    const marker = await this.prisma.marker.findUnique({
      where: { code },
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
    const marker = await this.getOrCreateMarker(code);
    const declaredAt = this.now();
    const eligibleFinalAt = new Date(declaredAt.getTime() + 15 * 60 * 1000);
    const expiresAt = new Date(declaredAt.getTime() + 24 * 60 * 60 * 1000);

    const declaration = await this.prisma.declaration.create({
      data: {
        markerId: marker.id,
        declaredAt,
        eligibleFinalAt,
        expiresAt,
        status: 'temporary',
        notes: notes ?? null,
      },
    });

    return {
      declaredAt: declaration.declaredAt,
      eligibleFinalAt: declaration.eligibleFinalAt,
      expiresAt: declaration.expiresAt,
      status: declaration.status,
    };
  }

  async finalizeUnlock(code: string, input: { scannedCode?: string; ownerEmail?: string | null }) {
    if (!input.scannedCode) {
      throw new BadRequestError('scannedCode required');
    }

    if (input.scannedCode !== code) {
      throw new BadRequestError('scannedCode does not match marker code');
    }

    const marker = await this.prisma.marker.findUnique({
      where: { code },
    });
    if (!marker) {
      throw new BadRequestError('No temporary declaration found');
    }

    const declaration = await this.prisma.declaration.findFirst({
      where: {
        markerId: marker.id,
        status: 'temporary',
      },
      orderBy: { declaredAt: 'desc' },
    });

    if (!declaration) {
      throw new BadRequestError('No temporary declaration found');
    }

    const finalizedAt = this.now();
    if (finalizedAt < declaration.eligibleFinalAt) {
      throw new BadRequestError('eligibleFinalAt has not arrived', {
        eligibleFinalAt: declaration.eligibleFinalAt,
        currentTime: finalizedAt,
      });
    }

    await this.prisma.declaration.update({
      where: { id: declaration.id },
      data: {
        status: 'resolved',
        finalizedAt,
      },
    });

    const coupon = await this.couponService.issueCouponForFinalUnlock(
      marker.id,
      input.ownerEmail ?? null,
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
}
