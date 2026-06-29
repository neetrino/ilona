/**
 * Chat API — re-exports chat HTTP endpoints and types.
 */

export type {
  AdminChatAllUser,
  AdminChatGroup,
  AdminChatUser,
  AdminStudentRecording,
  AdminStudentRecordingsFilters,
  RecordingsDateFilters,
  StudentAdmin,
  TeacherAdmin,
  TeacherGroup,
  TeacherStudent,
  TeacherStudentRecordingsFilters,
  VoiceToTeacherRecording,
} from './chat-api/chat-api.types';

export {
  addCustomGroupChatMember,
  addGroupChatMember,
  createCustomGroupChat,
  fetchAdminAllUsers,
  fetchAdminGroups,
  fetchAdminStudentRecordings,
  fetchAdminStudents,
  fetchAdminTeachers,
} from './chat-api/chat-admin.api';

export {
  createDirectChat,
  fetchChat,
  fetchChats,
  fetchCustomGroupChats,
  fetchGroupChat,
  fetchMessages,
  markChatAsRead,
  sendMessageHttp,
} from './chat-api/chat-core.api';

export {
  fetchStudentAdmin,
  fetchStudentVoiceToTeacherRecordings,
} from './chat-api/chat-student.api';

export {
  fetchTeacherAdmin,
  fetchTeacherGroups,
  fetchTeacherStudentRecordings,
  fetchTeacherStudents,
} from './chat-api/chat-teacher.api';
