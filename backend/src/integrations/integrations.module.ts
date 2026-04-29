import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntegrationsController } from './integrations.controller';

@Module({
  imports: [ConfigModule],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}
