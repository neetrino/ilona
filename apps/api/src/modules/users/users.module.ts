import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserReadService } from './user-read.service';
import { UserManagerService } from './user-manager.service';
import { UserWriteService } from './user-write.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UserReadService,
    UserManagerService,
    UserWriteService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
