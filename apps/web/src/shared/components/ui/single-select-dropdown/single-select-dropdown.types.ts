export interface SingleSelectOption {
  id: string;
  label: string;
}

export type MenuPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  positionMode: 'fixed' | 'absolute';
};

export interface SingleSelectDropdownProps {
  id?: string;
  label?: string;
  options: SingleSelectOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  allowDeselect?: boolean;
  placeholder?: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  wrapText?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  noSearchResultsMessage?: string;
  menuMinWidth?: number;
}
