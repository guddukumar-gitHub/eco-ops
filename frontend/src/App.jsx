import { useEffect, useRef, useState } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/chat';

const suggestions = [
  { title: 'Office hours', prompt: 'What are the usual office hours?' },
  { title: 'Team policies', prompt: 'Where can I find the team policies?' },
  { title: 'Developer guide', prompt: 'What should I know about the developer guidelines?' },
];

function LeafMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="brand-mark">
      <path d="M25.7 5.2c-8.1.1-14.2 1.8-17.4 6.1-2.1 2.8-1.8 6.6.5 8.6 2.4 2.1 6.1 1.7 8.5-.5 4.2-3.8 5.8-9.1 8.4-14.2Z" />
      <path d="M6.1 27c2.5-7.7 7.3-12.5 14-16.1" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="sparkle-icon">
      <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
      <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="send-icon">
      <path d="M10 15V4m0 0L5.5 8.5M10 4l4.5 4.5" />
    </svg>
  );
}

function SourceIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="source-icon">
      <path d="M5 2.75h5l3 3v9.5H5z" />
      <path d="M10 2.75v3h3M7.5 9h3M7.5 11.5h3" />
    </svg>
  );
}

function ThemeIcon({ theme }) {
  return theme === 'dark' ? (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="theme-icon">
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 1.75v1.5m0 13.5v1.5m8.25-8.25h-1.5m-13.5 0h-1.5m14.08-5.83-1.06 1.06M5.23 14.77l-1.06 1.06m11.66 0-1.06-1.06M5.23 5.23 4.17 4.17" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="theme-icon">
      <path d="M16.7 12.3A7.2 7.2 0 0 1 7.7 3.3a7.2 7.2 0 1 0 9 9Z" />
    </svg>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = window.localStorage.getItem('ecoops-theme');
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    } catch (error) {
      console.warn('Unable to read saved theme preference:', error);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const conversationRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem('ecoops-theme', theme);
    } catch (error) {
      console.warn('Unable to save theme preference:', error);
    }
  }, [theme]);

  useEffect(() => {
    const conversation = conversationRef.current;
    conversation?.scrollTo({ top: conversation.scrollHeight, behavior: 'smooth' });
  }, [chatHistory, loading]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.style.height = 'auto';
    const maxHeight = Number.parseFloat(getComputedStyle(input).maxHeight);
    input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`;
    input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [question]);

  const sendQuestion = async (rawQuestion, { includeUser = true } = {}) => {
    const userQuery = rawQuestion.trim();
    if (!userQuery || loading) return;

    if (includeUser) {
      setChatHistory((previous) => [...previous, { id: crypto.randomUUID(), sender: 'user', text: userQuery }]);
      setQuestion('');
    }
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQuery }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `The server returned an error (${response.status}).`);
      }
      if (typeof data.answer !== 'string' || !data.answer.trim()) {
        throw new Error('The server returned an empty answer. Please try again.');
      }

      setChatHistory((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          sender: 'assistant',
          text: data.answer,
          source: typeof data.source_file === 'string' ? data.source_file : '',
        },
      ]);
    } catch (error) {
      console.error('Chat request failed:', error);
      setChatHistory((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          sender: 'assistant',
          text: error instanceof Error ? error.message : 'The request failed. Please try again.',
          retryQuestion: userQuery,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendQuestion(question);
  };

  const startNewChat = () => {
    setChatHistory([]);
    setQuestion('');
    inputRef.current?.focus();
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="EcoOps home">
          <span className="brand-icon"><LeafMark /></span>
          <span className="brand-copy">
            <span className="brand-name">ecoops</span>
            <span className="brand-caption">KNOWLEDGE ASSISTANT</span>
          </span>
        </a>
        <div className="topbar-right">
          <span className="service-status"><span className="status-dot" />Local workspace</span>
          <button
            className="theme-toggle"
            type="button"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            onClick={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
          >
            <ThemeIcon theme={theme} />
          </button>
          <button className="new-chat-button" type="button" aria-label="New chat" onClick={startNewChat} disabled={loading}>
            <span aria-hidden="true">+</span>
            <span>New chat</span>
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="chat-panel" aria-label="EcoOps knowledge assistant">
          <div className="conversation" ref={conversationRef} aria-live="polite" aria-relevant="additions text">
            {chatHistory.length === 0 ? (
              <div className="welcome">
                <div className="welcome-mark"><SparkleIcon /></div>
                <p className="eyebrow">YOUR WORKPLACE, IN ONE PLACE</p>
                <h1>Good work starts<br />with <span>good answers.</span></h1>
                <p className="welcome-description">
                  Ask EcoOps about workplace policies, office information, or developer guidance.
                </p>
                <div className="suggestions" aria-label="Suggested questions">
                  {suggestions.map((item) => (
                    <button
                      className="suggestion-card"
                      key={item.title}
                      type="button"
                      onClick={() => sendQuestion(item.prompt)}
                      disabled={loading}
                    >
                      <span>{item.title}</span>
                      <span className="suggestion-prompt">{item.prompt}</span>
                      <span className="suggestion-arrow" aria-hidden="true">↗</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="message-list">
                {chatHistory.map((message) => (
                  <article
                    className={`message message-${message.sender}`}
                    key={message.id}
                  >
                    {message.sender === 'assistant' && (
                      <span className="assistant-avatar"><LeafMark /></span>
                    )}
                    <div className="message-content">
                      <span className="message-author">{message.sender === 'user' ? 'You' : 'EcoOps'}</span>
                      <div className={`message-bubble${message.retryQuestion ? ' message-error' : ''}`}>
                        <p>{message.text}</p>
                        {message.source && (
                          <div className="source-label">
                            <SourceIcon />
                            <span>Source</span>
                            <span className="source-name">{message.source}</span>
                          </div>
                        )}
                        {message.retryQuestion && (
                          <button
                            className="retry-button"
                            type="button"
                            onClick={() => sendQuestion(message.retryQuestion, { includeUser: false })}
                            disabled={loading}
                          >
                            Try again
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
                {loading && (
                  <div className="typing-indicator" role="status">
                    <span className="assistant-avatar"><LeafMark /></span>
                    <span className="typing-dots"><i /><i /><i /></span>
                    <span className="sr-only">EcoOps is preparing an answer</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="composer-area">
            <form className="composer" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="question-input">Ask EcoOps a question</label>
              <textarea
                id="question-input"
                ref={inputRef}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendQuestion(question);
                  }
                }}
                placeholder="Ask anything about your workplace..."
                rows={1}
                disabled={loading}
              />
              <button
                className="send-button"
                type="submit"
                aria-label="Send message"
                disabled={loading || !question.trim()}
              >
                <SendIcon />
              </button>
            </form>
            <p className="composer-hint">AI can make mistakes. Check important information with your team.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
