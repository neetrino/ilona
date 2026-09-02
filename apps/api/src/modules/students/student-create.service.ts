import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto';
import {
  Prisma,
  UserRole,
  UserStatus,
  CrmLeadActivityType,
  CrmLeadStatus,
} from '@ilona/database';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import {
  FIXED_GROUP_MAX_STUDENTS,
  GROUP_CAPACITY_EXCEEDED_MESSAGE,
} from '../groups/group.constants';
import { computeAgeFromDob } from './student-crud.util';
import { GroupChatSyncService } from '../groups/group-chat-sync.service';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class StudentCreateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatSync: GroupChatSyncService,
    private readonly chatService: ChatService,
  ) {}

  private async ensureAdminDirectChat(studentUserId: string): Promise<void> {
    try {
      await this.chatService.ensureAdminDirectChat(studentUserId);
    } catch {
      // Ignore — chat list / student admin endpoint will retry lazily
    }
  }
  private async prepareStudentCreate(dto: CreateStudentDto, user?: JwtPayload) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const managerCenterId = getManagerCenterIdOrThrow(user);
    /** Managers cannot choose center via API; always use JWT `managerCenterId`. Admins use optional `dto.centerId`. */
    const resolvedStudentCenterId = managerCenterId
      ? managerCenterId
      : dto.centerId && String(dto.centerId).trim() !== ''
        ? String(dto.centerId).trim()
        : undefined;

    let resolvedTeacherId: string | undefined;

    if (dto.groupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: dto.groupId },
        include: { _count: { select: { students: true } } },
      });

      if (!group) {
        throw new BadRequestException(`Group with ID ${dto.groupId} not found`);
      }

      if (!group.isActive) {
        throw new BadRequestException('Cannot assign student to an inactive group');
      }

      if (managerCenterId && group.centerId !== managerCenterId) {
        throw new ForbiddenException('You can only create students inside your assigned center');
      }

      if (resolvedStudentCenterId && group.centerId !== resolvedStudentCenterId) {
        throw new BadRequestException('Selected group does not belong to the selected center');
      }

      if (group._count.students >= FIXED_GROUP_MAX_STUDENTS) {
        throw new BadRequestException(GROUP_CAPACITY_EXCEEDED_MESSAGE);
      }

      if (!group.teacherId) {
        throw new BadRequestException('Selected group has no primary teacher assigned');
      }

      if (dto.teacherId && dto.teacherId !== group.teacherId) {
        throw new BadRequestException(
          'Teacher must match the selected group\'s primary teacher',
        );
      }

      resolvedTeacherId = group.teacherId;
    } else if (dto.teacherId) {
      resolvedTeacherId = dto.teacherId;
    }

    if (resolvedTeacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: resolvedTeacherId },
        include: {
          groups: {
            select: {
              centerId: true,
            },
          },
        },
      });

      if (!teacher) {
        throw new BadRequestException(`Teacher with ID ${resolvedTeacherId} not found`);
      }

      if (managerCenterId) {
        const teacherInManagerCenter = teacher.groups.some((g) => g.centerId === managerCenterId);
        if (!teacherInManagerCenter) {
          throw new ForbiddenException('You can only assign teachers from your center');
        }
      }
    }

    const dobDate = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    const ageFromDob = dobDate ? computeAgeFromDob(dobDate) : undefined;
    const finalAge = ageFromDob ?? dto.age;
    if (finalAge === undefined) {
      throw new BadRequestException('Either age or dateOfBirth is required');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return {
      passwordHash,
      resolvedTeacherId,
      finalAge,
      dobDate,
      resolvedStudentCenterId,
    };
  }

  private async insertUserStudentAndRelationsInTx(
    tx: Prisma.TransactionClient,
    dto: CreateStudentDto,
    prep: {
      passwordHash: string;
      resolvedTeacherId: string | undefined;
      finalAge: number;
      dobDate: Date | null;
      resolvedStudentCenterId: string | undefined;
    },
    link?: { leadId?: string },
  ) {
    const { passwordHash, resolvedTeacherId, finalAge, dobDate, resolvedStudentCenterId } = prep;

    const createdUser = await tx.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });

    const initialCenterId = resolvedStudentCenterId;

    const studentCreateData: Prisma.StudentUncheckedCreateInput = {
      userId: createdUser.id,
      groupId: dto.groupId,
      teacherId: resolvedTeacherId,
      centerId: initialCenterId,
      parentName: dto.parentName,
      parentPhone: dto.parentPhone,
      parentEmail: dto.parentEmail,
      monthlyFee: dto.monthlyFee,
      notes: dto.notes,
      receiveReports: dto.receiveReports ?? true,
      dateOfBirth: dobDate ?? undefined,
      firstLessonDate: dto.firstLessonDate ? new Date(dto.firstLessonDate) : undefined,
      leadId: link?.leadId,
      registerDate: link?.leadId ? new Date() : undefined,
    };
    (studentCreateData as Record<string, unknown>).age = finalAge;

    const student = await tx.student.create({
      data: studentCreateData,
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
        group: { select: { id: true, name: true } },
      },
    });

    if (dto.groupId) {
      const now = new Date();
      await tx.$executeRaw`
        INSERT INTO "student_group_histories" ("id", "studentId", "groupId", "joinedAt", "createdAt", "updatedAt")
        VALUES (${randomUUID()}, ${student.id}, ${dto.groupId}, ${now}, ${now}, ${now})
      `;
    }

    if (dto.groupId) {
      await this.chatSync.ensureStudentInGroupChat(dto.groupId, createdUser.id, tx);
    }

    return student;
  }

  async create(dto: CreateStudentDto, user?: JwtPayload) {
    const prep = await this.prepareStudentCreate(dto, user);
    const student = await this.prisma.$transaction(async (tx) =>
      this.insertUserStudentAndRelationsInTx(tx, dto, prep),
    );
    await this.ensureAdminDirectChat(student.user.id);
    return student;
  }

  /**
   * CRM Paid registration: one transaction updates the lead to PAID and creates the student
   * using the same rules as {@link create}. Idempotent if the lead already has a student.
   */
  async createLinkedToCrmPaidLead(
    leadId: string,
    dto: CreateStudentDto,
    actorUserId: string,
    user?: JwtPayload,
  ) {
    const prep = await this.prepareStudentCreate(dto, user);

    if (!dto.groupId) {
      throw new BadRequestException('Group is required to complete CRM registration');
    }

    const group = await this.prisma.group.findUnique({
      where: { id: dto.groupId },
    });
    if (!group) {
      throw new BadRequestException(`Group with ID ${dto.groupId} not found`);
    }

    if (!group.isActive) {
      throw new BadRequestException('Invalid or inactive group');
    }

    const managerCenterId = getManagerCenterIdOrThrow(user);
    if (managerCenterId && group.centerId !== managerCenterId) {
      throw new ForbiddenException('You can only create students inside your assigned center');
    }

    let createdStudentUserId: string | null = null;

    await this.prisma.$transaction(async (tx) => {
      const lead = await tx.crmLead.findUnique({
        where: { id: leadId },
        include: { student: true },
      });
      if (!lead) {
        throw new NotFoundException('Lead not found');
      }
      if (lead.student) {
        return;
      }

      const fromStatus = lead.status;
      const levelFromGroup = group.level ?? undefined;

      await tx.crmLead.update({
        where: { id: leadId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone ?? null,
          age: prep.finalAge,
          dateOfBirth: prep.dobDate,
          firstLessonDate: dto.firstLessonDate ? new Date(dto.firstLessonDate) : null,
          parentName: dto.parentName ?? null,
          parentPhone: dto.parentPhone ?? null,
          parentEmail: dto.parentEmail ?? null,
          teacherId: prep.resolvedTeacherId ?? null,
          groupId: dto.groupId,
          centerId: group.centerId,
          levelId: levelFromGroup ?? lead.levelId,
          status: 'PAID',
          notes: dto.notes ?? null,
        },
      });

      if (fromStatus !== 'PAID') {
        await tx.crmLeadActivity.create({
          data: {
            leadId,
            actorUserId,
            type: CrmLeadActivityType.STATUS_CHANGE,
            payload: {
              fromStatus,
              toStatus: 'PAID' satisfies CrmLeadStatus,
              source: 'register_paid',
            } as Prisma.InputJsonValue,
          },
        });
      }

      const student = await this.insertUserStudentAndRelationsInTx(tx, dto, prep, { leadId });
      createdStudentUserId = student.user.id;
    });

    if (createdStudentUserId) {
      await this.ensureAdminDirectChat(createdStudentUserId);
    }
  }
}
