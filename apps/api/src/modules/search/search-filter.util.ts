import type { Prisma } from '@ilona/database';

export const PER_TYPE = 8;
export const DEFAULT_MAX = 28;

export function userSearchOrSingleToken(token: string): Prisma.UserWhereInput['OR'] {
  return [
    { firstName: { contains: token, mode: 'insensitive' } },
    { lastName: { contains: token, mode: 'insensitive' } },
    { email: { contains: token, mode: 'insensitive' } },
    { phone: { contains: token, mode: 'insensitive' } },
  ];
}

export function userWhereMatchesTokens(tokens: string[]): Prisma.UserWhereInput {
  if (tokens.length === 1) {
    return { OR: userSearchOrSingleToken(tokens[0]) };
  }
  return { AND: tokens.map((token) => ({ OR: userSearchOrSingleToken(token) })) };
}

export function studentTextOneToken(token: string): Prisma.StudentWhereInput {
  return {
    OR: [
      { user: { OR: userSearchOrSingleToken(token) } },
      { parentPhone: { contains: token, mode: 'insensitive' } },
      { parentEmail: { contains: token, mode: 'insensitive' } },
      { parentName: { contains: token, mode: 'insensitive' } },
    ],
  };
}

export function studentTextMatchTokens(tokens: string[]): Prisma.StudentWhereInput {
  if (tokens.length === 1) {
    return studentTextOneToken(tokens[0]);
  }
  return { AND: tokens.map((t) => studentTextOneToken(t)) };
}

export function groupNameOrDescriptionMatchTokens(tokens: string[]): Prisma.GroupWhereInput {
  const perToken = (token: string): Prisma.GroupWhereInput => ({
    OR: [
      { name: { contains: token, mode: 'insensitive' } },
      { description: { contains: token, mode: 'insensitive' } },
    ],
  });
  if (tokens.length === 1) {
    return perToken(tokens[0]);
  }
  return { AND: tokens.map(perToken) };
}

export function crmLeadFieldsMatchTokens(tokens: string[]): Prisma.CrmLeadWhereInput {
  const perToken = (token: string): Prisma.CrmLeadWhereInput => ({
    OR: [
      { firstName: { contains: token, mode: 'insensitive' } },
      { lastName: { contains: token, mode: 'insensitive' } },
      { phone: { contains: token, mode: 'insensitive' } },
      { parentPhone: { contains: token, mode: 'insensitive' } },
      { parentName: { contains: token, mode: 'insensitive' } },
      { notes: { contains: token, mode: 'insensitive' } },
      { comment: { contains: token, mode: 'insensitive' } },
    ],
  });
  if (tokens.length === 1) {
    return perToken(tokens[0]);
  }
  return { AND: tokens.map(perToken) };
}

export function lessonSearchMatchTokens(tokens: string[]): Prisma.LessonWhereInput {
  const perToken = (token: string): Prisma.LessonWhereInput => ({
    OR: [
      { topic: { contains: token, mode: 'insensitive' } },
      { description: { contains: token, mode: 'insensitive' } },
      { notes: { contains: token, mode: 'insensitive' } },
      { group: { name: { contains: token, mode: 'insensitive' } } },
      { teacher: { user: { OR: userSearchOrSingleToken(token) } } },
    ],
  });
  if (tokens.length === 1) {
    return perToken(tokens[0]);
  }
  return { AND: tokens.map(perToken) };
}

export function paymentSearchClause(normalizedPhrase: string, tokens: string[]): Prisma.PaymentWhereInput {
  return {
    OR: [
      { notes: { contains: normalizedPhrase, mode: 'insensitive' } },
      { transactionId: { contains: normalizedPhrase, mode: 'insensitive' } },
      { paymentMethod: { contains: normalizedPhrase, mode: 'insensitive' } },
      { student: studentTextMatchTokens(tokens) },
    ],
  };
}

export function recordingSearchClause(normalizedPhrase: string, tokens: string[]): Prisma.RecordingItemWhereInput {
  const fileOrGroupPerToken = (token: string): Prisma.RecordingItemWhereInput => ({
    OR: [
      { fileName: { contains: token, mode: 'insensitive' } },
      { group: { name: { contains: token, mode: 'insensitive' } } },
    ],
  });
  const multiTokenFileOrGroup: Prisma.RecordingItemWhereInput | null =
    tokens.length > 1 ? { AND: tokens.map(fileOrGroupPerToken) } : null;
  return {
    OR: [
      { fileName: { contains: normalizedPhrase, mode: 'insensitive' } },
      { group: { name: { contains: normalizedPhrase, mode: 'insensitive' } } },
      ...(multiTokenFileOrGroup ? [multiTokenFileOrGroup] : []),
      { student: studentTextMatchTokens(tokens) },
    ],
  };
}

export function teacherPipelineLeadMatchTokens(tokens: string[]): Prisma.CrmLeadWhereInput {
  const perToken = (token: string): Prisma.CrmLeadWhereInput => ({
    OR: [
      { firstName: { contains: token, mode: 'insensitive' } },
      { lastName: { contains: token, mode: 'insensitive' } },
      { phone: { contains: token, mode: 'insensitive' } },
      { parentPhone: { contains: token, mode: 'insensitive' } },
    ],
  });
  if (tokens.length === 1) {
    return perToken(tokens[0]);
  }
  return { AND: tokens.map(perToken) };
}

export function lessonTopicNotesMatchTokens(tokens: string[]): Prisma.LessonWhereInput {
  const perToken = (token: string): Prisma.LessonWhereInput => ({
    OR: [
      { topic: { contains: token, mode: 'insensitive' } },
      { description: { contains: token, mode: 'insensitive' } },
      { notes: { contains: token, mode: 'insensitive' } },
    ],
  });
  if (tokens.length === 1) {
    return perToken(tokens[0]);
  }
  return { AND: tokens.map(perToken) };
}

export function studentPortalPaymentMatch(normalizedPhrase: string, tokens: string[]): Prisma.PaymentWhereInput {
  const perToken = (token: string): Prisma.PaymentWhereInput => ({
    OR: [
      { notes: { contains: token, mode: 'insensitive' } },
      { transactionId: { contains: token, mode: 'insensitive' } },
      { paymentMethod: { contains: token, mode: 'insensitive' } },
    ],
  });
  return {
    OR: [
      { notes: { contains: normalizedPhrase, mode: 'insensitive' } },
      { transactionId: { contains: normalizedPhrase, mode: 'insensitive' } },
      { paymentMethod: { contains: normalizedPhrase, mode: 'insensitive' } },
      ...(tokens.length > 1 ? [{ AND: tokens.map(perToken) }] : []),
    ],
  };
}

export function studentPortalRecordingMatch(normalizedPhrase: string, tokens: string[]): Prisma.RecordingItemWhereInput {
  const perToken = (token: string): Prisma.RecordingItemWhereInput => ({
    OR: [
      { fileName: { contains: token, mode: 'insensitive' } },
      { group: { name: { contains: token, mode: 'insensitive' } } },
    ],
  });
  return {
    OR: [
      { fileName: { contains: normalizedPhrase, mode: 'insensitive' } },
      { group: { name: { contains: normalizedPhrase, mode: 'insensitive' } } },
      ...(tokens.length > 1 ? [{ AND: tokens.map(perToken) }] : []),
    ],
  };
}
