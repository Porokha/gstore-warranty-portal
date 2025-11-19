import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: this.configService.get('DB_TYPE') || 'mysql',
      host: this.configService.get('DB_HOST') || 'localhost',
      port: parseInt(this.configService.get('DB_PORT') || '3306', 10),
      username: this.configService.get('DB_USER') || 'root',
      password: this.configService.get('DB_PASSWORD') || '',
      database: this.configService.get('DB_NAME') || 'gstore_warranty',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../../database/migrations/*{.ts,.js}'],
      synchronize: this.configService.get('DB_SYNCHRONIZE') === 'true',
      logging: process.env.NODE_ENV === 'development',
      charset: 'utf8mb4',
    };
  }
}

