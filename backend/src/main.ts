import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as crypto from 'crypto';
import { join } from 'path';

// Polyfill for crypto.randomUUID if not available (for NestJS schedule)
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = crypto;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS
  const allowedOrigins = Array.from(
    new Set(
      [
        process.env.FRONTEND_URL,
        process.env.PORTAL_URL,
        'http://localhost',
        'http://localhost:3001',
        'http://3.68.134.145',
        'http://3.68.134.145:3001',
        'http://zezva.ge',
        'https://zezva.ge',
        'https://zezva.ge:3001',
        'http://www.zezva.ge',
        'https://www.zezva.ge',
        'https://www.zezva.ge:3001',
      ].filter(Boolean),
    ),
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        if (process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('ZEZVA Warranty Portal API')
    .setDescription('API documentation for ZEZVA Warranty & Service Management Portal')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend API running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
