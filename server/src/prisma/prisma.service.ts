import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to PostgreSQL database via Prisma');
    } catch (error) {
      this.logger.warn(
        'Could not connect to PostgreSQL server. Running in mock DB fallback mode until database is available.'
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect().catch(() => {});
  }
}
