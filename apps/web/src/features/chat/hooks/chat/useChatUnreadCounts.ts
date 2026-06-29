'use client';

import React from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChats } from './useChatQueries';
import { useTeacherGroups, useTeacherStudents, useTeacherAdmin } from './useTeacherChatQueries';
import { useStudentAdmin } from './useStudentChatQueries';

export function useAdminUnreadCounts() {
  const { user } = useAuthStore();
  const { data: chats = [], isLoading } = useChats();

  const counts = React.useMemo(() => {
    if (!user || !chats.length) {
      return {
        groups: 0,
        teachers: 0,
        students: 0,
      };
    }

    let groupsUnread = 0;
    let teachersUnread = 0;
    let studentsUnread = 0;

    chats.forEach((chat) => {
      const unreadCount = chat.unreadCount || 0;
      if (unreadCount === 0) return;

      if (chat.type === 'GROUP') {
        groupsUnread += unreadCount;
      } else if (chat.type === 'DIRECT') {
        const otherParticipant = chat.participants.find(
          (p) => p.userId !== user.id,
        );

        if (otherParticipant?.user?.role === 'TEACHER') {
          teachersUnread += unreadCount;
        } else if (otherParticipant?.user?.role === 'STUDENT') {
          studentsUnread += unreadCount;
        }
      }
    });

    return {
      groups: groupsUnread,
      teachers: teachersUnread,
      students: studentsUnread,
    };
  }, [chats, user]);

  return {
    counts,
    isLoading,
  };
}

export function useTeacherUnreadCounts() {
  const { data: groups = [], isLoading: isLoadingGroups } = useTeacherGroups();
  const { data: students = [], isLoading: isLoadingStudents } = useTeacherStudents();
  const { data: admin, isLoading: isLoadingAdmin } = useTeacherAdmin();

  const counts = React.useMemo(() => {
    const groupsUnread = groups.reduce((sum, group) => sum + (group.unreadCount || 0), 0);
    const studentsUnread = students.reduce((sum, student) => sum + (student.unreadCount || 0), 0);
    const adminUnread = admin?.unreadCount || 0;

    return {
      groups: groupsUnread,
      students: studentsUnread,
      admin: adminUnread,
    };
  }, [groups, students, admin]);

  return {
    counts,
    isLoading: isLoadingGroups || isLoadingStudents || isLoadingAdmin,
  };
}

export function useStudentUnreadCounts() {
  const { user } = useAuthStore();
  const { data: chats = [], isLoading: isLoadingChats } = useChats();
  const { data: admin, isLoading: isLoadingAdmin } = useStudentAdmin();

  const counts = React.useMemo(() => {
    if (!user) {
      return {
        chats: 0,
        teachers: 0,
        admin: 0,
      };
    }

    let chatsUnread = 0;
    let teachersUnread = 0;

    chats.forEach((chat) => {
      const unreadCount = chat.unreadCount || 0;
      if (unreadCount === 0) return;

      if (chat.type === 'GROUP') {
        chatsUnread += unreadCount;
      } else if (chat.type === 'DIRECT') {
        const otherParticipant = chat.participants.find(
          (p) => p.userId !== user.id,
        );

        if (otherParticipant?.user?.role === 'ADMIN') {
          return;
        } else if (otherParticipant?.user?.role === 'TEACHER') {
          teachersUnread += unreadCount;
        } else {
          chatsUnread += unreadCount;
        }
      }
    });

    const adminUnread = admin?.unreadCount || 0;

    return {
      chats: chatsUnread,
      teachers: teachersUnread,
      admin: adminUnread,
    };
  }, [chats, admin, user]);

  return {
    counts,
    isLoading: isLoadingChats || isLoadingAdmin,
  };
}
