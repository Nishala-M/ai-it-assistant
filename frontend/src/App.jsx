import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const initialMessage = {
  role: 'assistant',
  content:
    "Hi! I'm your AI IT Troubleshooting Assistant. Tell me what went wrong, and I'll help you diagnose the issue with clear, practical steps.",
}

const quickPrompts = [
  {
    icon: '🪟',
    title: 'Windows problem',
    text: 'My Windows computer is showing an error. How can I troubleshoot it?',
  },
  {
    icon: '🌐',
    title: 'Network issue',
    text: 'My internet connection is not working. Help me troubleshoot it.',
  },
  {
    icon: '💻',
    title: 'Software error',
    text: 'An application on my computer is showing an error. How can I fix it?',
  },
  {
    icon: '🖥️',
    title: 'Hardware issue',
    text: 'A hardware device on my computer is not working properly. Help me diagnose it.',
  },
]

function MessageContent({ content }) {
  return (
    <div className="message-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          h2: ({ children }) => <h3>{children}</h3>,
          h3: ({ children }) => <h3>{children}</h3>,

          p: ({ children }) => <p>{children}</p>,

          ul: ({ children }) => <ul>{children}</ul>,

          ol: ({ children }) => <ol>{children}</ol>,

          li: ({ children }) => <li>{children}</li>,

          strong: ({ children }) => <strong>{children}</strong>,

          pre: ({ children }) => {
            const codeText = children?.props?.children

            if (!codeText || !String(codeText).trim()) {
              return null
            }

            return (
              <pre className="code-block">
                {children}
              </pre>
            )
          },

          code: ({ children, className, ...props }) => (
            <code
              className={className || 'inline-code'}
              {...props}
            >
              {children}
            </code>
          ),

          blockquote: ({ children }) => (
            <blockquote>{children}</blockquote>
          ),

          hr: () => <hr />,

          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),

          table: ({ children }) => (
            <div className="table-wrapper">
              <table>{children}</table>
            </div>
          ),

          thead: ({ children }) => <thead>{children}</thead>,

          tbody: ({ children }) => <tbody>{children}</tbody>,

          tr: ({ children }) => <tr>{children}</tr>,

          th: ({ children }) => <th>{children}</th>,

          td: ({ children }) => <td>{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function App() {
  const [messages, setMessages] = useState([initialMessage])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const chatEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [messages, loading])

  const resizeTextarea = () => {
    const textarea = textareaRef.current

    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim() || loading) return

    const userMessage = {
      role: 'user',
      content: messageText.trim(),
    }

    const newMessages = [...messages, userMessage]

    setMessages(newMessages)
    setInput('')
    setLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        message: userMessage.content,
        history: newMessages.slice(0, -1),
      })

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: response.data.reply,
        },
      ])
    } catch (error) {
      console.error(error)

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            'I couldn’t reach the AI service right now. Please make sure your backend is running and try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    resizeTextarea()
  }

  const handleQuickPrompt = (text) => {
    setInput(text)

    setTimeout(() => {
      textareaRef.current?.focus()
      resizeTextarea()
    }, 0)
  }

  const clearChat = () => {
    if (loading) return

    setMessages([initialMessage])
    setInput('')

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const hasUserMessages = messages.some((message) => message.role === 'user')

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✦</div>

          <div>
            <div className="brand-name">IT Assist</div>
            <div className="brand-subtitle">Smart troubleshooting</div>
          </div>
        </div>

        <button className="new-chat-button" onClick={clearChat}>
          <span className="new-chat-icon">＋</span>
          New conversation
        </button>

        <div className="sidebar-section">
          <div className="sidebar-label">QUICK HELP</div>

          <button
            className="sidebar-item"
            onClick={() => handleQuickPrompt(quickPrompts[0].text)}
          >
            <span>🪟</span>
            Windows
          </button>

          <button
            className="sidebar-item"
            onClick={() => handleQuickPrompt(quickPrompts[1].text)}
          >
            <span>🌐</span>
            Network
          </button>

          <button
            className="sidebar-item"
            onClick={() => handleQuickPrompt(quickPrompts[2].text)}
          >
            <span>💻</span>
            Software
          </button>

          <button
            className="sidebar-item"
            onClick={() => handleQuickPrompt(quickPrompts[3].text)}
          >
            <span>🖥️</span>
            Hardware
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="status-card">
            <span className="status-dot"></span>

            <div>
              <div className="status-title">AI service online</div>
              <div className="status-text">Ready to troubleshoot</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title">
            <div className="mobile-brand-icon">✦</div>

            <div>
              <h1>IT Troubleshooter</h1>
              <p>AI-powered technical support</p>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="online-status">
              <span className="online-dot"></span>
              Online
            </div>

            {hasUserMessages && (
              <button
                className="clear-button"
                onClick={clearChat}
                disabled={loading}
              >
                Clear chat
              </button>
            )}
          </div>
        </header>

        <section className="chat-window">
          <div className="chat-container">
            {!hasUserMessages && (
              <div className="welcome-area">
                <div className="welcome-icon">
                  <span>✦</span>
                </div>

                <div className="welcome-badge">
                  <span className="badge-dot"></span>
                  AI support assistant
                </div>

                <h2>
                  How can I help
                  <br />
                  <span>fix your IT issue?</span>
                </h2>

                <p className="welcome-description">
                  Describe an error, technical problem, or anything that isn't
                  working. I'll help you diagnose it with clear,
                  step-by-step instructions.
                </p>

                <div className="quick-grid">
                  {quickPrompts.map((prompt) => (
                    <button
                      className="quick-card"
                      key={prompt.title}
                      onClick={() => handleQuickPrompt(prompt.text)}
                    >
                      <div className="quick-card-icon">{prompt.icon}</div>

                      <div className="quick-card-content">
                        <strong>{prompt.title}</strong>
                        <span>Get troubleshooting help</span>
                      </div>

                      <span className="quick-arrow">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="messages">
              {messages.map((msg, idx) => (
                <div
                  key={`${msg.role}-${idx}`}
                  className={`message-row ${msg.role}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="avatar assistant-avatar">✦</div>
                  )}

                  <div className="message-wrapper">
                    <div className="message-meta">
                      <span>
                        {msg.role === 'user' ? 'You' : 'IT Assist'}
                      </span>

                      {msg.role === 'assistant' && (
                        <span className="verified-badge">AI</span>
                      )}
                    </div>

                    <div className="bubble">
                      <MessageContent content={msg.content} />
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="avatar user-avatar">You</div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="message-row assistant">
                  <div className="avatar assistant-avatar">✦</div>

                  <div className="message-wrapper">
                    <div className="message-meta">
                      <span>IT Assist</span>
                      <span className="verified-badge">AI</span>
                    </div>

                    <div className="bubble loading-bubble">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>

                      <span className="thinking-text">
                        Analyzing your issue...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>
        </section>

        <footer className="composer-area">
          <div className="composer">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe your IT problem..."
              rows={1}
              disabled={loading}
            />

            <button
              className="send-button"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <path
                  d="M13 6L19 12L13 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="composer-hint">
            <span>Enter to send</span>
            <span className="hint-divider">•</span>
            <span>Shift + Enter for a new line</span>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default App