export { chatKeys } from './chat/chat-query-keys';

export {
  PENDING_MESSAGE_ID_PREFIX,
  isPendingMessageId,
  createOptimisticTextMessage,
  pushMessageToCache,
  upsertIncomingMessageInCache,
  removeMessageFromMessagesCache,
  applyChatReadReceiptInCache,
  clearChatUnreadInCache,
} from './chat/chat-cache.util';

export {
  useChats,
  useChatDetail,
  useMessages,
  useCustomGroupChats,
} from './chat/useChatQueries';

export {
  useCreateDirectChat,
  useAddGroupChatMember,
  useCreateCustomGroupChat,
  useAddCustomGroupChatMember,
  useDeleteCustomGroupChat,
} from './chat/useChatMutations';

export {
  useAddMessageToCache,
  useUpdateMessageInCache,
  useRemoveMessageFromCache,
  useUpdateChatUnreadCount,
} from './chat/useChatCacheHooks';

export {
  useAdminStudents,
  useAdminTeachers,
  useAdminGroups,
  useAdminAllUsers,
} from './chat/useAdminChatQueries';

export {
  useTeacherGroups,
  useTeacherStudents,
  useTeacherAdmin,
} from './chat/useTeacherChatQueries';

export { useStudentAdmin } from './chat/useStudentChatQueries';

export {
  useAdminUnreadCounts,
  useTeacherUnreadCounts,
  useStudentUnreadCounts,
} from './chat/useChatUnreadCounts';
