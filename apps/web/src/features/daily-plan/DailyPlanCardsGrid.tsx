'use client';

import { useMemo, type RefObject } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { DailyPlan, DailyPlanResourceKind } from './types';
import { DailyPlanCard } from './DailyPlanCard';
import {
  dailyPlanCardContainerVariants,
  dailyPlanCardItemVariants,
} from './dailyPlanCardAnimations';

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

interface DailyPlanCardsGridListProps {
  items: DailyPlan[];
  kindLabel: Record<DailyPlanResourceKind, string>;
  onView: (plan: DailyPlan) => void;
  onEdit: (plan: DailyPlan) => void;
  onDelete?: (plan: DailyPlan) => Promise<void>;
  isDeletePending: boolean;
  className: string;
  reducedMotion: boolean;
}

function resultsSignature(items: DailyPlan[]): string {
  return items.map((plan) => plan.id).join('|');
}

function DailyPlanCardsGridList({
  items,
  kindLabel,
  onView,
  onEdit,
  onDelete,
  isDeletePending,
  className,
  reducedMotion,
}: DailyPlanCardsGridListProps) {
  const signature = useMemo(() => resultsSignature(items), [items]);

  if (reducedMotion) {
    return (
      <div className={className}>
        {items.map((plan) => (
          <div key={plan.id} className="h-full min-w-0">
            <DailyPlanCard
              plan={plan}
              kindLabel={kindLabel}
              onView={() => onView(plan)}
              onEdit={() => onEdit(plan)}
              onDelete={onDelete ? () => onDelete(plan) : undefined}
              isDeletePending={isDeletePending}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      key={signature}
      className={className}
      variants={dailyPlanCardContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((plan, index) => (
        <motion.div
          key={plan.id}
          className="h-full min-w-0"
          custom={index}
          variants={dailyPlanCardItemVariants}
        >
          <DailyPlanCard
            plan={plan}
            kindLabel={kindLabel}
            onView={() => onView(plan)}
            onEdit={() => onEdit(plan)}
            onDelete={onDelete ? () => onDelete(plan) : undefined}
            isDeletePending={isDeletePending}
          />
        </motion.div>
      ))}
    </motion.div>
  );
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
  const prefersReducedMotion = useReducedMotion() === true;
  const sharedListProps = {
    kindLabel,
    onView,
    onEdit,
    onDelete,
    isDeletePending,
    reducedMotion: prefersReducedMotion,
  };

  return (
    <div className="space-y-4">
      {cardsStartRef ? <div ref={cardsStartRef} className="md:hidden" /> : null}
      <DailyPlanCardsGridList
        {...sharedListProps}
        items={mobileItems}
        className="grid grid-cols-1 items-stretch gap-4 md:hidden"
      />
      <DailyPlanCardsGridList
        {...sharedListProps}
        items={items}
        className="hidden auto-rows-fr grid-cols-1 items-stretch gap-4 md:grid md:grid-cols-2"
      />
    </div>
  );
}
