import { ValidationPipe as BaseValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export class CustomValidationPipe extends BaseValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errors = this.formatValidationErrors(validationErrors);
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors,
        });
      },
    });
  }

  private formatValidationErrors(
    validationErrors: ValidationError[],
  ): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    validationErrors.forEach((error) => {
      if (error.constraints) {
        errors[error.property] = Object.values(error.constraints);
      }

      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatValidationErrors(error.children);
        Object.keys(nestedErrors).forEach((key) => {
          errors[`${error.property}.${key}`] = nestedErrors[key];
        });
      }
    });

    return errors;
  }
}
