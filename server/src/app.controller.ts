import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getHealthRoot() {
    return {
      status: 'ok',
      message: 'OurSpace NestJS API Server is running online 💕',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health')
  getHealthEndpoint() {
    return {
      status: 'ok',
      message: 'OurSpace NestJS API Server is running online 💕',
      timestamp: new Date().toISOString(),
    };
  }
}
