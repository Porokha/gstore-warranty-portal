"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const crypto = require("crypto");
if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = crypto;
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'uploads'), {
        prefix: '/uploads',
    });
    const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3001',
        'http://localhost:3001',
        'http://3.68.134.145:3001',
        process.env.PORTAL_URL || 'http://localhost:3001',
    ].filter(Boolean);
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                console.log('CORS: Allowing request with no origin');
                return callback(null, true);
            }
            console.log(`CORS: Checking origin: ${origin}`);
            console.log(`CORS: Allowed origins:`, allowedOrigins);
            if (allowedOrigins.includes(origin)) {
                console.log(`CORS: Origin allowed: ${origin}`);
                callback(null, true);
            }
            else {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`CORS: Development mode - allowing origin: ${origin}`);
                    callback(null, true);
                }
                else {
                    console.log(`CORS: Origin NOT allowed: ${origin}`);
                    callback(new Error('Not allowed by CORS'));
                }
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.use((req, res, next) => {
        if (req.path.startsWith('/api/settings') || req.path.startsWith('/api/woocommerce')) {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
                hasAuth: !!req.headers.authorization,
                contentType: req.headers['content-type'],
            });
        }
        next();
    });
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('ZEZVA Warranty Portal API')
        .setDescription('API documentation for ZEZVA Warranty & Service Management Portal')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Backend API running on http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map