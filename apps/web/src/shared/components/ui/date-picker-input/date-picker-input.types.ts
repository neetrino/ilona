import type * as React from 'react';

export interface PopoverPosition {
  left: number;
  top: number;
  width: number;
  placement: 'above' | 'below';
  matchFormWidth: boolean;
  positionMode: 'fixed' | 'absolute';
}

export interface DatePickerInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
  allowClear?: boolean;
  /** Wider calendar popover; trigger input size is unchanged. */
  popoverExpanded?: boolean;
}

export interface DatePickerInputViewModel {
  rootRef: React.RefObject<HTMLDivElement | null>;
  popoverRef: React.RefObject<HTMLDivElement | null>;
  triggerId: string;
  open: boolean;
  mounted: boolean;
  currentValue: string;
  inputValue: string;
  selectedDate: Date | null;
  monthDate: Date;
  setMonthDate: React.Dispatch<React.SetStateAction<Date>>;
  yearDropdownOpen: boolean;
  setYearDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  yearDropdownOpenRef: React.MutableRefObject<boolean>;
  yearOptions: number[];
  visibleYear: number;
  monthName: string;
  days: Date[];
  popoverPosition: PopoverPosition | null;
  portalContainer: HTMLElement | null;
  isMobileLayout: boolean;
  useDialogPortal: boolean;
  backdropPositionClass: string;
  allowClear: boolean;
  required: boolean | undefined;
  disabled: boolean | undefined;
  placeholder: string | undefined;
  className: string | undefined;
  name: string | undefined;
  min: string | number | readonly string[] | undefined;
  max: string | number | readonly string[] | undefined;
  onChange: DatePickerInputProps['onChange'];
  handleOpenChange: (nextOpen: boolean) => void;
  handleYearToggle: () => void;
  isOutOfRange: (date: Date) => boolean;
  selectDate: (date: Date) => void;
  handleClear: () => void;
  handleToday: () => void;
  handleDraftTextChange: (raw: string) => void;
  handleInputFocus: () => void;
  handleInputBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  handleInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  isEditing: boolean;
  tCommon: (key: string) => string;
}
