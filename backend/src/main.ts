/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { env } from './config/env';

async function startApp() {
  // Use NestExpressApplication for Express-specific configuration
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', env.TRUST_PROXY);

  const securityHeaders = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
    strictTransportSecurity:
      env.NODE_ENV === 'production'
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: false,
          }
        : false,
  });

  app.use((request, response, next) => {
    if (request.path.startsWith('/api/docs')) {
      next();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    securityHeaders(request, response, next);
  });

  app.enableCors({
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Calendar API')
      .setDescription(
        'Calendar scheduling API. Protected endpoints require a bearer access token.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Authorization: Bearer <access-token>',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Calendar API Docs',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(process.env.PORT || 3001);
  console.info(`Backend is running on port ${process.env.PORT || 3001}`);
}
//startApp()
//Start NestJS app and handle any startup errors explicitly - ignoring ESLint warning
startApp().catch((err) => {
  console.error('Failed to start app:', err);
});
