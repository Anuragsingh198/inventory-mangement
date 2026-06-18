import { useState } from 'react';
import { Bot, Send } from 'lucide-react';
import { ErrorState, LoadingSkeleton, PageCard, PageHeader } from '../components';
import { useEnterpriseMutations } from '../hooks/useEnterprise';

export function AIAssistantPage() {
  const [question, setQuestion] = useState('Which products will run out next week?');
  const { askAI } = useEnterpriseMutations();
  const result = askAI.data;

  return (
    <div>
      <PageHeader title="Smart Inventory Assistant" />
      <PageCard>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
          />
          <button
            type="button"
            onClick={() => askAI.mutate(question)}
            disabled={askAI.isPending}
            className="flex items-center gap-2 rounded-lg bg-sidebar px-4 py-2 text-sm font-medium text-white hover:bg-sidebar/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Ask
          </button>
        </div>

        {askAI.isPending && <LoadingSkeleton />}
        {askAI.error && <ErrorState message="Failed to get AI response" />}

        {result && (
          <div className="mt-6 rounded-lg border border-mint/30 bg-mint/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sidebar">
              <Bot className="h-5 w-5" />
              <span className="font-medium">Assistant</span>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-700">{result.answer}</pre>
          </div>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {[
            'Which products will run out next week?',
            'Show dead stock items.',
            'Predict next month demand.',
            'Show near expiry batches.',
          ].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => { setQuestion(q); askAI.mutate(q); }}
              className="rounded-lg border border-gray-100 px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
            >
              {q}
            </button>
          ))}
        </div>
      </PageCard>
    </div>
  );
}
