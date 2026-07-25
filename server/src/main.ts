import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security Middlewares
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());

  // CORS configuration
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global Prefix
  app.setGlobalPrefix('api');

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('OurSpace API Documentation 💕')
    .setDescription('Tài liệu API Backend NestJS cho ứng dụng OurSpace')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`🚀 OurSpace NestJS Backend Server running on http://localhost:${port}/api`);
  logger.log(`📖 Swagger API Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
