import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Minimize2 } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { useT } from '../../../i18n/useT';

export function ChatBot() {
  const { lang } = useTheme();
  const t = useT(lang);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: '' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Keep welcome message in sync with language
  const welcomeContent = t('chatEmbed.welcome');
  useEffect(() => {
    setMessages(prev => [{ ...prev[0], content: welcomeContent }, ...prev.slice(1)]);
  }, [welcomeContent]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: data.response || t('chatEmbed.sorry') },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: t('chatEmbed.error') },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-dash-primary text-white shadow-lg flex items-center justify-center hover:bg-dash-primary/90 transition-colors z-50"
        >
          <Bot size={22} />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 w-80 bg-dash-card border border-dash-border rounded-xl shadow-xl flex flex-col z-50 overflow-hidden" style={{ height: '420px' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dash-border bg-dash-primary/10">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-dash-primary" />
              <span className="text-dash-text" style={{ fontSize: '14px', fontWeight: 600 }}>{t('chatEmbed.title')}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-dash-text-muted hover:bg-dash-sidebar-hover transition-colors"
              >
                <Minimize2 size={14} />
              </button>
              <button
                onClick={() => { setOpen(false); setMessages([{ id: 1, role: 'assistant', content: t('chatEmbed.welcome') }]); }}
                className="w-7 h-7 flex items-center justify-center rounded-md text-dash-text-muted hover:bg-dash-sidebar-hover transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl ${
                    msg.role === 'user'
                      ? 'bg-dash-primary text-white rounded-br-sm'
                      : 'bg-dash-sidebar text-dash-text rounded-bl-sm'
                  }`}
                  style={{ fontSize: '13px', lineHeight: '1.5' }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-dash-sidebar px-3 py-2 rounded-xl rounded-bl-sm text-dash-text-muted" style={{ fontSize: '13px' }}>
                  {t('chatEmbed.typing')}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-dash-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chatEmbed.placeholder')}
              className="flex-1 bg-dash-sidebar border border-dash-border rounded-lg px-3 py-1.5 text-dash-text placeholder-dash-text-muted outline-none focus:border-dash-primary transition-colors"
              style={{ fontSize: '13px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-dash-primary text-white disabled:opacity-40 hover:bg-dash-primary/90 transition-colors shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
