export type ChatUiVariant = 'default' | 'student';

export type ChatThemeTokens = {
  shell: string;
  border: string;
  headerBg: string;
  messagesBg: string;
  title: string;
  body: string;
  muted: string;
  subtle: string;
  backBtn: string;
  ghostBtn: string;
  iconBtn: string;
  searchInput: string;
  listHover: string;
  listActive: string;
  avatar: string;
  unreadBadge: string;
  primaryBtn: string;
  primaryBtnDisabled: string;
  ownBubble: string;
  otherBubble: string;
  input: string;
  loadMore: string;
  spinner: string;
  datePill: string;
  focusMessage: string;
  typing: string;
  emptyIcon: string;
  skeleton: string;
  voicePlayCircle: string;
  voicePlayIcon: string;
};

const studentTheme: ChatThemeTokens = {
  shell: 'rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white',
  border: 'border-[rgba(14,14,16,0.07)]',
  headerBg: 'bg-white',
  messagesBg: 'bg-[#fafafa]',
  title: 'text-[#1010a3]',
  body: 'text-[#3b3b40]',
  muted: 'text-[#8b8b90]',
  subtle: 'text-[#8b8b90]/80',
  backBtn:
    'text-[#3b3b40] hover:text-[#1010a3] hover:bg-[#f6f6f7] rounded-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:ring-offset-2',
  ghostBtn:
    'text-[#3b3b40] bg-[#f6f6f7] rounded-[0.875rem] hover:bg-[#ececec] transition-colors',
  iconBtn: 'hover:bg-[#f6f6f7] rounded-[0.875rem] text-[#8b8b90]',
  searchInput:
    'w-full pl-9 pr-4 py-2 rounded-[0.875rem] border border-[rgba(14,14,16,0.07)] bg-white text-sm text-[#3b3b40] placeholder:text-[#8b8b90] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/15 focus:border-[#1010a3]',
  listHover: 'hover:bg-[#f6f6f7]',
  listActive: 'bg-[#ddecff]/70 hover:bg-[#ddecff]/80',
  avatar: 'bg-[#1010a3]',
  unreadBadge: 'bg-[#1010a3] text-white',
  primaryBtn: 'bg-[#1010a3] text-white hover:opacity-90',
  primaryBtnDisabled: 'bg-[#f1f1f2] text-[#8b8b90] cursor-not-allowed',
  ownBubble: 'bg-[#1010a3] text-white rounded-br-md',
  otherBubble: 'bg-white text-[#3b3b40] rounded-bl-md shadow-sm border border-[rgba(14,14,16,0.07)]',
  input:
    'flex-1 px-4 py-2 rounded-[0.875rem] border border-[rgba(14,14,16,0.07)] bg-white resize-none text-sm text-[#3b3b40] placeholder:text-[#8b8b90] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/15 focus:border-[#1010a3] overflow-x-hidden',
  loadMore: 'text-sm text-[#1010a3] hover:opacity-80',
  spinner: 'border-2 border-[#1010a3] border-t-transparent',
  datePill: 'bg-white text-[#8b8b90] border border-[rgba(14,14,16,0.07)]',
  focusMessage: 'ring-2 ring-[#1010a3]/30 ring-offset-2 ring-offset-[#fafafa]',
  typing: 'text-[#1010a3]',
  emptyIcon: 'bg-[#f6f6f7] text-[#8b8b90]',
  skeleton: 'bg-[#f1f1f2]',
  voicePlayCircle:
    'rounded-full bg-white shadow-sm ring-1 ring-[rgba(14,14,16,0.08)] border border-[rgba(14,14,16,0.06)]',
  voicePlayIcon: 'text-[#1010a3]',
};

const defaultTheme: ChatThemeTokens = {
  shell: 'rounded-2xl border border-slate-200 bg-white',
  border: 'border-slate-200',
  headerBg: 'bg-white',
  messagesBg: 'bg-slate-50',
  title: 'text-slate-800',
  body: 'text-slate-700',
  muted: 'text-slate-500',
  subtle: 'text-slate-400',
  backBtn:
    'text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  ghostBtn: 'text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors',
  iconBtn: 'hover:bg-slate-100 rounded-lg text-slate-500',
  searchInput:
    'w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20',
  listHover: 'hover:bg-slate-50',
  listActive: 'bg-primary/10 hover:bg-primary/10',
  avatar: 'bg-primary',
  unreadBadge: 'bg-primary text-primary-foreground',
  primaryBtn: 'bg-primary text-primary-foreground hover:bg-primary/90',
  primaryBtnDisabled: 'bg-slate-100 text-slate-400',
  ownBubble: 'bg-primary text-primary-foreground rounded-br-md',
  otherBubble: 'bg-white text-slate-800 rounded-bl-md shadow-sm',
  input:
    'flex-1 px-4 py-2 bg-slate-100 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 overflow-x-hidden',
  loadMore: 'text-sm text-primary hover:text-primary/90',
  spinner: 'border-2 border-primary border-t-transparent',
  datePill: 'bg-white text-slate-500 shadow-sm',
  focusMessage: 'ring-2 ring-primary/40 ring-offset-2 ring-offset-slate-50',
  typing: 'text-primary',
  emptyIcon: 'bg-slate-100 text-slate-400',
  skeleton: 'bg-slate-200',
  voicePlayCircle: 'rounded-full bg-white shadow-sm ring-1 ring-slate-200/80 border border-slate-100',
  voicePlayIcon: 'text-primary',
};

export function getChatTheme(variant: ChatUiVariant): ChatThemeTokens {
  return variant === 'student' ? studentTheme : defaultTheme;
}
