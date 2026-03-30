
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  passwordHash: 'passwordHash',
  firstName: 'firstName',
  lastName: 'lastName',
  phone: 'phone',
  avatarUrl: 'avatarUrl',
  role: 'role',
  status: 'status',
  lastLoginAt: 'lastLoginAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CenterScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address: 'address',
  phone: 'phone',
  email: 'email',
  description: 'description',
  colorHex: 'colorHex',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ManagerProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  centerId: 'centerId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GroupScalarFieldEnum = {
  id: 'id',
  name: 'name',
  level: 'level',
  description: 'description',
  maxStudents: 'maxStudents',
  centerId: 'centerId',
  teacherId: 'teacherId',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TeacherScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  bio: 'bio',
  specialization: 'specialization',
  hourlyRate: 'hourlyRate',
  lessonRateAMD: 'lessonRateAMD',
  workingDays: 'workingDays',
  workingHours: 'workingHours',
  hireDate: 'hireDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StudentScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  groupId: 'groupId',
  teacherId: 'teacherId',
  parentName: 'parentName',
  parentPhone: 'parentPhone',
  parentEmail: 'parentEmail',
  monthlyFee: 'monthlyFee',
  enrolledAt: 'enrolledAt',
  registerDate: 'registerDate',
  notes: 'notes',
  receiveReports: 'receiveReports',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  leadId: 'leadId'
};

