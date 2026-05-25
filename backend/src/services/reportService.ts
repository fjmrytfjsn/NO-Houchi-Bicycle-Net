import { BadRequestError, ConflictError, NotFoundError } from '../lib/errors';
import {
  normalizeOptionalString,
  requireNonBlankString,
  validateCoordinates,
  validateReportStatus,
} from '../lib/validation';

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
  address: string | null;
  identifierText: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CollectionRequestRecord = {
  id: string;
  reportId: string;
  requestedBy: string | null;
  requestedAt: Date;
  result: string;
  resultRecordedBy: string | null;
  resultRecordedAt: Date | null;
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

type ReportHistoryEntry = {
  id: string;
  timestamp: string;
  label: string;
  notes?: string;
};

type CollectionResult = 'collected' | 'not_found_on_collection';

type ReportTransactionPrisma = {
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
        address?: string | null;
        identifierText: string;
        status: string;
        notes?: string | null;
      };
    }): Promise<ReportRecord>;
    update(args: {
      where: { id: string };
      data: {
        status?: string;
        notes?: string | null;
      };
    }): Promise<ReportRecord>;
    updateMany(args: {
      where: { id: string; status?: string };
      data: {
        status?: string;
        notes?: string | null;
      };
    }): Promise<{ count: number }>;
  };
  collectionRequest: {
    findFirst(args: {
      where: {
        reportId: string;
        result: string;
      };
      orderBy: { requestedAt: 'desc' };
    }): Promise<CollectionRequestRecord | null>;
    create(args: {
      data: {
        reportId: string;
        requestedBy?: string | null;
        requestedAt: Date;
        result: string;
        notes?: string | null;
      };
    }): Promise<CollectionRequestRecord>;
    findMany(args: {
      where: {
        reportId: string;
      };
      orderBy?: { requestedAt: 'asc' | 'desc' };
    }): Promise<CollectionRequestRecord[]>;
    update(args: {
      where: { id: string };
      data: {
        result: CollectionResult;
        resultRecordedBy?: string | null;
        resultRecordedAt: Date;
        notes?: string | null;
      };
    }): Promise<CollectionRequestRecord>;
  };
};

type ReportPrisma = ReportTransactionPrisma & {
  marker: {
    upsert(args: {
      where: { code: string };
      update: { location?: string | null };
      create: { code: string; location?: string | null };
    }): Promise<MarkerRecord>;
  };
  declaration: {
    findMany(args: {
      where: {
        markerId: string;
      };
      orderBy?: { declaredAt: 'asc' | 'desc' };
    }): Promise<DeclarationRecord[]>;
  };
  $transaction<T>(fn: (tx: ReportTransactionPrisma) => Promise<T>): Promise<T>;
};

export class ReportService {
  constructor(private readonly prisma: ReportPrisma) {}

