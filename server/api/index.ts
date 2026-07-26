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
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: '*',
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
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
  // Normalize root URL or favicon to /api so root health check responds with 200 OK
  if (!req.url || req.url === '/' || req.url === '/favicon.ico' || req.url === '/favicon.png') {
    req.url = '/api';
  }
  const app = await bootstrapServerless();
  return app(req, res);
}
