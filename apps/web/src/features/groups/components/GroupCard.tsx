'use client';

import { GroupCardDesktop } from './group-card/GroupCardDesktop';
import { GroupCardMobile } from './group-card/GroupCardMobile';
import { useGroupCard } from './group-card/useGroupCard';
import type { GroupCardProps } from './group-card/group-card.types';

export { GroupCardOverflowMenu } from './group-card/GroupCardOverflowMenu';
export type { GroupCardProps } from './group-card/group-card.types';

export function GroupCard(props: GroupCardProps) {
  const vm = useGroupCard(props);
  const layoutProps = { ...props, ...vm };

  return (
    <div className="flex h-full min-w-0 flex-col bg-transparent p-0 shadow-none sm:rounded-lg sm:border sm:border-slate-200 sm:bg-white sm:p-4 sm:shadow-sm">
      <GroupCardMobile {...layoutProps} />
      <GroupCardDesktop {...layoutProps} />
    </div>
  );
}
