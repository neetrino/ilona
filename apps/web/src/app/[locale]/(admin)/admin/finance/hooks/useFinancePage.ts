'use client';

import { useState, useCallback, useEffect, useRef, startTransition, useMemo } from 'react';
import type { PaymentStatus, SalaryStatus } from '@/features/finance';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import type { FinanceTabId } from '../components/FinanceTabs';
import {
  getCurrentEarningsMonth,
  parseEarningsMonth,
  shiftEarningsMonth,
} from '../utils/earnings-month';

const SEARCH_DEBOUNCE_MS = 300;
const SALARY_ID_PARAM = 'salaryId';

const PAYMENT_STATUSES = new Set(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']);
const SALARY_STATUSES = new Set(['PENDING', 'PAID']);

function parsePageParam(value: string | null, fallback = 0): number {
  const page = parseInt(value || String(fallback), 10);
  return Number.isNaN(page) ? fallback : Math.max(0, page);
}

function parseTab(value: string | null): FinanceTabId {
  if (value === 'salaries') return 'salaries';
  if (value === 'earnings') return 'earnings';
  return 'payments';
}

function parsePaymentStatus(value: string | null): PaymentStatus | '' {
  return value && PAYMENT_STATUSES.has(value) ? (value as PaymentStatus) : '';
}

function parseSalaryStatus(value: string | null): SalaryStatus | '' {
  return value && SALARY_STATUSES.has(value) ? (value as SalaryStatus) : '';
}

export function useFinancePage() {
  const { router, pathname, searchParams, urlRevision, replaceParams } = useAppSearchUrl();
  const isSalaryModalClosingRef = useRef(false);

  const activeTab = useMemo(
    () => parseTab(readUrlSearchParam('tab', searchParams, urlRevision)),
    [searchParams, urlRevision],
  );

  const paymentsPage = useMemo(
    () => parsePageParam(readUrlSearchParam('paymentsPage', searchParams, urlRevision)),
    [searchParams, urlRevision],
  );

  const salariesPage = useMemo(
    () => parsePageParam(readUrlSearchParam('salariesPage', searchParams, urlRevision)),
    [searchParams, urlRevision],
  );

  const earningsPage = useMemo(
    () => parsePageParam(readUrlSearchParam('earningsPage', searchParams, urlRevision)),
    [searchParams, urlRevision],
  );

  const earningsMonth = useMemo(
    () =>
      parseEarningsMonth(
        readUrlSearchParam('earningsMonth', searchParams, urlRevision) || getCurrentEarningsMonth(),
      ),
    [searchParams, urlRevision],
  );

  const paymentStatus = useMemo(
    () => parsePaymentStatus(readUrlSearchParam('paymentStatus', searchParams, urlRevision)),
    [searchParams, urlRevision],
  );

  const salaryStatus = useMemo(
    () => parseSalaryStatus(readUrlSearchParam('salaryStatus', searchParams, urlRevision)),
    [searchParams, urlRevision],
  );

  const selectedSalaryId = useMemo(
    () => readUrlSearchParam(SALARY_ID_PARAM, searchParams, urlRevision),
    [searchParams, urlRevision],
  );

  const isDetailModalOpen = !!selectedSalaryId;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedSalaryIds, setSelectedSalaryIds] = useState<Set<string>>(new Set());
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletePaymentsDialogOpen, setIsDeletePaymentsDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePaymentsError, setDeletePaymentsError] = useState<string | null>(null);
  const prevDebouncedQRef = useRef(debouncedSearchQuery);

  useEffect(() => {
    const qFromUrl = readUrlSearchParam('q', searchParams, urlRevision) || '';
    setSearchQuery(qFromUrl);
    setDebouncedSearchQuery(qFromUrl);
    prevDebouncedQRef.current = qFromUrl;
  }, [searchParams, urlRevision]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        const next = searchQuery;
        const isNewSearch = prevDebouncedQRef.current !== next;
        prevDebouncedQRef.current = next;
        setDebouncedSearchQuery(next);
        if (isNewSearch) {
          if (activeTab === 'payments') {
            replaceParams({ q: next || null, paymentsPage: null });
          } else if (activeTab === 'salaries') {
            replaceParams({ q: next || null, salariesPage: null });
          } else {
            replaceParams({ q: next || null, earningsPage: null });
          }
        }
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, replaceParams]);

  const handleTabChange = useCallback(
    (tab: FinanceTabId) => {
      if (tab !== 'payments') setSelectedPaymentIds(new Set());
      if (tab !== 'salaries') setSelectedSalaryIds(new Set());
      const params: Record<string, string | null> = {
        tab: tab === 'payments' ? null : tab,
      };
      if (tab === 'earnings' && !readUrlSearchParam('earningsMonth', searchParams, urlRevision)) {
        params.earningsMonth = getCurrentEarningsMonth();
      }
      replaceParams(params);
    },
    [replaceParams, searchParams, urlRevision],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handlePaymentStatusChange = useCallback(
    (status: PaymentStatus | '') => {
      setSelectedPaymentIds(new Set());
      replaceParams({ paymentStatus: status || null, paymentsPage: null });
    },
    [replaceParams],
  );

  const handleSalaryStatusChange = useCallback(
    (status: SalaryStatus | '') => {
      setSelectedSalaryIds(new Set());
      replaceParams({ salaryStatus: status || null, salariesPage: null });
    },
    [replaceParams],
  );

  const handlePaymentsPageChange = useCallback(
    (page: number) => {
      setSelectedPaymentIds(new Set());
      replaceParams({ paymentsPage: page || null });
    },
    [replaceParams],
  );

  const handleSalariesPageChange = useCallback(
    (page: number) => {
      setSelectedSalaryIds(new Set());
      replaceParams({ salariesPage: page || null });
    },
    [replaceParams],
  );

  const handleEarningsPageChange = useCallback(
    (page: number) => {
      replaceParams({ earningsPage: page || null });
    },
    [replaceParams],
  );

  const handleEarningsMonthChange = useCallback(
    (month: string) => {
      replaceParams({
        earningsMonth: parseEarningsMonth(month),
        earningsPage: null,
      });
    },
    [replaceParams],
  );

  const handleEarningsMonthShift = useCallback(
    (delta: number) => {
      replaceParams({
        earningsMonth: shiftEarningsMonth(earningsMonth, delta),
        earningsPage: null,
      });
    },
    [earningsMonth, replaceParams],
  );

  const openSalaryDetail = useCallback(
    (salaryId: string) => {
      isSalaryModalClosingRef.current = false;
      replaceParams({ [SALARY_ID_PARAM]: salaryId });
    },
    [replaceParams],
  );

  const closeSalaryDetail = useCallback(() => {
    isSalaryModalClosingRef.current = true;
    replaceParams({ [SALARY_ID_PARAM]: null });
    setTimeout(() => {
      isSalaryModalClosingRef.current = false;
    }, 100);
  }, [replaceParams]);

  return {
    activeTab,
    paymentsPage,
    salariesPage,
    earningsPage,
    earningsMonth,
    searchQuery,
    debouncedSearchQuery,
    paymentStatus,
    salaryStatus,
    selectedSalaryId,
    isDetailModalOpen,
    selectedSalaryIds,
    selectedPaymentIds,
    isDeleteDialogOpen,
    isDeletePaymentsDialogOpen,
    deleteError,
    deletePaymentsError,
    setSelectedSalaryIds,
    setSelectedPaymentIds,
    setIsDeleteDialogOpen,
    setIsDeletePaymentsDialogOpen,
    setDeleteError,
    setDeletePaymentsError,
    handleTabChange,
    handleSearchChange,
    handlePaymentStatusChange,
    handleSalaryStatusChange,
    handlePaymentsPageChange,
    handleSalariesPageChange,
    handleEarningsPageChange,
    handleEarningsMonthChange,
    handleEarningsMonthShift,
    openSalaryDetail,
    closeSalaryDetail,
    router,
    pathname,
    searchParams,
    urlRevision,
  };
}
