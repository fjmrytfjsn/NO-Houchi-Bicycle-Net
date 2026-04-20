import type { FastifyPluginAsync } from 'fastify';
import { BadRequestError, sendError } from '../lib/errors';
import { BikeService } from '../services/bikeService';
import { getOCRService, type OCRService } from '../services/ocrService';

type BikeParams = {
  id: string;
};

type CreateBikeBody = {
  serialNumber?: string;
  location?: string | null;
  status?: string;
};

type UpdateBikeBody = {
  location?: string | null;
  status?: string;
};

type OCRRequestBody = {
  filePath?: string;
};

export default function createBikeRoutes(options: { ocrService?: OCRService } = {}): FastifyPluginAsync {
  return async function bikeRoutes(fastify) {
    const bikeService = new BikeService(fastify.prisma as any);
    const resolveOCRService = () => options.ocrService ?? getOCRService();

    fastify.get('/', async (_request, reply) => {
      try {
        const bikes = await bikeService.listBikes();
        return reply.send(bikes);
      } catch (error) {
        return sendError(reply, fastify.log, error);
      }
    });

    fastify.post<{ Body: CreateBikeBody }>('/', async (request, reply) => {
      try {
        const bike = await bikeService.createBike(request.body ?? {});
        return reply.status(201).send(bike);
      } catch (error) {
        return sendError(reply, fastify.log, error);
      }
    });

    fastify.get<{ Params: BikeParams }>('/:id', async (request, reply) => {
      try {
        const bike = await bikeService.getBike(request.params.id);
        return reply.send(bike);
      } catch (error) {
        return sendError(reply, fastify.log, error);
      }
    });

    fastify.put<{ Params: BikeParams; Body: UpdateBikeBody }>('/:id', async (request, reply) => {
      try {
        const bike = await bikeService.updateBike(request.params.id, request.body ?? {});
        return reply.send(bike);
      } catch (error) {
        return sendError(reply, fastify.log, error);
      }
    });

    fastify.delete<{ Params: BikeParams }>('/:id', async (request, reply) => {
      try {
        await bikeService.deleteBike(request.params.id);
        return reply.status(204).send();
      } catch (error) {
        return sendError(reply, fastify.log, error);
      }
    });

    fastify.post<{ Body: OCRRequestBody }>('/ocr/recognize', async (request, reply) => {
      try {
        if (!request.body?.filePath) {
          throw new BadRequestError('filePath required', {
            message: 'FTPから取得した画像ファイルのパスを指定してください',
          });
        }

        const result = await resolveOCRService().recognizeRegistrationNumber(request.body.filePath);

        if (!result.success) {
          return reply.status(400).send({
            error: result.error,
            result: {
              registrationNumber: null,
              confidence: 0,
              rawText: '',
            },
          });
        }

        return reply.status(200).send({
          success: true,
          result: {
            registrationNumber: result.registrationNumber,
            confidence: result.confidence,
            rawText: result.rawText,
          },
        });
      } catch (error) {
        return sendError(reply, fastify.log, error);
      }
    });
  };
}
