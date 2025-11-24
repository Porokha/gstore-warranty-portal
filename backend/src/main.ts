import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import * as crypto from 'crypto';

// Polyfill for crypto.randomUUID if not available (for NestJS schedule)
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = crypto;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // Enable CORS
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3001',
    'http://3.68.134.145:3001',
    process.env.PORTAL_URL || 'http://localhost:3001',
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('CORS: Allowing request with no origin');
        return callback(null, true);
      }
      
      console.log(`CORS: Checking origin: ${origin}`);
      console.log(`CORS: Allowed origins:`, allowedOrigins);
      
      if (allowedOrigins.includes(origin)) {
        console.log(`CORS: Origin allowed: ${origin}`);
        callback(null, true);
      } else {
        // For development, allow all origins
        if (process.env.NODE_ENV === 'development') {
          console.log(`CORS: Development mode - allowing origin: ${origin}`);
          callback(null, true);
        } else {
          console.log(`CORS: Origin NOT allowed: ${origin}`);
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

  // Log all incoming requests for debugging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
      origin: req.headers.origin,
      hasAuth: !!req.headers.authorization,
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent']?.substring(0, 50),
    });
    next();
  });

  // API prefix
  app.setGlobalPrefix('api');

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

