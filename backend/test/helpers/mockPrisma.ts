type UserRecord = {
  id: string;
  name: string | null;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

type BikeRecord = {
  id: string;
  serialNumber: string;
  status: string;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type MarkerRecord = {
  id: string;
  code: string;
  location: string | null;
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

type CouponRecord = {
  id: string;
  name: string;
  description: string;
  shopName: string;
  discount: number;
  discountType: string;
  validDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CouponIssuanceRecord = {
  id: string;
  couponId: string;
  userId: string | null;
  markerId: string | null;
  ownerEmail: string | null;
  issuedAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type SelectShape = Record<string, boolean>;

function pickSelected<T extends Record<string, unknown>>(record: T, select?: SelectShape) {
  if (!select) {
    return record;
  }

  const selectedEntries = Object.entries(select)
    .filter(([, enabled]) => enabled)
    .map(([key]) => [key, record[key]]);

  return Object.fromEntries(selectedEntries);
}

function sortByDateDesc<T>(items: T[], getter: (value: T) => Date) {
  return [...items].sort((left, right) => getter(right).getTime() - getter(left).getTime());
}

export function createMockPrisma() {
  const users = new Map<string, UserRecord>();
  const bikes = new Map<string, BikeRecord>();
  const markers = new Map<string, MarkerRecord>();
  const reports = new Map<string, BicycleReportRecord>();
  const declarations = new Map<string, DeclarationRecord>();
  const coupons = new Map<string, CouponRecord>();
  const couponIssuances = new Map<string, CouponIssuanceRecord>();

  const counters = {
    user: 0,
    bike: 0,
    marker: 0,
    report: 0,
    declaration: 0,
    coupon: 0,
    issuance: 0,
  };

  const prisma = {
    user: {
      findUnique: async ({ where, select }: { where: { email?: string; id?: string }; select?: SelectShape }) => {
        let user: UserRecord | null = null;

        if (where.id) {
          user = users.get(where.id) ?? null;
        } else if (where.email) {
          user = Array.from(users.values()).find((entry) => entry.email === where.email) ?? null;
        }

        return user ? pickSelected(user, select) : null;
      },
      create: async ({
        data,
        select,
      }: {
        data: { name?: string | null; email: string; password: string; role?: string };
        select?: SelectShape;
      }) => {
        counters.user += 1;
        const now = new Date();
        const record: UserRecord = {
          id: `u-${counters.user}`,
          name: data.name ?? null,
          email: data.email,
          password: data.password,
          role: data.role ?? 'user',
          createdAt: now,
          updatedAt: now,
        };
        users.set(record.id, record);
        return pickSelected(record, select);
      },
    },
    bike: {
      findMany: async () => Array.from(bikes.values()),
      findUnique: async ({
        where,
      }: {
        where: { id?: string; serialNumber?: string };
      }) => {
        if (where.id) {
          return bikes.get(where.id) ?? null;
        }

        if (where.serialNumber) {
          return Array.from(bikes.values()).find((entry) => entry.serialNumber === where.serialNumber) ?? null;
        }

        return null;
      },
      create: async ({
        data,
      }: {
        data: { serialNumber: string; location?: string | null; status?: string };
      }) => {
        counters.bike += 1;
        const now = new Date();
        const record: BikeRecord = {
          id: `b-${counters.bike}`,
          serialNumber: data.serialNumber,
          location: data.location ?? null,
          status: data.status ?? 'available',
          createdAt: now,
          updatedAt: now,
        };
        bikes.set(record.id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { location?: string | null; status?: string };
      }) => {
        const existing = bikes.get(where.id);
        if (!existing) {
          throw new Error('not found');
        }

        const updated: BikeRecord = {
          ...existing,
          location: data.location ?? existing.location,
          status: data.status ?? existing.status,
          updatedAt: new Date(),
        };
        bikes.set(where.id, updated);
        return updated;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const existing = bikes.get(where.id);
        if (!existing) {
          throw new Error('not found');
        }

        bikes.delete(where.id);
        return existing;
      },
    },
    marker: {
      findUnique: async ({ where }: { where: { code?: string; id?: string } }) => {
        if (where.id) {
          return markers.get(where.id) ?? null;
        }

        if (where.code) {
          return Array.from(markers.values()).find((entry) => entry.code === where.code) ?? null;
        }

        return null;
      },
      create: async ({ data }: { data: { code: string; location?: string | null } }) => {
        counters.marker += 1;
        const now = new Date();
        const record: MarkerRecord = {
          id: `m-${counters.marker}`,
          code: data.code,
          location: data.location ?? null,
          createdAt: now,
          updatedAt: now,
        };
        markers.set(record.id, record);
        return record;
      },
      upsert: async ({
        where,
        create,
      }: {
        where: { code: string };
        update: { location?: string | null };
        create: { code: string; location?: string | null };
      }) => {
        const existing = Array.from(markers.values()).find((entry) => entry.code === where.code) ?? null;
        if (existing) {
          return existing;
        }

        counters.marker += 1;
        const now = new Date();
        const record: MarkerRecord = {
          id: `m-${counters.marker}`,
          code: create.code,
          location: create.location ?? null,
          createdAt: now,
          updatedAt: now,
        };
        markers.set(record.id, record);
        return record;
      },
    },
    bicycleReport: {
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: { status?: string };
        orderBy?: { createdAt: 'asc' | 'desc' };
      }) => {
        let filtered = Array.from(reports.values());

        if (where?.status) {
          filtered = filtered.filter((entry) => entry.status === where.status);
        }

        if (orderBy?.createdAt === 'desc') {
          return sortByDateDesc(filtered, (entry) => entry.createdAt);
        }

        if (orderBy?.createdAt === 'asc') {
          return [...filtered].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
        }

        return filtered;
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        return reports.get(where.id) ?? null;
      },
      create: async ({
        data,
      }: {
        data: {
          markerId: string;
          imageUrl: string;
          latitude: number;
          longitude: number;
          identifierText: string;
          status: string;
          notes?: string | null;
        };
      }) => {
        counters.report += 1;
        const now = new Date();
        const record: BicycleReportRecord = {
          id: `r-${counters.report}`,
          markerId: data.markerId,
          imageUrl: data.imageUrl,
          latitude: data.latitude,
          longitude: data.longitude,
          identifierText: data.identifierText,
          status: data.status,
          notes: data.notes ?? null,
          createdAt: now,
          updatedAt: now,
        };
        reports.set(record.id, record);
        return record;
      },
    },
    declaration: {
      findFirst: async ({
        where,
      }: {
        where: { markerId: string; status?: string };
        orderBy?: { declaredAt: 'asc' | 'desc' };
      }) => {
        const filtered = Array.from(declarations.values()).filter((entry) => {
          return entry.markerId === where.markerId && (!where.status || entry.status === where.status);
        });

        return sortByDateDesc(filtered, (entry) => entry.declaredAt)[0] ?? null;
      },
      create: async ({
        data,
      }: {
        data: {
          markerId: string;
          declaredAt: Date;
          eligibleFinalAt: Date;
          expiresAt: Date;
          status: string;
          notes?: string | null;
        };
      }) => {
        counters.declaration += 1;
        const now = new Date();
        const record: DeclarationRecord = {
          id: `d-${counters.declaration}`,
          markerId: data.markerId,
          declaredAt: data.declaredAt,
          eligibleFinalAt: data.eligibleFinalAt,
          expiresAt: data.expiresAt,
          status: data.status,
          notes: data.notes ?? null,
          finalizedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        declarations.set(record.id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { status?: string; finalizedAt?: Date | null };
      }) => {
        const existing = declarations.get(where.id);
        if (!existing) {
          throw new Error('not found');
        }

        const updated: DeclarationRecord = {
          ...existing,
          status: data.status ?? existing.status,
          finalizedAt: data.finalizedAt ?? existing.finalizedAt,
          updatedAt: new Date(),
        };
        declarations.set(where.id, updated);
        return updated;
      },
    },
    coupon: {
      findFirst: async ({
        where,
      }: {
        where?: { isActive?: boolean };
        orderBy?: { createdAt: 'asc' | 'desc' };
      }) => {
        const filtered = Array.from(coupons.values()).filter((entry) => {
          return where?.isActive === undefined ? true : entry.isActive === where.isActive;
        });

        return sortByDateDesc(filtered, (entry) => entry.createdAt)[0] ?? null;
      },
      count: async () => coupons.size,
      createMany: async ({ data }: { data: Array<Omit<CouponRecord, 'id' | 'createdAt' | 'updatedAt'>> }) => {
        for (const item of data) {
          counters.coupon += 1;
          const now = new Date();
          const record: CouponRecord = {
            id: `c-${counters.coupon}`,
            createdAt: now,
            updatedAt: now,
            ...item,
          };
          coupons.set(record.id, record);
        }

        return { count: data.length };
      },
    },
    couponIssuance: {
      create: async ({
        data,
        include,
      }: {
        data: {
          couponId: string;
          markerId?: string | null;
          userId?: string | null;
          ownerEmail?: string | null;
          expiresAt: Date;
          status: string;
        };
        include?: { coupon?: boolean };
      }) => {
        counters.issuance += 1;
        const now = new Date();
        const record: CouponIssuanceRecord = {
          id: `ci-${counters.issuance}`,
          couponId: data.couponId,
          markerId: data.markerId ?? null,
          userId: data.userId ?? null,
          ownerEmail: data.ownerEmail ?? null,
          expiresAt: data.expiresAt,
          status: data.status,
          issuedAt: now,
          usedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        couponIssuances.set(record.id, record);

        if (include?.coupon) {
          return {
            ...record,
            coupon: coupons.get(record.couponId)!,
          };
        }

        return record;
      },
      findMany: async ({
        where,
        include,
      }: {
        where: { markerId?: string; status?: { in: string[] } };
        include?: { coupon?: boolean };
        orderBy?: { issuedAt: 'asc' | 'desc' };
      }) => {
        const filtered = Array.from(couponIssuances.values()).filter((entry) => {
          const matchesMarker = where.markerId === undefined ? true : entry.markerId === where.markerId;
          const matchesStatus = where.status?.in ? where.status.in.includes(entry.status) : true;
          return matchesMarker && matchesStatus;
        });

        return sortByDateDesc(filtered, (entry) => entry.issuedAt).map((entry) => {
          if (include?.coupon) {
            return {
              ...entry,
              coupon: coupons.get(entry.couponId)!,
            };
          }

          return entry;
        });
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        return couponIssuances.get(where.id) ?? null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { status?: string; usedAt?: Date | null };
      }) => {
        const existing = couponIssuances.get(where.id);
        if (!existing) {
          throw new Error('not found');
        }

        const updated: CouponIssuanceRecord = {
          ...existing,
          status: data.status ?? existing.status,
          usedAt: data.usedAt ?? existing.usedAt,
          updatedAt: new Date(),
        };
        couponIssuances.set(where.id, updated);
        return updated;
      },
    },
  };

  return {
    prisma,
    state: {
      users,
      bikes,
      markers,
      reports,
      declarations,
      coupons,
      couponIssuances,
    },
    seedCoupon(data: Partial<Omit<CouponRecord, 'id' | 'createdAt' | 'updatedAt'>> = {}) {
      counters.coupon += 1;
      const now = new Date();
      const record: CouponRecord = {
        id: `c-${counters.coupon}`,
        name: data.name ?? '商店街お買い物券500円',
        description: data.description ?? '商店街の加盟店で使える500円分のお買い物券',
        shopName: data.shopName ?? '北区商店街',
        discount: data.discount ?? 500,
        discountType: data.discountType ?? 'amount',
        validDays: data.validDays ?? 30,
        isActive: data.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      };
      coupons.set(record.id, record);
      return record;
    },
  };
}
