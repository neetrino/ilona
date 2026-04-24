'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from 'react';

type CrmExclusiveAudioApi = {
  /** Pauses and resets any other CRM inline player, then registers `audio` as active. */
  takeOverPlayback: (audio: HTMLAudioElement) => void;
};

const CrmExclusiveAudioContext = createContext<CrmExclusiveAudioApi | null>(null);

export function CrmExclusiveAudioProvider({ children }: { children: ReactNode }) {
  const activeRef = useRef<HTMLAudioElement | null>(null);

  const takeOverPlayback = useCallback((audio: HTMLAudioElement) => {
    if (activeRef.current && activeRef.current !== audio) {
      activeRef.current.pause();
      activeRef.current.currentTime = 0;
    }
    activeRef.current = audio;
  }, []);

  return (
    <CrmExclusiveAudioContext.Provider value={{ takeOverPlayback }}>
      {children}
    </CrmExclusiveAudioContext.Provider>
  );
}

export function useCrmExclusiveAudio(): CrmExclusiveAudioApi {
  const ctx = useContext(CrmExclusiveAudioContext);
  return ctx ?? { takeOverPlayback: () => {} };
}
