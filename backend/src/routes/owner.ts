import type { FastifyPluginAsync } from 'fastify';
import { sendError } from '../lib/errors';
import { requireNonBlankString } from '../lib/validation';
import { CouponService } from '../services/couponService';
import { OwnerUnlockService } from '../services/ownerUnlockService';

type MarkerParams = {
  code: string;
};

type CouponParams = {
  id: string;
};

type TemporaryUnlockBody = {
  notes?: string;
};

type FinalUnlockBody = {
  scannedCode?: string;
  ownerEmail?: string;
};

export default function createOwnerRoutes(options: { now?: () => Date } = {}): FastifyPluginAsync {
  return async function ownerRoutes(fastify) {
    const couponService = new CouponService(fastify.prisma as any);
    const ownerUnlockService = new OwnerUnlockService(
      fastify.prisma as any,
      couponService,
      options.now
    );

    fastify.get<{ Params: MarkerParams }>('/markers/:code', async (request, reply) => {
      try {
        const response = await ownerUnlockService.getMarkerEntry(
          requireNonBlankString(request.params.code, 'marker code required')
        );
        return reply.send(response);
      } catch (error) {
        console.error('[GET /markers/:code] Error:', error);
        return sendError(reply, fastify.log, error);
      }
    });

    fastify.get<{ Params: MarkerParams }>('/markers/:code/coupons', async (request, reply) => {
      try {
        const response = await ownerUnlockService.getCouponsByMarkerCode(
          requireNonBlankString(request.params.code, 'marker code required')
        );
        return reply.send(response);
      } catch (error) {
        return sendError(reply, fastify.log, error);
      }
    });

    fastify.post<{ Params: MarkerParams; Body: FinalUnlockBody }>(
      '/markers/:code/unlock-final',
      async (request, reply) => {
        try {
          const response = await ownerUnlockService.finalizeUnlock(
            requireNonBlankString(request.params.code, 'marker code required'),
            request.body ?? {}
          );
          return reply.send(response);
        } catch (error) {
          return sendError(reply, fastify.log, error);
        }
      }
    );

    fastify.post<{ Params: MarkerParams; Body: TemporaryUnlockBody }>(
      '/markers/:code/unlock-temp',
      async (request, reply) => {
        try {
          const code = requireNonBlankString(request.params.code, 'marker code required');
          console.log(`[unlock-temp] Received request for code: ${code}`);
          const response = await ownerUnlockService.createTemporaryUnlock(
            code,
            request.body?.notes
          );
          console.log(`[unlock-temp] Success:`, JSON.stringify(response));
          return reply.send(response);
        } catch (error) {
          console.error(`[unlock-temp] Error:`, error);
          return sendError(reply, fastify.log, error);
        }
      }
    );

    fastify.post<{ Params: CouponParams }>('/coupons/:id/use', async (request, reply) => {
      try {
        const success = await ownerUnlockService.useCoupon(request.params.id);

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
        return sendError(reply, fastify.log, error);
      }
    });

    // デモ用: マーカーの状態をリセットして一連のフローを繰り返す
    fastify.post<{ Params: MarkerParams }>('/markers/:code/reset', async (request, reply) => {
      try {
        const response = await ownerUnlockService.resetMarker(
          requireNonBlankString(request.params.code, 'marker code required')
        );
        return reply.send(response);
      } catch (error) {
        return sendError(reply, fastify.log, error);
      }
    });

    // デモ用: 15分の待機時間をスキップする
    fastify.post<{ Params: MarkerParams }>('/markers/:code/fast-forward', async (request, reply) => {
      try {
        const response = await ownerUnlockService.fastForwardTime(
          requireNonBlankString(request.params.code, 'marker code required')
        );
        return reply.send(response);
      } catch (error) {
        return sendError(reply, fastify.log, error);
      }
    });
  };
}
