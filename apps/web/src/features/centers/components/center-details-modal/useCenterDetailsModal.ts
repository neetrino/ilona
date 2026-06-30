'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { fetchCenterDetails } from '../../api/centers.api';
import type { CenterDetailsModalProps, CenterDetailsTabId } from './center-details-modal.types';

export function useCenterDetailsModal({ centerId, open, onClose }: CenterDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<CenterDetailsTabId>('teachers');

  const { data, isLoading, error } = useQuery({
    queryKey: ['center-details', centerId],
    queryFn: () => fetchCenterDetails(centerId!),
    enabled: !!centerId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const requestClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    enabled: open,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!open) {
      resetDrag();
    }
  }, [open, resetDrag]);

  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(open);

  return {
    data,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    dragStyle,
    dragHandleProps,
    scrollContentProps,
    overlayStyle,
    contentStyle,
    isBaseLayer,
    open,
    onClose,
  };
}