exports.Prisma.LessonScalarFieldEnum = {
  id: 'id',
  groupId: 'groupId',
  teacherId: 'teacherId',
  scheduledAt: 'scheduledAt',
  duration: 'duration',
  topic: 'topic',
  description: 'description',
  status: 'status',
  vocabularySent: 'vocabularySent',
  vocabularySentAt: 'vocabularySentAt',
  feedbacksCompleted: 'feedbacksCompleted',
  absenceMarked: 'absenceMarked',
  absenceMarkedAt: 'absenceMarkedAt',
  voiceSent: 'voiceSent',
  voiceSentAt: 'voiceSentAt',
  textSent: 'textSent',
  textSentAt: 'textSentAt',
  completedAt: 'completedAt',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttendanceScalarFieldEnum = {
  id: 'id',
  lessonId: 'lessonId',
  studentId: 'studentId',
  markedById: 'markedById',
  isPresent: 'isPresent',
  absenceType: 'absenceType',
  note: 'note',
  markedAt: 'markedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FeedbackScalarFieldEnum = {
  id: 'id',
  lessonId: 'lessonId',
  studentId: 'studentId',
  teacherId: 'teacherId',
  content: 'content',
  rating: 'rating',
  strengths: 'strengths',
  improvements: 'improvements',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  amount: 'amount',
  month: 'month',
  dueDate: 'dueDate',
  status: 'status',
  paidAt: 'paidAt',
  paymentMethod: 'paymentMethod',
  transactionId: 'transactionId',
  receiptUrl: 'receiptUrl',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SalaryRecordScalarFieldEnum = {
  id: 'id',
  teacherId: 'teacherId',
  month: 'month',
  lessonsCount: 'lessonsCount',
  grossAmount: 'grossAmount',
  totalDeductions: 'totalDeductions',
  netAmount: 'netAmount',
  status: 'status',
  paidAt: 'paidAt',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DeductionScalarFieldEnum = {
  id: 'id',
  teacherId: 'teacherId',
  lessonId: 'lessonId',
  reason: 'reason',
  amount: 'amount',
  percentage: 'percentage',
  note: 'note',
  appliedAt: 'appliedAt',
  createdAt: 'createdAt'
};

exports.Prisma.ChatScalarFieldEnum = {
  id: 'id',
  type: 'type',
  name: 'name',
  groupId: 'groupId',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChatParticipantScalarFieldEnum = {
  id: 'id',
  chatId: 'chatId',
  userId: 'userId',
  isAdmin: 'isAdmin',
  joinedAt: 'joinedAt',
  leftAt: 'leftAt',
  lastReadAt: 'lastReadAt'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  chatId: 'chatId',
  senderId: 'senderId',
  type: 'type',
  content: 'content',
  fileUrl: 'fileUrl',
  fileName: 'fileName',
  fileSize: 'fileSize',
  duration: 'duration',
  metadata: 'metadata',
  isSystem: 'isSystem',
  isEdited: 'isEdited',
  editedAt: 'editedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  title: 'title',
  content: 'content',
  data: 'data',
  isRead: 'isRead',
  readAt: 'readAt',
  createdAt: 'createdAt'
};

exports.Prisma.SystemSettingsScalarFieldEnum = {
  id: 'id',
  vocabDeductionPercent: 'vocabDeductionPercent',
  feedbackDeductionPercent: 'feedbackDeductionPercent',
  maxUnjustifiedAbsences: 'maxUnjustifiedAbsences',
  paymentDueDays: 'paymentDueDays',
  lessonReminderHours: 'lessonReminderHours',
  logoUrl: 'logoUrl',
  absencePercent: 'absencePercent',
  feedbacksPercent: 'feedbacksPercent',
  voicePercent: 'voicePercent',
  textPercent: 'textPercent',
  penaltyAbsenceAmd: 'penaltyAbsenceAmd',
  penaltyFeedbackAmd: 'penaltyFeedbackAmd',
  penaltyVoiceAmd: 'penaltyVoiceAmd',
  penaltyTextAmd: 'penaltyTextAmd',
  updatedAt: 'updatedAt'
};

exports.Prisma.CrmLeadScalarFieldEnum = {
  id: 'id',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdByUserId: 'createdByUserId',
  assignedManagerId: 'assignedManagerId',
  firstName: 'firstName',
  lastName: 'lastName',
  phone: 'phone',
  age: 'age',
  levelId: 'levelId',
  teacherId: 'teacherId',
  groupId: 'groupId',
  centerId: 'centerId',
  transferFlag: 'transferFlag',
  transferComment: 'transferComment',
  archivedReason: 'archivedReason',
  source: 'source',
  notes: 'notes',
  teacherApprovedAt: 'teacherApprovedAt'
};

exports.Prisma.CrmLeadActivityScalarFieldEnum = {
  id: 'id',
  leadId: 'leadId',
  actorUserId: 'actorUserId',
  type: 'type',
  payload: 'payload',
  createdAt: 'createdAt'
};

exports.Prisma.CrmLeadAttachmentScalarFieldEnum = {
  id: 'id',
  leadId: 'leadId',
  type: 'type',
  r2Key: 'r2Key',
  mimeType: 'mimeType',
  size: 'size',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  entity: 'entity',
  entityId: 'entityId',
  oldData: 'oldData',
  newData: 'newData',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT'
};

exports.UserStatus = exports.$Enums.UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED'
};

exports.LessonStatus = exports.$Enums.LessonStatus = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  MISSED: 'MISSED',
  REPLACED: 'REPLACED'
};

exports.AbsenceType = exports.$Enums.AbsenceType = {
  JUSTIFIED: 'JUSTIFIED',
  UNJUSTIFIED: 'UNJUSTIFIED'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
};

exports.SalaryStatus = exports.$Enums.SalaryStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID'
};

exports.DeductionReason = exports.$Enums.DeductionReason = {
  MISSING_FEEDBACK: 'MISSING_FEEDBACK',
  MISSING_VOCABULARY: 'MISSING_VOCABULARY',
  LATE_SUBMISSION: 'LATE_SUBMISSION',
  OTHER: 'OTHER'
};

exports.ChatType = exports.$Enums.ChatType = {
  GROUP: 'GROUP',
  DIRECT: 'DIRECT'
};

exports.MessageType = exports.$Enums.MessageType = {
  TEXT: 'TEXT',
  VOICE: 'VOICE',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  FILE: 'FILE',
  SYSTEM: 'SYSTEM',
  VOCABULARY: 'VOCABULARY'
};

exports.CrmLeadStatus = exports.$Enums.CrmLeadStatus = {
  NEW: 'NEW',
  FIRST_LESSON: 'FIRST_LESSON',
  PAID: 'PAID',
  WAITLIST: 'WAITLIST',
  ARCHIVE: 'ARCHIVE'
};

exports.CrmLeadActivityType = exports.$Enums.CrmLeadActivityType = {
  STATUS_CHANGE: 'STATUS_CHANGE',
  COMMENT: 'COMMENT',
  RECORDING_UPLOADED: 'RECORDING_UPLOADED',
  TEACHER_APPROVED: 'TEACHER_APPROVED',
  TEACHER_TRANSFER: 'TEACHER_TRANSFER',
  FIELD_UPDATE: 'FIELD_UPDATE'
};

exports.CrmLeadAttachmentType = exports.$Enums.CrmLeadAttachmentType = {
  VOICE_RECORDING: 'VOICE_RECORDING',
  FILE: 'FILE'
};

exports.Prisma.ModelName = {
  User: 'User',
  Center: 'Center',
  ManagerProfile: 'ManagerProfile',
  Group: 'Group',
  Teacher: 'Teacher',
  Student: 'Student',
  Lesson: 'Lesson',
  Attendance: 'Attendance',
  Feedback: 'Feedback',
  Payment: 'Payment',
  SalaryRecord: 'SalaryRecord',
  Deduction: 'Deduction',
  Chat: 'Chat',
  ChatParticipant: 'ChatParticipant',
  Message: 'Message',
  Notification: 'Notification',
  SystemSettings: 'SystemSettings',
  CrmLead: 'CrmLead',
  CrmLeadActivity: 'CrmLeadActivity',
  CrmLeadAttachment: 'CrmLeadAttachment',
  AuditLog: 'AuditLog'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
