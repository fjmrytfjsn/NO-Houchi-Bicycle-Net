import { FastifyInstance } from 'fastify';
import { CouponService } from '../services/couponService';

export default async function (fastify: FastifyInstance) {
  const couponService = new CouponService((fastify as any).prisma);

  // マーカーIDからクーポン一覧を取得
  fastify.get('/markers/:code/coupons', async (request, reply) => {
    const params = request.params as any;
    const { code } = params;

    try {
      // マーカーを検索
      const marker = await (fastify as any).prisma.marker.findUnique({
        where: { code },
      });

      if (!marker) {
        return reply.status(404).send({ error: 'Marker not found' });
      }

      // クーポン一覧を取得
      const coupons = await couponService.getCouponsByMarker(marker.id);

      return reply.send({
        markerId: marker.id,
        code: marker.code,
        coupons,
      });
    } catch (error) {
      console.error('クーポン取得エラー:', error);
      return reply.status(500).send({ error: 'Failed to fetch coupons' });
    }
  });

  // 本解除時のクーポン発行（内部API）
  fastify.post('/markers/:code/unlock-final', async (request, reply) => {
    const params = request.params as any;
    const body = request.body as any;
    const { code } = params;
    const { ownerEmail } = body;

    try {
      // マーカーを検索または作成
      let marker = await (fastify as any).prisma.marker.findUnique({
        where: { code },
      });

      if (!marker) {
        marker = await (fastify as any).prisma.marker.create({
          data: { code },
        });
      }

      // 最新の宣言を取得
      const declaration = await (fastify as any).prisma.declaration.findFirst({
        where: {
          markerId: marker.id,
          status: 'temporary',
        },
        orderBy: { declaredAt: 'desc' },
      });

      if (!declaration) {
        return reply.status(400).send({ error: 'No temporary declaration found' });
      }

      // 本解除可能時刻チェック
      const now = new Date();
      if (now < declaration.eligibleFinalAt) {
        return reply.status(400).send({
          error: 'eligibleFinalAt has not arrived',
          eligibleFinalAt: declaration.eligibleFinalAt,
          currentTime: now,
        });
      }

      // 本解除処理
      await (fastify as any).prisma.declaration.update({
        where: { id: declaration.id },
        data: {
          status: 'resolved',
          finalizedAt: now,
        },
      });

      // クーポン発行
      const coupon = await couponService.issueCouponForFinalUnlock(
        marker.id,
        ownerEmail
      );

      return reply.send({
        finalizedAt: now,
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
        message: coupon
          ? 'クーポンを獲得しました！商店街でご利用ください。'
          : '本解除が完了しました',
      });
    } catch (error) {
      console.error('本解除エラー:', error);
      return reply.status(500).send({ error: 'Failed to finalize unlock' });
    }
  });

  // 仮解除エンドポイント
  fastify.post('/markers/:code/unlock-temp', async (request, reply) => {
    const params = request.params as any;
    const body = request.body as any;
    const { code } = params;
    const { notes } = body;

    try {
      // マーカーを検索または作成
      let marker = await (fastify as any).prisma.marker.findUnique({
        where: { code },
      });

      if (!marker) {
        marker = await (fastify as any).prisma.marker.create({
          data: { code },
        });
      }

      const declaredAt = new Date();
      const eligibleFinalAt = new Date(declaredAt.getTime() + 15 * 60 * 1000); // 15分後
      const expiresAt = new Date(declaredAt.getTime() + 24 * 60 * 60 * 1000); // 24時間後

      // 宣言を作成
      const declaration = await (fastify as any).prisma.declaration.create({
        data: {
          markerId: marker.id,
          declaredAt,
          eligibleFinalAt,
          expiresAt,
          status: 'temporary',
          notes,
        },
      });

      return reply.send({
        declaredAt: declaration.declaredAt,
        eligibleFinalAt: declaration.eligibleFinalAt,
        expiresAt: declaration.expiresAt,
        status: declaration.status,
      });
    } catch (error) {
      console.error('仮解除エラー:', error);
      return reply.status(500).send({ error: 'Failed to create temporary unlock' });
    }
  });

  // クーポン使用
  fastify.post('/coupons/:id/use', async (request, reply) => {
    const params = request.params as any;
    const { id } = params;

    try {
      const success = await couponService.useCoupon(id);

      if (!success) {
        return reply.status(400).send({
          error: 'Coupon cannot be used',
          message: 'クーポンは既に使用済みまたは期限切れです',
        });
      }

      return reply.send({
        success: true,
        message: 'クーポンを使用しました',
      });
    } catch (error) {
      console.error('クーポン使用エラー:', error);
      return reply.status(500).send({ error: 'Failed to use coupon' });
    }
  });
}
