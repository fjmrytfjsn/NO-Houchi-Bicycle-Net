import type { FastifyPluginAsync } from 'fastify';
import { sendError } from '../lib/errors';
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
        const response = await ownerUnlockService.getMarkerByCode(request.params.code);
        return reply.send(response);
      } catch (error) {
        return sendError(reply, fastify.log, error);
      }
    });

    fastify.get<{ Params: MarkerParams }>('/markers/:code/coupons', async (request, reply) => {
      try {
        const response = await ownerUnlockService.getCouponsByMarkerCode(request.params.code);
        return reply.send(response);
      } catch (error) {
        return sendError(reply, fastify.log, error);
      }
    });

    fastify.post<{ Params: MarkerParams; Body: FinalUnlockBody }>(
      '/markers/:code/unlock-final',
      async (request, reply) => {
        try {
          const response = await ownerUnlockService.finalizeUnlock(request.params.code, request.body ?? {});
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
          const response = await ownerUnlockService.createTemporaryUnlock(
            request.params.code,
            request.body?.notes
          );
          return reply.send(response);
        } catch (error) {
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
  };
}