  async listReports(input: { status?: string }) {
    const status = validateReportStatus(input.status);

    return this.prisma.bicycleReport.findMany({
      where: status ? { status } : undefined,
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

    const [declarations, collectionRequests] = await Promise.all([
      this.prisma.declaration.findMany({
        where: { markerId: report.markerId },
        orderBy: { declaredAt: 'asc' },
      }),
      this.prisma.collectionRequest.findMany({
        where: { reportId: report.id },
        orderBy: { requestedAt: 'asc' },
      }),
    ]);

    return {
      ...report,
      history: this.buildReportHistory(report, declarations, collectionRequests),
    };
  }

  async createReport(input: {
    imageUrl?: string;
    latitude?: number;
    longitude?: number;
    markerCode?: string;
    identifierText?: string;
    notes?: string | null;
  }) {
    const imageUrl = requireNonBlankString(input.imageUrl, 'imageUrl required');
    const markerCode = requireNonBlankString(input.markerCode, 'markerCode required');
    const identifierText = requireNonBlankString(input.identifierText, 'identifierText required');
    const { latitude, longitude } = validateCoordinates(input.latitude, input.longitude);

    const marker = await this.getOrCreateMarker(markerCode);
    const address = await this.resolveAddress(latitude, longitude);

    return this.prisma.bicycleReport.create({
      data: {
        markerId: marker.id,
        imageUrl,
        latitude,
        longitude,
        address,
        identifierText,
        status: 'reported',
        notes: normalizeOptionalString(input.notes) ?? null,
      },
    });
  }

  async requestCollection(id: string, input: { notes?: string | null; requestedBy?: string | null }) {
    const report = await this.prisma.bicycleReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundError('report not found');
    }

    if (report.status !== 'reported') {
      throw new ConflictError('report is not eligible for collection request');
    }

    const requestedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.bicycleReport.updateMany({
        where: {
          id: report.id,
          status: 'reported',
        },
        data: {
          status: 'collection_requested',
        },
      });

      if (updateResult.count !== 1) {
        throw new ConflictError('report is not eligible for collection request');
      }

      await tx.collectionRequest.create({
        data: {
          reportId: report.id,
          requestedBy: normalizeOptionalString(input.requestedBy) ?? null,
          requestedAt,
          result: 'pending',
          notes: normalizeOptionalString(input.notes) ?? null,
        },
      });

      const updatedReport = await tx.bicycleReport.findUnique({
        where: { id: report.id },
      });

      if (!updatedReport) {
        throw new NotFoundError('report not found');
      }

      return updatedReport;
    });
  }

  async recordCollectionResult(
    id: string,
    input: { result?: string; notes?: string | null; resultRecordedBy?: string | null }
  ) {
    const report = await this.prisma.bicycleReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundError('report not found');
    }

    const result = this.parseCollectionResult(input.result);

    if (report.status !== 'collection_requested') {
      throw new ConflictError('report is not eligible for collection result');
    }

    const resultRecordedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      const pendingRequest = await tx.collectionRequest.findFirst({
        where: {
          reportId: report.id,
          result: 'pending',
        },
        orderBy: { requestedAt: 'desc' },
      });

      if (!pendingRequest) {
        throw new ConflictError('pending collection request not found');
      }

      const updateResult = await tx.bicycleReport.updateMany({
        where: {
          id: report.id,
          status: 'collection_requested',
        },
        data: {
          status: result,
        },
      });

      if (updateResult.count !== 1) {
        throw new ConflictError('report is not eligible for collection result');
      }

      await tx.collectionRequest.update({
        where: { id: pendingRequest.id },
        data: {
          result,
          resultRecordedBy: normalizeOptionalString(input.resultRecordedBy) ?? null,
          resultRecordedAt,
          notes: normalizeOptionalString(input.notes) ?? null,
        },
      });

      const updatedReport = await tx.bicycleReport.findUnique({
        where: { id: report.id },
      });

      if (!updatedReport) {
        throw new NotFoundError('report not found');
      }

      return updatedReport;
    });
  }

  private async getOrCreateMarker(code: string) {
    return this.prisma.marker.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }

  private parseCollectionResult(result: string | undefined): CollectionResult {
    if (result === 'collected' || result === 'not_found_on_collection') {
      return result;
    }

    throw new BadRequestError('collection result must be collected or not_found_on_collection');
  }

  private async resolveAddress(latitude: number, longitude: number) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return null;
    }

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('latlng', `${latitude},${longitude}`);
      url.searchParams.set('language', 'ja');
      url.searchParams.set('key', apiKey);

      const response = await fetch(url.toString());

      if (!response.ok) {
        return null;
      }

      const body = (await response.json()) as {
        status?: string;
        results?: Array<{ formatted_address?: string }>;
      };

      if (body.status !== 'OK') {
        return null;
      }

      return body.results?.[0]?.formatted_address ?? null;
    } catch (error) {
      return null;
    }
  }

  private buildReportHistory(
    report: ReportRecord,
    declarations: DeclarationRecord[],
    collectionRequests: CollectionRequestRecord[]
  ): ReportHistoryEntry[] {
    const history: ReportHistoryEntry[] = [
      {
        id: `${report.id}:reported`,
        timestamp: report.createdAt.toISOString(),
        label: '通報を受付',
      },
    ];

    for (const declaration of declarations) {
      history.push({
        id: `${declaration.id}:temporary`,
        timestamp: declaration.declaredAt.toISOString(),
        label: '持ち主が仮解除',
        ...(declaration.notes ? { notes: declaration.notes } : {}),
      });

      if (declaration.status === 'resolved' && declaration.finalizedAt) {
        history.push({
          id: `${declaration.id}:resolved`,
          timestamp: declaration.finalizedAt.toISOString(),
          label: '持ち主が本解除',
        });
      }
    }

    for (const collectionRequest of collectionRequests) {
      history.push({
        id: `${collectionRequest.id}:requested`,
        timestamp: collectionRequest.requestedAt.toISOString(),
        label: '回収依頼を登録',
        ...(collectionRequest.notes && collectionRequest.result === 'pending'
          ? { notes: collectionRequest.notes }
          : {}),
      });

      if (collectionRequest.result !== 'pending' && collectionRequest.resultRecordedAt) {
        history.push({
          id: `${collectionRequest.id}:result`,
          timestamp: collectionRequest.resultRecordedAt.toISOString(),
          label: '回収結果を記録',
          ...(collectionRequest.notes ? { notes: collectionRequest.notes } : {}),
        });
      }
    }

    return history.sort(
      (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()
    );
  }
}
