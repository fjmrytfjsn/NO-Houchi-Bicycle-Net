import { BadRequestError, ConflictError, NotFoundError } from '../lib/errors';

type BikeRecord = {
  id: string;
  serialNumber: string;
  status: string;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type BikePrisma = {
  bike: {
    findMany(): Promise<BikeRecord[]>;
    findUnique(args: { where: { id?: string; serialNumber?: string } }): Promise<BikeRecord | null>;
    create(args: {
      data: { serialNumber: string; location?: string | null; status?: string };
    }): Promise<BikeRecord>;
    update(args: {
      where: { id: string };
      data: { location?: string | null; status?: string };
    }): Promise<BikeRecord>;
    delete(args: { where: { id: string } }): Promise<BikeRecord>;
  };
};

export class BikeService {
  constructor(private readonly prisma: BikePrisma) {}

  async listBikes() {
    return this.prisma.bike.findMany();
  }

  async createBike(input: { serialNumber?: string; location?: string | null; status?: string }) {
    if (!input.serialNumber) {
      throw new BadRequestError('serialNumber required');
    }

    const existing = await this.prisma.bike.findUnique({
      where: { serialNumber: input.serialNumber },
    });
    if (existing) {
      throw new ConflictError('serialNumber already exists');
    }

    return this.prisma.bike.create({
      data: {
        serialNumber: input.serialNumber,
        location: input.location ?? null,
        status: input.status ?? 'available',
      },
    });
  }

  async getBike(id: string) {
    const bike = await this.prisma.bike.findUnique({
      where: { id },
    });
    if (!bike) {
      throw new NotFoundError('not found');
    }
    return bike;
  }

  async updateBike(id: string, input: { location?: string | null; status?: string }) {
    await this.getBike(id);
    return this.prisma.bike.update({
      where: { id },
      data: {
        location: input.location,
        status: input.status,
      },
    });
  }

  async deleteBike(id: string) {
    await this.getBike(id);
    await this.prisma.bike.delete({
      where: { id },
    });
  }
}
