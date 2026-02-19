'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { PaymentStatus, SalaryStatus } from '@/features/finance';

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
  // Initialize breakdown modal state from URL
  const [selectedSalaryForBreakdown, setSelectedSalaryForBreakdown] = useState<{
    teacherId: string;
    teacherName: string;
    month: string;
  } | null>(() => {
    const breakdownTeacherId = searchParams.get('breakdownTeacherId');
    const breakdownMonth = searchParams.get('breakdownMonth');
    const breakdownTeacherName = searchParams.get('breakdownTeacherName');
    
    if (breakdownTeacherId && breakdownMonth && breakdownTeacherName) {
      return {
        teacherId: breakdownTeacherId,
        teacherName: decodeURIComponent(breakdownTeacherName),
        month: breakdownMonth,
      };
    }
    return null;
  });
  const [selectedSalaryIds, setSelectedSalaryIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
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

  // Handle tab change
  const handleTabChange = useCallback((tab: 'payments' | 'salaries') => {
    setActiveTab(tab);
    updateUrlParams({ tab });
  }, [updateUrlParams]);

  // Handle search change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (activeTab === 'payments') {
      setPaymentsPage(0);
      updateUrlParams({ q: value || null, paymentsPage: null });
    } else {
      setSalariesPage(0);
      updateUrlParams({ q: value || null, salariesPage: null });
    }
  }, [activeTab, updateUrlParams]);

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

  // Handle salary breakdown view
  const handleViewBreakdown = useCallback((salary: { teacherId: string; teacherName: string; month: string }) => {
    setSelectedSalaryForBreakdown(salary);
    // Update URL to persist state
    const params = new URLSearchParams(searchParams.toString());
    params.set('breakdownTeacherId', salary.teacherId);
    params.set('breakdownMonth', salary.month);
    params.set('breakdownTeacherName', encodeURIComponent(salary.teacherName));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // Handle breakdown modal close
  const handleBreakdownClose = useCallback(() => {
    setSelectedSalaryForBreakdown(null);
    // Remove breakdown params from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('breakdownTeacherId');
    params.delete('breakdownMonth');
    params.delete('breakdownTeacherName');
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
  }, [router, pathname, searchParams]);

  return {
    // State
    activeTab,
    paymentsPage,
    salariesPage,
    searchQuery,
    paymentStatus,
    salaryStatus,
    selectedSalaryId,
    isDetailModalOpen,
    selectedSalaryForBreakdown,
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
    handleViewBreakdown,
    handleBreakdownClose,
    // Router utilities
    router,
    pathname,
    searchParams,
  };
}

