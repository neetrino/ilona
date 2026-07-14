'use client';

import type { RefObject } from 'react';
import type { DailyPlan, DailyPlanResourceKind } from './types';
import { DailyPlanCard } from './DailyPlanCard';

interface DailyPlanCardsGridProps {
  items: DailyPlan[];
  kindLabel: Record<DailyPlanResourceKind, string>;
  onView: (plan: DailyPlan) => void;
  onEdit: (plan: DailyPlan) => void;
  onDelete?: (plan: DailyPlan) => Promise<void>;
  isDeletePending: boolean;
  mobileItems: DailyPlan[];
  cardsStartRef?: RefObject<HTMLDivElement | null>;
}

export function DailyPlanCardsGrid({
  items,
  kindLabel,
  onView,
  onEdit,
  onDelete,
  isDeletePending,
  mobileItems,
  cardsStartRef,
}: DailyPlanCardsGridProps) {
  return (
    <div className="space-y-4">
      {cardsStartRef ? <div ref={cardsStartRef} className="md:hidden" /> : null}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {mobileItems.map((plan) => (
          <DailyPlanCard
            key={plan.id}
            plan={plan}
            kindLabel={kindLabel}
            onView={() => onView(plan)}
            onEdit={() => onEdit(plan)}
            onDelete={onDelete ? () => onDelete(plan) : undefined}
            isDeletePending={isDeletePending}
          />
        ))}
      </div>
      <div className="hidden grid-cols-1 gap-4 md:grid md:grid-cols-2">
        {items.map((plan) => (
          <DailyPlanCard
            key={`desktop-${plan.id}`}
            plan={plan}
            kindLabel={kindLabel}
            onView={() => onView(plan)}
            onEdit={() => onEdit(plan)}
            onDelete={onDelete ? () => onDelete(plan) : undefined}
            isDeletePending={isDeletePending}
          />
        ))}
      </div>
    </div>
  );
}
