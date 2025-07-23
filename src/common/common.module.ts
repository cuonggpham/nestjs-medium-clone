import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { CustomValidationPipe } from './pipes/custom-validation.pipe';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';

@Module({
  providers: [
    JwtAuthGuard,
    LoggerMiddleware,
    CustomValidationPipe,
    AllExceptionsFilter,
    ResponseInterceptor,
  ],
  exports: [
    JwtAuthGuard,
    LoggerMiddleware,
    CustomValidationPipe,
    AllExceptionsFilter,
    ResponseInterceptor,
  ],
})
export class CommonModule {}
