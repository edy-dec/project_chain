import React, { useState, useRef, useEffect } from 'react';
import chatbotService from '../../services/chatbotService';
import { useT } from '../../i18n/useT';
import './ChatbotWidget.css';

export default function ChatbotWidget() {
  const [lang, setLang] = useState(() => localStorage.getItem('chain-lang') || 'RO');
  const t = useT(lang);

  useEffect(() => {
    const check = () => {
      const current = localStorage.getItem('chain-lang') || 'RO';
      setLang(prev => prev !== current ? current : prev);
    };
    window.addEventListener('storage', check);
    const id = setInterval(check, 1000);
    return () => { window.removeEventListener('storage', check); clearInterval(id); };
  }, []);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: '' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Keep welcome message in sync with language
  const welcomeText = t('chatbot.welcome');
  useEffect(() => {
    setMessages(prev => [{ ...prev[0], content: welcomeText }, ...prev.slice(1)]);
  }, [welcomeText]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await chatbotService.chat(
        nextMessages.filter(m => m.role !== 'system')
      );
      const reply = res.data?.data?.reply || res.data?.reply || t('chatbot.noResponse');
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: t('chatbot.error') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => setMessages([{ role: 'assistant', content: t('chatbot.welcome') }]);

  return (
    <div className={`chatbot-widget ${open ? 'open' : ''}`}>
      {/* Chat Panel */}
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-logo">⛓</div>
              <div>
                <div className="chatbot-title">{t('chatbot.title')}</div>
                <div className="chatbot-subtitle">{t('chatbot.subtitle')}</div>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button className="chatbot-icon-btn" title={t('chatbot.clearChat')} onClick={clearChat}>🗑</button>
              <button className="chatbot-icon-btn" title={t('chatbot.close')} onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg ${msg.role}`}>
                {msg.role === 'assistant' && <div className="chatbot-avatar">⛓</div>}
                <div className="chatbot-bubble">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="chatbot-msg assistant">
                <div className="chatbot-avatar">⛓</div>
                <div className="chatbot-bubble chatbot-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chatbot-input-area">
            <textarea
              ref={inputRef}
              className="chatbot-input"
              placeholder={t('chatbot.placeholder')}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              className="chatbot-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              aria-label={t('chatbot.send')}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        className="chatbot-toggle"
        onClick={() => setOpen(o => !o)}
        aria-label={t('chatbot.hrAssistant')}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
