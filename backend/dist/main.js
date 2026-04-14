"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const crypto = require("crypto");
if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = crypto;
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const allowedOrigins = Array.from(new Set([
        process.env.FRONTEND_URL,
        process.env.PORTAL_URL,
        'http://localhost',
        'http://localhost:3001',
        'http://3.68.134.145',
        'http://3.68.134.145:3001',
        'http://zezva.ge',
        'https://zezva.ge',
        'http://www.zezva.ge',
        'https://www.zezva.ge',
    ].filter(Boolean)));
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                if (process.env.NODE_ENV === 'development') {
                    callback(null, true);
                }
                else {
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