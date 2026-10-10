import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigService } from '../config/app-config.service.js';
import { entities } from './data-source.js';
import { SnakeNamingStrategy } from './snake-naming.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        type: 'postgres' as const,
        url: config.get('DATABASE_URL'),
        entities,
        namingStrategy: new SnakeNamingStrategy(),
        // Schema changes go through reviewed migrations only (npm run migration:run).
        synchronize: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
