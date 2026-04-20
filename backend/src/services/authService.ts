import bcrypt from 'bcryptjs';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../lib/errors';

type RegisterInput = {
  name?: string | null;
  email?: string;
  password?: string;
};

type LoginInput = {
  email?: string;
  password?: string;
};

type PublicUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
};

type UserRecord = PublicUser & {
  password: string;
};

type AuthPrisma = {
  user: {
    findUnique(args: {
      where: { email?: string; id?: string };
      select?: Record<string, boolean>;
    }): Promise<UserRecord | PublicUser | null>;
    create(args: {
      data: { name: string | null; email: string; password: string };
      select?: Record<string, boolean>;
    }): Promise<PublicUser>;
  };
};

export class AuthService {
  constructor(private readonly prisma: AuthPrisma) {}

  async register(input: RegisterInput): Promise<PublicUser> {
    if (!input.email || !input.password) {
      throw new BadRequestError('email and password required');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictError('email already in use');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    return this.prisma.user.create({
      data: {
        name: input.name ?? null,
        email: input.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async login(input: LoginInput): Promise<{ id: string; email: string; role: string }> {
    if (!input.email || !input.password) {
      throw new BadRequestError('email and password required');
    }

    const user = (await this.prisma.user.findUnique({
      where: { email: input.email },
    })) as UserRecord | null;

    if (!user) {
      throw new UnauthorizedError('invalid credentials');
    }

    const validPassword = await bcrypt.compare(input.password, user.password);
    if (!validPassword) {
      throw new UnauthorizedError('invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async getUserProfile(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user as PublicUser;
  }
}
