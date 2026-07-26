import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const NEON_DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_JHo6NaeZb0Xr@ep-rapid-water-axg8ytdm-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: NEON_DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to Neon PostgreSQL database via Prisma');
    } catch (error) {
      this.logger.error('Prisma DB Connection Error:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect().catch(() => {});
  }
}
