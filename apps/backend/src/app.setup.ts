import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfigService } from './config/app-config.service.js';

/** Shared by main.ts, the OpenAPI generator and e2e tests so they configure the app identically. */
export function configureApp(app: INestApplication): void {
  app.useSecurityHeaders();
  app.setGlobalPrefix('api', { exclude: ['health', 'ready'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
}

export function buildOpenApiDocument(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle('Safe Zone Monitor API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, options);
}

export function configureRuntime(app: INestApplication): void {
  const config = app.get(AppConfigService);
  const origins = config.get('CORS_ORIGINS');
  if (origins.length > 0) app.enableCors({ origin: origins });
  SwaggerModule.setup('api/docs', app, buildOpenApiDocument(app));
}
