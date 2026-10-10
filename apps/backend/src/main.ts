import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp, configureRuntime } from './app.setup.js';
import { AppConfigService } from './config/app-config.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  configureRuntime(app);
  app.enableShutdownHooks();
  await app.listen(app.get(AppConfigService).get('PORT'));
}
await bootstrap();
