'use client';

import { SalaryBreakdownModalView } from './SalaryBreakdownModalView';
import { useSalaryBreakdownModal } from './useSalaryBreakdownModal';
import type { SalaryBreakdownModalProps } from './salary-breakdown-modal.types';

export type { SalaryBreakdownModalProps } from './salary-breakdown-modal.types';

export function SalaryBreakdownModal(props: SalaryBreakdownModalProps) {
  const vm = useSalaryBreakdownModal(props);

  if (!vm.shouldRender) return null;

  return <SalaryBreakdownModalView {...vm} />;
}
