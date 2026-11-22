import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface PrivacyContextType {
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  setPrivacyMode: (value: boolean) => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('taskhub_privacy_mode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('taskhub_privacy_mode', String(isPrivacyMode));
    } catch {}

    if (isPrivacyMode) {
      document.body.classList.add('privacy-mode-active');
    } else {
      document.body.classList.remove('privacy-mode-active');
    }
  }, [isPrivacyMode]);

  // Globalny skrót klawiszowy: Alt + P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setIsPrivacyMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const togglePrivacyMode = useCallback(() => {
    setIsPrivacyMode((prev) => !prev);
  }, []);

  const setPrivacyMode = useCallback((val: boolean) => {
    setIsPrivacyMode(val);
  }, []);

  return (
    <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacyMode, setPrivacyMode }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacyMode = (): PrivacyContextType => {
  const context = useContext(PrivacyContext);
  if (!context) {
    return {
      isPrivacyMode: false,
      togglePrivacyMode: () => {},
      setPrivacyMode: () => {},
    };
  }
  return context;
};

export const PrivacyMask: React.FC<{
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'div';
}> = ({ children, className = '', as = 'span' }) => {
  const Component = as;
  return <Component className={`privacy-mask ${className}`}>{children}</Component>;
};
