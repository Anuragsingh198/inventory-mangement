import { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { ButtonSpinner } from './index';
import { useChatbot } from '../context/ChatbotContext';

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  isMock?: boolean;
};

const MOCK_DISCLAIMER =
  'Mock response only — due to limited time and the unavailability of free AI resources, live integration is not implemented yet. This is a concept we can build to help users and managers with stock, demand, and reorder decisions.';

const SUGGESTED_QUESTIONS = [
  'Which products will run out next week?',
  'Show dead stock items.',
  'Predict next month demand.',
] as const;

const MOCK_RESPONSES: Record<(typeof SUGGESTED_QUESTIONS)[number], string> = {
  'Which products will run out next week?':
    'Based on current sell-through and on-hand quantities, these SKUs may stock out within 7 days:\n\n• Wireless Mouse (SKU WM-001) — ~4 days at current rate\n• USB-C Hub (SKU UCH-014) — ~6 days\n• Laptop Stand (SKU LS-008) — ~5 days\n\nRecommended action: raise POs for WM-001 and LS-008 first; UCH-014 has a pending supplier lead time of 10 days.',
  'Show dead stock items.':
    'Dead stock scan (no movement in 90+ days):\n\n• Bluetooth Speaker (SKU BS-022) — 48 units, last sold 112 days ago\n• Phone Case Bundle (SKU PCB-005) — 120 units, last sold 95 days ago\n• HDMI Cable 2m (SKU HD-003) — 200 units, last sold 140 days ago\n\nSuggested next steps: run a clearance promotion on PCB-005, consider bundling HD-003 with active SKUs, and review BS-022 for discontinuation.',
  'Predict next month demand.':
    'Demand forecast for next 30 days (trend + seasonality model):\n\n• Wireless Mouse — ~420 units (+12% vs last month)\n• USB-C Hub — ~310 units (+8%)\n• Laptop Stand — ~185 units (flat)\n• Monitor Arm — ~95 units (-5%, post-holiday dip)\n\nOverall catalog demand: +6% projected. Plan replenishment for top movers and hold safety stock on slow-movers until trend confirms.',
};

const GENERIC_MOCK_RESPONSE =
  'Thanks for your question. In a full implementation, this assistant would analyze live inventory, sales history, and supplier data to answer manager queries in real time.\n\nFor now, try one of the suggested prompts above to see sample mock insights.';

function matchMockResponse(question: string): string {
  const normalized = question.trim().toLowerCase();
  const match = SUGGESTED_QUESTIONS.find((q) => q.toLowerCase() === normalized);
  if (match) return MOCK_RESPONSES[match];
  return GENERIC_MOCK_RESPONSE;
}

export function FloatingChatbot() {
  const { isOpen, close, toggle } = useChatbot();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendQuestion = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isTyping) return;

    const userId = nextId.current++;
    setMessages((prev) => [...prev, { id: userId, role: 'user', text: trimmed }]);
    setInput('');
    setIsTyping(true);

    window.setTimeout(() => {
      const assistantId = nextId.current++;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          text: matchMockResponse(trimmed),
          isMock: true,
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
          aria-hidden
          onClick={close}
        />
      )}

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        {isOpen && (
          <div
            className="flex w-[min(100vw-2.5rem,380px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
            role="dialog"
            aria-label="Smart Inventory Assistant"
          >
            <div className="flex items-start justify-between gap-3 bg-gradient-to-r from-sidebar to-brand px-4 py-3.5 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Smart Inventory Assistant</p>
                  <p className="text-xs text-white/75">Demo · mock responses</p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
                aria-label="Close assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-amber-100 bg-amber-50 px-3 py-2.5">
              <p className="text-xs leading-relaxed text-amber-900">{MOCK_DISCLAIMER}</p>
            </div>

            <div ref={listRef} className="flex max-h-72 min-h-48 flex-1 flex-col gap-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
                  Ask about stock levels, dead stock, or demand forecasts — sample mock answers are ready below.
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-brand text-white'
                        : 'border border-mint/30 bg-mint/5 text-gray-700'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        Mock response
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    Assistant is typing…
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 px-3 py-2">
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendQuestion(q)}
                    disabled={isTyping}
                    className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-left text-[11px] text-gray-600 transition hover:border-brand/30 hover:bg-brand/5 hover:text-brand disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <form
              className="flex gap-2 border-t border-gray-100 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                sendQuestion(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="flex items-center gap-1.5 rounded-xl bg-sidebar px-3.5 py-2 text-sm font-medium text-white transition hover:bg-sidebar/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isTyping ? <ButtonSpinner /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        )}

        <button
          type="button"
          onClick={toggle}
          className={`group flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition hover:scale-105 hover:shadow-xl ${
            isOpen
              ? 'bg-gray-800 text-white'
              : 'bg-gradient-to-br from-sidebar to-brand text-white'
          }`}
          aria-label={isOpen ? 'Close assistant' : 'Open Smart Inventory Assistant'}
          title="Smart Inventory Assistant"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <MessageCircle className="h-6 w-6 group-hover:hidden" />
              <Sparkles className="hidden h-6 w-6 group-hover:block" />
            </>
          )}
        </button>
      </div>
    </>
  );
}
