import { BadRequestError, NotFoundError } from '../lib/errors';

type MarkerRecord = {
  id: string;
  code: string;
};

type ReportRecord = {
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

type ReportPrisma = {
  marker: {
    upsert(args: {
      where: { code: string };
      update: { location?: string | null };
      create: { code: string; location?: string | null };
    }): Promise<MarkerRecord>;
  };
  bicycleReport: {
    findMany(args: {
      where?: { status?: string };
      orderBy?: { createdAt: 'asc' | 'desc' };
    }): Promise<ReportRecord[]>;
    findUnique(args: {
      where: { id: string };
    }): Promise<ReportRecord | null>;
    create(args: {
      data: {
        markerId: string;
        imageUrl: string;
        latitude: number;
        longitude: number;
        identifierText: string;
        status: string;
        notes?: string | null;
      };
    }): Promise<ReportRecord>;
  };
};

export class ReportService {
  constructor(private readonly prisma: ReportPrisma) {}

  async listReports(input: { status?: string }) {
    return this.prisma.bicycleReport.findMany({
      where: input.status ? { status: input.status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReport(id: string) {
    const report = await this.prisma.bicycleReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundError('report not found');
    }

    return report;
  }

  async createReport(input: {
    imageUrl?: string;
    latitude?: number;
    longitude?: number;
    markerCode?: string;
    identifierText?: string;
    notes?: string | null;
  }) {
    if (!input.imageUrl) {
      throw new BadRequestError('imageUrl required');
    }

    if (typeof input.latitude !== 'number' || typeof input.longitude !== 'number') {
      throw new BadRequestError('latitude and longitude must be numbers');
    }

    if (!input.markerCode) {
      throw new BadRequestError('markerCode required');
    }

    if (!input.identifierText) {
      throw new BadRequestError('identifierText required');
    }

    const marker = await this.getOrCreateMarker(input.markerCode);

    return this.prisma.bicycleReport.create({
      data: {
        markerId: marker.id,
        imageUrl: input.imageUrl,
        latitude: input.latitude,
        longitude: input.longitude,
        identifierText: input.identifierText,
        status: 'reported',
        notes: input.notes ?? null,
      },
    });
  }

  private async getOrCreateMarker(code: string) {
    return this.prisma.marker.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }
}
