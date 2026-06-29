/** URL param: chat id while the delete-group confirmation modal is open. */
export const CHAT_DELETE_GROUP_PARAM = 'deleteGroup';

export function clearChatDeleteGroupParam(params: URLSearchParams): void {
  params.delete(CHAT_DELETE_GROUP_PARAM);
}
