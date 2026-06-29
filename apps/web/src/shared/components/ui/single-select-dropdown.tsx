'use client';

import { cn } from '@/shared/lib/utils';
import {
  preventStackedSheetDismiss,
  stackedSheetDialogHandlers,
} from '@/shared/lib/sheet-stack';
import { useSingleSelectDropdown } from './single-select-dropdown/useSingleSelectDropdown';
import { SingleSelectDropdownTrigger } from './single-select-dropdown/SingleSelectDropdownTrigger';
import { SingleSelectDropdownMenu } from './single-select-dropdown/SingleSelectDropdownMenu';
import {
  SINGLE_SELECT_DROPDOWN_BACKDROP_ATTR,
  SINGLE_SELECT_DROPDOWN_MENU_ATTR,
} from './single-select-dropdown/single-select-dropdown.constants';
import type { SingleSelectDropdownProps } from './single-select-dropdown/single-select-dropdown.types';

export type { SingleSelectOption } from './single-select-dropdown/single-select-dropdown.types';
export {
  SINGLE_SELECT_DROPDOWN_BACKDROP_ATTR,
  SINGLE_SELECT_DROPDOWN_MENU_ATTR,
};

/** Spread onto Radix Dialog.Content when the dialog contains portaled SingleSelectDropdown menus. */
export function preventDialogDismissOnPortaledDropdown(event: Event) {
  preventStackedSheetDismiss(event);
}

export { preventStackedSheetDismiss, stackedSheetDialogHandlers };

export const portaledDropdownDialogHandlers = stackedSheetDialogHandlers;

export function SingleSelectDropdown(props: SingleSelectDropdownProps) {
  const vm = useSingleSelectDropdown(props);

  return (
    <div
      className={cn('relative min-w-0', vm.isOpen && 'z-[10001]', props.className)}
      ref={vm.dropdownRef}
    >
      <div className="relative">
        <SingleSelectDropdownTrigger
          label={props.label}
          labelId={vm.labelId}
          triggerId={vm.triggerId}
          listboxId={vm.listboxId}
          displayText={vm.displayText}
          hasSelection={vm.hasSelection}
          isOpen={vm.isOpen}
          isLoading={vm.isLoading}
          disabled={vm.disabled}
          error={vm.error}
          triggerClassName={props.triggerClassName}
          triggerRef={vm.triggerRef}
          onPointerDown={vm.handleTriggerPointerDown}
          onKeyDown={vm.handleTriggerKeyDown}
        />
        <SingleSelectDropdownMenu
          isOpen={vm.isOpen}
          openUpward={vm.openUpward}
          menuPosition={vm.menuPosition}
          portalContainer={vm.portalContainer}
          useDialogPortal={vm.useDialogPortal}
          listboxId={vm.listboxId}
          labelId={vm.labelId}
          error={vm.error}
          options={vm.options}
          filteredOptions={vm.filteredOptions}
          searchable={vm.searchable}
          searchQuery={vm.searchQuery}
          onSearchChange={vm.setSearchQuery}
          resolvedSearchPlaceholder={vm.resolvedSearchPlaceholder}
          resolvedNoSearchResultsMessage={vm.resolvedNoSearchResultsMessage}
          wrapText={vm.wrapText}
          value={vm.value}
          activeIndex={vm.activeIndex}
          onActiveIndexChange={vm.setActiveIndex}
          onSelect={vm.handleSelect}
          onMenuKeyDown={vm.handleMenuKeyDown}
          onClose={vm.closeMenu}
          menuRef={vm.menuRef}
          searchInputRef={vm.searchInputRef}
          optionRefs={vm.optionRefs}
          triggerRef={vm.triggerRef}
        />
      </div>
    </div>
  );
}
