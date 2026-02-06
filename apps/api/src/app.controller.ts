import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Get()
  @Public()
  getRoot() {
    return {
      message: 'Ilona English Center API',
      version: '1.0',
      documentation: '/api/docs',
      status: 'running',
    };
  }
}


