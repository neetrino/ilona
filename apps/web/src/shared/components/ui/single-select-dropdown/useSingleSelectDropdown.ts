'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useCallback, useMemo, useId } from 'react';
import { useTranslations } from 'next-intl';
import { computeMenuPosition } from './single-select-dropdown-position.util';
import type { MenuPosition, SingleSelectDropdownProps } from './single-select-dropdown.types';

export function useSingleSelectDropdown({
  id,
  label,
  options,
  value,
  onValueChange,
  allowDeselect = false,
  placeholder = 'Select...',
  isLoading = false,
  disabled = false,
  searchable = false,
  searchPlaceholder,
  noSearchResultsMessage,
  menuMinWidth,
  error = null,
  wrapText = false,
}: SingleSelectDropdownProps) {
  const t = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const generatedId = useId();
  const triggerId = id ?? `single-select-${generatedId}`;
  const labelId = label ? `${triggerId}-label` : undefined;
  const listboxId = `${triggerId}-listbox`;

  const hasSelection = Boolean(value);
  const selectedOption = options.find((opt) => (value ?? '') === opt.id);
  const displayText = selectedOption ? selectedOption.label : placeholder;
  const resolvedSearchPlaceholder = searchPlaceholder ?? `${t('search')}...`;
  const resolvedNoSearchResultsMessage = noSearchResultsMessage ?? t('globalSearchEmpty');

  const filteredOptions = useMemo(() => {
    const listOptions = searchable ? options.filter((option) => option.id !== '') : options;
    if (!searchable || !searchQuery.trim()) return listOptions;
    const query = searchQuery.trim().toLowerCase();
    return listOptions.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, searchable, searchQuery]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const root = dropdownRef.current;
    if (!trigger) return;

    const result = computeMenuPosition({
      trigger,
      root,
      searchable,
      menuMinWidth,
    });
    setPortalContainer(result.portalContainer);
    setOpenUpward(result.openUpward);
    setMenuPosition(result.menuPosition);
  }, [searchable, menuMinWidth]);

  useEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      setPortalContainer(null);
      return;
    }

    updateMenuPosition();

    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      closeMenu();
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('pointerdown', handlePointerDownOutside, true);
    }, 0);

    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('pointerdown', handlePointerDownOutside, true);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition, closeMenu]);

  useEffect(() => {
    if (!isOpen || !searchable) return;
    const timeoutId = setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => clearTimeout(timeoutId);
  }, [isOpen, searchable]);

  const handleSelect = useCallback(
    (optionId: string) => {
      const normalizedOption = optionId === '' ? null : optionId;
      const nextValue = allowDeselect && normalizedOption === value ? null : normalizedOption;
      onValueChange(nextValue);
      closeMenu();
      triggerRef.current?.focus();
    },
    [allowDeselect, value, onValueChange, closeMenu],
  );

  const handleClear = useCallback(() => {
    if (!allowDeselect || disabled || isLoading) return;
    onValueChange(null);
    closeMenu();
    triggerRef.current?.focus();
  }, [allowDeselect, disabled, isLoading, onValueChange, closeMenu]);

  const setOpenWithSelectedIndex = useCallback(() => {
    const selectedIndex = Math.max(0, filteredOptions.findIndex((option) => option.id === value));
    setActiveIndex(selectedIndex);
    setIsOpen(true);
  }, [filteredOptions, value]);

  const handleTriggerPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    setIsOpen((prev) => {
      const nextOpen = !prev;
      if (nextOpen) {
        const selectedIndex = Math.max(
          0,
          filteredOptions.findIndex((option) => option.id === value),
        );
        setActiveIndex(selectedIndex);
      }
      return nextOpen;
    });
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        setOpenWithSelectedIndex();
        return;
      }
      setActiveIndex((prev) => {
        if (filteredOptions.length === 0) return -1;
        if (prev < 0) return 0;
        const step = event.key === 'ArrowDown' ? 1 : -1;
        return (prev + step + filteredOptions.length) % filteredOptions.length;
      });
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isOpen) {
        setOpenWithSelectedIndex();
      } else {
        setIsOpen(false);
      }
    }

    if (event.key === 'Escape') closeMenu();
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
      return;
    }
    if (event.key === 'Tab') {
      closeMenu();
      return;
    }
    if (filteredOptions.length === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((prev) => {
        if (prev < 0) return 0;
        return (prev + step + filteredOptions.length) % filteredOptions.length;
      });
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(filteredOptions.length - 1);
    }
    if ((event.key === 'Enter' || event.key === ' ') && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(filteredOptions[activeIndex].id);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (searchable) {
      setActiveIndex(-1);
      return;
    }
    const selectedIndex = filteredOptions.findIndex((option) => option.id === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : filteredOptions.length > 0 ? 0 : -1);
  }, [isOpen, filteredOptions, value, searchable]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    if (searchable && document.activeElement === searchInputRef.current) return;
    optionRefs.current[activeIndex]?.focus();
  }, [isOpen, activeIndex, searchable]);

  const useDialogPortal = portalContainer !== null && portalContainer !== document.body;

  return {
    isOpen,
    openUpward,
    menuPosition,
    portalContainer,
    useDialogPortal,
    dropdownRef,
    menuRef,
    triggerRef,
    searchInputRef,
    optionRefs,
    triggerId,
    labelId,
    listboxId,
    hasSelection,
    displayText,
    isLoading,
    disabled,
    wrapText,
    searchable,
    searchQuery,
    setSearchQuery,
    filteredOptions,
    activeIndex,
    setActiveIndex,
    value,
    error,
    options,
    resolvedSearchPlaceholder,
    resolvedNoSearchResultsMessage,
    allowDeselect,
    clearLabel: t('clear'),
    closeMenu,
    handleSelect,
    handleClear,
    handleTriggerPointerDown,
    handleTriggerKeyDown,
    handleMenuKeyDown,
  };
}
