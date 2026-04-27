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

type CollectionRequestBody = {
  notes?: string;
  requestedBy?: string;
};

type ListReportsQuery = {
  status?: string;
};

type ReportParams = {
  id: string;
};

const reportRoutes: FastifyPluginAsync = async (fastify) => {
  const reportService = new ReportService(fastify.prisma as any);

  fastify.get<{ Querystring: ListReportsQuery }>('/', async (request, reply) => {
    try {
      const reports = await reportService.listReports(request.query ?? {});
      return reply.send(reports);
    } catch (error) {
      return sendError(reply, fastify.log, error);
    }
  });

  fastify.get<{ Params: ReportParams }>('/:id', async (request, reply) => {
    try {
      const report = await reportService.getReport(request.params.id);
      return reply.send(report);
    } catch (error) {
      return sendError(reply, fastify.log, error);
    }
  });

  fastify.post<{ Body: CreateReportBody }>('/', async (request, reply) => {
    try {
      const report = await reportService.createReport(request.body ?? {});
      return reply.status(201).send(report);
    } catch (error) {
      return sendError(reply, fastify.log, error);
    }
  });

  fastify.post<{ Params: ReportParams; Body: CollectionRequestBody }>(
    '/:id/collection-request',
    async (request, reply) => {
      try {
        const report = await reportService.requestCollection(request.params.id, request.body ?? {});
        return reply.send(report);
      } catch (error) {
        return sendError(reply, fastify.log, error);
      }
    }
  );
};

export default reportRoutes;
