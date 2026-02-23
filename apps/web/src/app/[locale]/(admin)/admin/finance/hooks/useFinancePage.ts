'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { PaymentStatus, SalaryStatus } from '@/features/finance';

const SEARCH_DEBOUNCE_MS = 300;

export function useFinancePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Initialize state from URL params
  const [activeTab, setActiveTab] = useState<'payments' | 'salaries'>(() => {
    const tabFromUrl = searchParams.get('tab');
    return (tabFromUrl === 'payments' || tabFromUrl === 'salaries') ? tabFromUrl : 'payments';
  });
  const [paymentsPage, setPaymentsPage] = useState(() => {
    const page = parseInt(searchParams.get('paymentsPage') || '0', 10);
    return isNaN(page) ? 0 : Math.max(0, page);
  });
  const [salariesPage, setSalariesPage] = useState(() => {
    const page = parseInt(searchParams.get('salariesPage') || '0', 10);
    return isNaN(page) ? 0 : Math.max(0, page);
  });
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(() => searchParams.get('q') || '');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>(() => {
    const status = searchParams.get('paymentStatus') as PaymentStatus | null;
    return status && ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'].includes(status) ? status : '';
  });
  const [salaryStatus, setSalaryStatus] = useState<SalaryStatus | ''>(() => {
    const status = searchParams.get('salaryStatus') as SalaryStatus | null;
    return status && ['PENDING', 'PAID'].includes(status) ? status : '';
  });
  const [selectedSalaryId, setSelectedSalaryId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSalaryIds, setSelectedSalaryIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const prevDebouncedQRef = useRef(debouncedSearchQuery);

  // Update URL params when filters change
  const updateUrlParams = useCallback((updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 0) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  // Debounce search: update committed value and URL after delay; reset page only when search actually changed.
  // Do URL/page updates in the timeout callback (not inside setState updater) to avoid updating Router during render.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchQuery;
      const isNewSearch = prevDebouncedQRef.current !== next;
      prevDebouncedQRef.current = next;
      setDebouncedSearchQuery(next);
      if (isNewSearch) {
        if (activeTab === 'payments') {
          setPaymentsPage(0);
          updateUrlParams({ q: next || null, paymentsPage: null });
        } else {
          setSalariesPage(0);
          updateUrlParams({ q: next || null, salariesPage: null });
        }
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, updateUrlParams]);

  // Handle tab change
  const handleTabChange = useCallback((tab: 'payments' | 'salaries') => {
    setActiveTab(tab);
    updateUrlParams({ tab });
  }, [updateUrlParams]);

  // Handle search change (only updates input; debounce effect handles API + URL + page reset)
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Handle payment status change
  const handlePaymentStatusChange = useCallback((status: PaymentStatus | '') => {
    setPaymentStatus(status);
    setPaymentsPage(0);
    updateUrlParams({ paymentStatus: status || null, paymentsPage: null });
  }, [updateUrlParams]);

  // Handle salary status change
  const handleSalaryStatusChange = useCallback((status: SalaryStatus | '') => {
    setSalaryStatus(status);
    setSalariesPage(0);
    updateUrlParams({ salaryStatus: status || null, salariesPage: null });
  }, [updateUrlParams]);

  // Handle page changes
  const handlePaymentsPageChange = useCallback((page: number) => {
    setPaymentsPage(page);
    updateUrlParams({ paymentsPage: page || null });
  }, [updateUrlParams]);

  const handleSalariesPageChange = useCallback((page: number) => {
    setSalariesPage(page);
    updateUrlParams({ salariesPage: page || null });
  }, [updateUrlParams]);

  return {
    // State
    activeTab,
    paymentsPage,
    salariesPage,
    searchQuery,
    debouncedSearchQuery,
    paymentStatus,
    salaryStatus,
    selectedSalaryId,
    isDetailModalOpen,
    selectedSalaryIds,
    isDeleteDialogOpen,
    deleteError,
    // Setters
    setSelectedSalaryId,
    setIsDetailModalOpen,
    setSelectedSalaryIds,
    setIsDeleteDialogOpen,
    setDeleteError,
    // Handlers
    handleTabChange,
    handleSearchChange,
    handlePaymentStatusChange,
    handleSalaryStatusChange,
    handlePaymentsPageChange,
    handleSalariesPageChange,
    // Router utilities
    router,
    pathname,
    searchParams,
  };
}

