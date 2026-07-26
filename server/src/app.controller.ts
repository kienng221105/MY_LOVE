import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getHealth() {
    return {
      status: 'ok',
      message: 'OurSpace NestJS API Server is running online 💕',
      timestamp: new Date().toISOString(),
    };
  }
}
