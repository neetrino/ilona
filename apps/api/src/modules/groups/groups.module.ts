import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupAccessService } from './group-access.service';
import { GroupTeacherValidationService } from './group-teacher-validation.service';
import { GroupChatSyncService } from './group-chat-sync.service';
import { GroupQueryService } from './group-query.service';
import { GroupWriteService } from './group-write.service';
import { GroupMembershipService } from './group-membership.service';
import { ChatModule } from '../chat/chat.module';
import { LessonsModule } from '../lessons/lessons.module';

@Module({
  imports: [ChatModule, LessonsModule],
  controllers: [GroupsController],
  providers: [
    GroupsService,
    GroupAccessService,
    GroupTeacherValidationService,
    GroupChatSyncService,
    GroupQueryService,
    GroupWriteService,
    GroupMembershipService,
  ],
  exports: [GroupsService, GroupChatSyncService],
})
export class GroupsModule {}
