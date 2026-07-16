import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStudentDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { StudentManagerAccessService } from './student-manager-access.service';
import { StudentReadService } from './student-read.service';
import { computeAgeFromDob } from './student-crud.util';
import { syncStudentGroupHistory } from './student-group-history.util';
import { GroupChatSyncService } from '../groups/group-chat-sync.service';

@Injectable()
export class StudentUpdateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly managerAccess: StudentManagerAccessService,
    private readonly readService: StudentReadService,
    private readonly chatSync: GroupChatSyncService,
  ) {}
  async update(id: string, dto: UpdateStudentDto, user?: JwtPayload) {
    await this.managerAccess.assertManagerStudentAccess(id, user?.sub, user?.role);
    const student = await this.readService.findById(id, user?.sub, user?.role);
    const managerCenterId = getManagerCenterIdOrThrow(user);

    if (dto.teacherId !== undefined && dto.groupId === undefined) {
      throw new BadRequestException('Teacher cannot be set directly; select a group instead');
    }
    
    // Update user fields if provided
    if (dto.firstName || dto.lastName || dto.phone || dto.status) {
      await this.prisma.user.update({
        where: { id: student.user.id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          status: dto.status,
        },
      });
    }

    // Update student fields. When dateOfBirth is supplied we recompute age so
    // the two values do not drift; passing null clears the DOB.
    const dobInput = dto.dateOfBirth;
    const newDob: Date | null | undefined =
      dobInput === undefined ? undefined : dobInput === null ? null : new Date(dobInput);
    const ageFromDob = newDob ? computeAgeFromDob(newDob) : undefined;

    const updateData: {
      age?: number;
      parentName?: string;
      parentPhone?: string;
      parentEmail?: string;
      parentPassportInfo?: string;
      monthlyFee?: number;
      notes?: string;
      receiveReports?: boolean;
      groupId?: string | null;
      teacherId?: string | null;
      centerId?: string | null;
      registerDate?: Date | null;
      dateOfBirth?: Date | null;
      firstLessonDate?: Date | null;
    } = {
      age: ageFromDob ?? dto.age,
      parentName: dto.parentName,
      parentPhone: dto.parentPhone,
      parentEmail: dto.parentEmail,
      parentPassportInfo: dto.parentPassportInfo,
      monthlyFee: dto.monthlyFee,
      notes: dto.notes,
      receiveReports: dto.receiveReports,
    };

    if (newDob !== undefined) {
      updateData.dateOfBirth = newDob;
    }
    if (dto.firstLessonDate !== undefined) {
      updateData.firstLessonDate = dto.firstLessonDate ? new Date(dto.firstLessonDate) : null;
    }

    if (dto.centerId !== undefined) {
      const raw = dto.centerId;
      updateData.centerId = raw && String(raw).trim() !== '' ? String(raw).trim() : null;
      if (managerCenterId && updateData.centerId && updateData.centerId !== managerCenterId) {
        throw new ForbiddenException('You can only assign students to your assigned center');
      }
    }

    // When groupId is set, sync teacherId from the group so Teacher → My Students shows the student immediately
    if (dto.groupId !== undefined) {
      const newGroupId = dto.groupId?.trim() || null;
      updateData.groupId = newGroupId;
      if (newGroupId) {
        const group = await this.prisma.group.findUnique({
          where: { id: newGroupId },
          select: { teacherId: true, centerId: true },
        });
        if (!group) {
          throw new BadRequestException(`Group with ID ${newGroupId} not found`);
        }
        if (managerCenterId && group.centerId !== managerCenterId) {
          throw new ForbiddenException('You can only move students to groups in your center');
        }
        const effectiveCenterId =
          updateData.centerId !== undefined ? updateData.centerId : student.centerId;
        if (effectiveCenterId && group.centerId !== effectiveCenterId) {
          throw new BadRequestException('Selected group does not belong to the selected center');
        }
        if (!group.teacherId) {
          throw new BadRequestException('Selected group has no primary teacher assigned');
        }
        updateData.teacherId = group.teacherId;
      } else {
        updateData.teacherId = null;
      }
    }
    if (dto.registerDate !== undefined) {
      updateData.registerDate = dto.registerDate
        ? new Date(dto.registerDate)
        : null;
    }

    const previousGroupId = student.groupId ?? null;
    const joinedAtForNewGroup = dto.registerDate ? new Date(dto.registerDate) : new Date();

    const updatedStudent = await this.prisma.$transaction(async (tx) => {
      const next = await tx.student.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              status: true,
            },
          },
          group: { 
            select: { 
              id: true, 
              name: true,
              level: true,
              center: { select: { id: true, name: true } },
            } 
          },
          center: { select: { id: true, name: true } },
          teacher: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      await syncStudentGroupHistory(
        tx,
        id,
        previousGroupId,
        next.groupId ?? null,
        joinedAtForNewGroup,
      );

      return next;
    });

    // Keep group chat membership in sync so the chat appears in the student's list immediately.
    if (dto.groupId !== undefined) {
      const nextGroupId = updatedStudent.groupId ?? null;
      if (previousGroupId && previousGroupId !== nextGroupId) {
        await this.chatSync.removeStudentFromGroupChat(previousGroupId, student.user.id);
      }
      if (nextGroupId && nextGroupId !== previousGroupId) {
        await this.chatSync.ensureStudentInGroupChat(nextGroupId, student.user.id);
      }
    }

    return updatedStudent;
  }
}
