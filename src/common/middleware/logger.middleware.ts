import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const timestamp = new Date().toISOString();

    this.logger.log(`[INFO] ${method} ${originalUrl} - ${timestamp}`);

    res.on('finish', () => {
      const { statusCode } = res;
      this.logger.log(
        `[INFO] ${method} ${originalUrl} ${statusCode} - ${timestamp}`,
      );
    });

    next();
  }
}
