import 'reflect-metadata';
import * as path from 'path';
import * as tsconfigPaths from 'tsconfig-paths';

// Register path aliases for Vercel Serverless Function runtime
tsconfigPaths.register({
  baseUrl: path.resolve(__dirname, '..'),
  paths: {
    '@/*': ['src/*'],
  },
});

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express from 'express';
import cookieParser = require('cookie-parser');

let cachedApp: any;

async function bootstrapServerless() {
  if (!cachedApp) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    app.use(cookieParser());
    app.enableCors({
      origin: true,
      credentials: true,
    });
    app.setGlobalPrefix('api');
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

    await app.init();
    cachedApp = expressApp;
  }
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  // Rewrite root URL '/' or '/favicon.ico' to '/api' so root requests return 200 OK health status
  if (req.url === '/' || req.url === '' || req.url === '/favicon.ico') {
    req.url = '/api';
  }
  const app = await bootstrapServerless();
  return app(req, res);
}
