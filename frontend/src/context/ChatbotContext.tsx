import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface ChatbotContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const ChatbotContext = createContext<ChatbotContextValue | null>(null);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  );

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
}

export function useChatbot() {
  const ctx = useContext(ChatbotContext);
  if (!ctx) throw new Error('useChatbot must be used within ChatbotProvider');
  return ctx;
}
