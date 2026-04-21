import type { FastifyPluginAsync } from 'fastify';
import { sendError } from '../lib/errors';
import { ReportService } from '../services/reportService';

type CreateReportBody = {
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  markerCode?: string;
  identifierText?: string;
  notes?: string;
};

const reportRoutes: FastifyPluginAsync = async (fastify) => {
  const reportService = new ReportService(fastify.prisma as any);

  fastify.post<{ Body: CreateReportBody }>('/', async (request, reply) => {
    try {
      const report = await reportService.createReport(request.body ?? {});
      return reply.status(201).send(report);
    } catch (error) {
      return sendError(reply, fastify.log, error);
    }
  });
};

export default reportRoutes;
