'use client';

import { NextIntlClientProvider } from 'next-intl';
import type { AbstractIntlMessages } from 'next-intl';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { locales, type Locale } from '@/config/i18n';
import { persistLocalePreference } from '@/shared/lib/locale-persistence';

type ClientIntlProviderProps = {
  children: ReactNode;
  initialLocale: Locale;
  initialMessages: AbstractIntlMessages;
};

type LocaleSwitchContextValue = {
  switchLocale: (newLocale: Locale) => void;
};

const LocaleSwitchContext = createContext<LocaleSwitchContextValue | null>(null);

const messageLoaders: Record<
  Locale,
  () => Promise<{ default: AbstractIntlMessages }>
> = {
  en: () => import('../../../languages/en.json'),
  hy: () => import('../../../languages/hy.json'),
};

async function loadMessages(locale: Locale): Promise<AbstractIntlMessages> {
  const module = await messageLoaders[locale]();
  return module.default;
}

export function ClientIntlProvider({
  children,
  initialLocale,
  initialMessages,
}: ClientIntlProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<AbstractIntlMessages>(initialMessages);
  const messageCacheRef = useRef<Partial<Record<Locale, AbstractIntlMessages>>>({
    [initialLocale]: initialMessages,
  });

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    for (const nextLocale of locales) {
      if (nextLocale === initialLocale || messageCacheRef.current[nextLocale]) {
        continue;
      }

      void loadMessages(nextLocale).then((loadedMessages) => {
        messageCacheRef.current[nextLocale] = loadedMessages;
      });
    }
  }, [initialLocale]);

  const switchLocale = useCallback(
    (newLocale: Locale) => {
      if (newLocale === locale || !locales.includes(newLocale)) {
        return;
      }

      persistLocalePreference(newLocale);

      const cachedMessages = messageCacheRef.current[newLocale];
      if (cachedMessages) {
        setLocale(newLocale);
        setMessages(cachedMessages);
        return;
      }

      void loadMessages(newLocale).then((loadedMessages) => {
        messageCacheRef.current[newLocale] = loadedMessages;
        setLocale(newLocale);
        setMessages(loadedMessages);
      });
    },
    [locale],
  );

  const contextValue = useMemo(() => ({ switchLocale }), [switchLocale]);

  return (
    <LocaleSwitchContext.Provider value={contextValue}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleSwitchContext.Provider>
  );
}

export function useLocaleSwitchContext() {
  const context = useContext(LocaleSwitchContext);

  if (!context) {
    throw new Error('useLocaleSwitchContext must be used within ClientIntlProvider');
  }

  return context;
}
