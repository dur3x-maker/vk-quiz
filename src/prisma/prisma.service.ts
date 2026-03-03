import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private static readonly MAX_RETRIES = 5;
  private static readonly BASE_DELAY_MS = 1000;

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async connectWithRetry(attempt = 1): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      if (attempt >= PrismaService.MAX_RETRIES) {
        this.logger.error(
          `Failed to connect to database after ${PrismaService.MAX_RETRIES} attempts`,
          error instanceof Error ? error.message : error,
        );
        throw error;
      }

      const delay = PrismaService.BASE_DELAY_MS * Math.pow(2, attempt - 1);
      this.logger.warn(
        `Database connection failed (attempt ${attempt}/${PrismaService.MAX_RETRIES}). Retrying in ${delay}ms...`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.connectWithRetry(attempt + 1);
    }
  }
}
