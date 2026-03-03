import { Global, Module } from '@nestjs/common';
import { RequestContextService } from './request-context.service';
import { ServerActivityService } from '../server-activity/server-activity.service';

@Global()
@Module({
  providers: [RequestContextService, ServerActivityService],
  exports: [RequestContextService, ServerActivityService],
})
export class RequestContextModule {}
