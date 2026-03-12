import React, { useState, useRef, useEffect } from 'react';
import { TopNav } from '../TopNav';
import { Bot, Send, Trash2 } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useT } from '../../../../i18n/useT';

export default function AIAssistantPage() {
  const { lang } = useTheme();
  const t = useT(lang);
  const WELCOME_MSG = {
    id: 0,
    role: 'assistant',
    content: t('ai.welcome'),
  };
  const PROMPTS = [
    t('ai.prompt1'), t('ai.prompt2'), t('ai.prompt3'), t('ai.prompt4'),
  ];
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    const userMsg = { id: Date.now(), role: 'user', content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', content: data.response || t('ai.noResponse') }]);
    } catch {
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', content: t('ai.errorOccurred') }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <div className="flex flex-col min-h-full bg-dash-bg">
      <TopNav title={t('ai.title')} />
      <main className="flex-1 flex flex-col p-6 gap-4" style={{ maxHeight: 'calc(100vh - 56px)' }}>

        {/* Header */}
        <div className="bg-dash-card border border-dash-border rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dash-primary/10 flex items-center justify-center">
              <Bot size={22} className="text-dash-primary" />
            </div>
            <div>
              <p className="text-dash-text" style={{ fontSize: '14px', fontWeight: 600 }}>{t('ai.assistantName')}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-dash-text-muted" style={{ fontSize: '11px' }}>{t('ai.online')}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setMessages([WELCOME_MSG])}
            className="flex items-center gap-1.5 text-dash-text-muted hover:text-red-400 transition-colors"
            style={{ fontSize: '12px' }}
          >
            <Trash2 size={14} />
            {t('ai.clear')}
          </button>
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="px-3 py-1.5 bg-dash-card border border-dash-border rounded-full text-dash-text-secondary hover:border-dash-primary hover:text-dash-primary transition-colors"
                style={{ fontSize: '12px' }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-dash-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={16} className="text-dash-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-dash-primary text-white rounded-br-sm'
                    : 'bg-dash-card border border-dash-border text-dash-text rounded-bl-sm'
                }`}
                style={{ fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-line' }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-dash-primary/10 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-dash-primary" />
              </div>
              <div className="bg-dash-card border border-dash-border px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-dash-primary rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 bg-dash-card border border-dash-border rounded-xl p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ai.placeholder')}
            rows={1}
            className="flex-1 bg-transparent text-dash-text placeholder-dash-text-muted outline-none resize-none px-2 py-1"
            style={{ fontSize: '13px', lineHeight: '1.5' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-dash-primary text-white disabled:opacity-40 hover:bg-dash-primary/90 transition-colors shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </main>
    </div>
  );
}
