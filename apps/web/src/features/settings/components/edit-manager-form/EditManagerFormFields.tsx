'use client';

import { Input, Label, SegmentedControl } from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
import type { ManagerFormLike } from './edit-manager-form.types';

export function EditManagerFormError({ message }: { message: string }) {
  return (
    <div className="rounded-[15px] border border-red-200 bg-red-50 p-3">
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
}

export function EditManagerFormProfileFields({
  form,
  t,
  disabled = false,
}: {
  form: ManagerFormLike;
  t: (key: string) => string;
  disabled?: boolean;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="manager-firstName">{t('firstName')}</Label>
          <Input
            id="manager-firstName"
            className={ADMIN_FORM_INPUT_CLASS}
            disabled={disabled}
            {...form.register('firstName')}
          />
          {form.formState.errors.firstName && (
            <p className="text-sm text-red-600">{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="manager-lastName">{t('lastName')}</Label>
          <Input
            id="manager-lastName"
            className={ADMIN_FORM_INPUT_CLASS}
            disabled={disabled}
            {...form.register('lastName')}
          />
          {form.formState.errors.lastName && (
            <p className="text-sm text-red-600">{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="manager-email">{t('emailAddress')}</Label>
        <Input
          id="manager-email"
          type="email"
          className={ADMIN_FORM_INPUT_CLASS}
          disabled={disabled}
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="manager-phone">{t('phoneNumber')}</Label>
        <Input
          id="manager-phone"
          className={ADMIN_FORM_INPUT_CLASS}
          disabled={disabled}
          {...form.register('phone')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="manager-password">{t('managerNewPassword')}</Label>
        <Input
          id="manager-password"
          type="password"
          autoComplete="new-password"
          placeholder={t('managerPasswordLeaveBlank')}
          className={ADMIN_FORM_INPUT_CLASS}
          disabled={disabled}
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
        )}
      </div>
    </>
  );
}

export function EditManagerFormCenterSelect({
  form,
  t,
  selectableCenters,
  disabled,
  hint,
  centerError,
}: {
  form: ManagerFormLike;
  t: (key: string) => string;
  selectableCenters: Array<{ id: string; name: string }>;
  disabled: boolean;
  hint?: string;
  centerError?: string;
}) {
  const currentCenterId = form.watch('centerId') ?? '';

  return (
    <div className="min-w-0 w-full space-y-2">
      <SingleSelectDropdown
        id="manager-center"
        label={t('managerSelectCenter')}
        className="w-full"
        triggerClassName={ADMIN_FORM_INPUT_CLASS}
        options={selectableCenters.map((center) => ({ id: center.id, label: center.name }))}
        value={currentCenterId}
        onValueChange={(value) =>
          form.setValue('centerId', value ?? '', { shouldDirty: true, shouldValidate: true })
        }
        disabled={disabled}
        allowDeselect
        wrapText
        placeholder={t('managerSelectCenter')}
      />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {centerError && <p className="text-sm text-red-600">{centerError}</p>}
    </div>
  );
}

export function EditManagerFormStatusSelect({
  value,
  onChange,
  disabled,
  t,
  tStatus,
}: {
  value: 'ACTIVE' | 'INACTIVE';
  onChange: (value: 'ACTIVE' | 'INACTIVE') => void;
  disabled?: boolean;
  t: (key: string) => string;
  tStatus: (key: string) => string;
}) {
  return (
    <div className="min-w-0 w-full space-y-2">
      <Label>{t('managerStatus')}</Label>
      <SegmentedControl
        options={[
          { id: 'ACTIVE', label: tStatus('active') },
          { id: 'INACTIVE', label: tStatus('inactive') },
        ]}
        value={value}
        onChange={(nextValue) => onChange(nextValue as 'ACTIVE' | 'INACTIVE')}
        disabled={disabled}
        aria-label={t('managerStatus')}
      />
    </div>
  );
}
