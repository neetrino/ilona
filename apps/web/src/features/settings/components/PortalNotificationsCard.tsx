'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui';

interface NotificationItem {
  id: string;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface PortalNotificationsCardProps {
  items: NotificationItem[];
}

export function PortalNotificationsCard({ items }: PortalNotificationsCardProps) {
  const t = useTranslations('settings');

  return (
    <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
      <h2 className="mb-6 text-lg font-semibold text-[#3b3b40]">{t('notificationPreferences')}</h2>

      <div className="space-y-6">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center justify-between py-4 ${
              index < items.length - 1 ? 'border-b border-[rgba(14,14,16,0.07)]' : ''
            }`}
          >
            <div>
              <h3 className="font-medium text-[#3b3b40]">{item.label}</h3>
              <p className="text-sm text-[#8b8b90]">{item.desc}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => item.onChange(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-[#f1f1f2] after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#1010a3] peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1010a3]/20 peer-focus:ring-offset-0 rtl:peer-checked:after:-translate-x-full" />
            </label>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-6">
        <Button
          type="button"
          size="lg"
          className="h-11 min-h-11 rounded-[15px] bg-[#1010a3] px-6 py-0 text-white hover:bg-[#1010a3]/90"
        >
          {t('savePreferences')}
        </Button>
      </div>
    </div>
  );
}
