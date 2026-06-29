export const DMY_INPUT_CLASS_NAME =
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export const TEXTAREA_CLASS_NAME = `${DMY_INPUT_CLASS_NAME} min-h-[6rem] resize-y`;

export const LEVEL_FILTER_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export function formFieldId(idPrefix: string, id: string): string {
  return idPrefix ? `${idPrefix}-${id}` : id;
}
