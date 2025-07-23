import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { INestApplication } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', () => {
      void app.close().then(() => this.$disconnect());
    });
    process.on('SIGTERM', () => {
      void app.close().then(() => this.$disconnect());
    });
    process.on('SIGINT', () => {
      void app.close().then(() => this.$disconnect());
    });
  }
}
