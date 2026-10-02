import { useCallback, useEffect, useRef, useState } from 'react';
import {
  askChat,
  deleteDocument,
  listDocuments,
  uploadDocuments,
} from './services/api.js';
import './App.css';

const starterMessage = {
  role: 'assistant',
  content:
    'Your documents, understood. Add a few files to your library and ask me anything about them.',
  sources: [],
};

function Icon({ name, size = 18 }) {
  const paths = {
    add: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    arrow: (
      <>
        <path d="M12 19V5M5 12l7-7 7 7" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" />
        <path d="M4 16a2 2 0 0 1 2-2h14M8 7h8" />
      </>
    ),
    chat: (
      <>
        <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-4-.9L4 20l1.4-3.2A7.2 7.2 0 0 1 4 12c0-4.1 3.6-7.5 8-7.5s8 3.1 8 7z" />
        <path d="M8 12h.01M12 12h.01M16 12h.01" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    file: (
      <>
        <path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z" />
        <path d="M13 3v7h7M8 14h8M8 17h6" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4z" />
        <path d="M22 2 11 13" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
        <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4m-5 5 5-5 5 5" />
        <path d="M20 16.5v2A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-2" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function App() {
  const [messages, setMessages] = useState([starterMessage]);
  const [documents, setDocuments] = useState([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [connection, setConnection] = useState('checking');
  const [notice, setNotice] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const conversationEnd = useRef(null);

  // The document list also serves as the lightweight API connectivity check.
  const refreshDocuments = useCallback(async () => {
    try {
      const data = await listDocuments();
      setDocuments(data.documents);
      setConnection('online');
    } catch {
      setConnection('offline');
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
    // Periodic refresh picks up library changes made outside this browser session.
    const interval = window.setInterval(refreshDocuments, 30000);
    return () => window.clearInterval(interval);
  }, [refreshDocuments]);

  useEffect(() => {
    conversationEnd.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages, busy]);

  async function uploadFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setUploading(true);
    setNotice('');
    try {
      const data = await uploadDocuments(files);
      setNotice(
        `${data.documents.length} ${data.documents.length === 1 ? 'document' : 'documents'} added to your library.`
      );
      await refreshDocuments();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setUploading(false);
      // Clearing the input lets the user select the same file again after an attempt.
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    const content = question.trim();
    if (!content || busy) return;

    const nextMessages = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setQuestion('');
    setBusy(true);
    setNotice('');

    try {
      // The server receives prior turns as history and the new question separately.
      // Exclude the welcome placeholder and keep only a short recent context window.
      const history = nextMessages
        .filter(
          (message) =>
            message.role !== 'assistant' || message !== starterMessage
        )
        .slice(-8)
        .map(({ role, content: text }) => ({ role, content: text }));
      const result = await askChat(content, history.slice(0, -1));
      console.log('Received response from RAG service:', result);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: result.answer, sources: result.sources },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: `I couldn't reach the RAG service: ${error.message}`,
          sources: [],
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function removeDocument(id) {
    try {
      await deleteDocument(id);
      setDocuments((current) =>
        current.filter((document) => document.id !== id)
      );
      setNotice('Document removed from your library.');
    } catch (error) {
      setNotice(error.message);
    }
  }

  function resetConversation() {
    setMessages([starterMessage]);
    setNotice('');
  }

  return (
    <main className="workspace">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Context home">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span>
            context<span className="brand-period">.</span>
          </span>
        </a>

        <button className="new-chat" onClick={resetConversation}>
          <Icon name="add" size={17} /> <span>New conversation</span>
          <kbd>⌘ K</kbd>
        </button>

        <div className="sidebar-label">WORKSPACE</div>
        <button className="nav-item selected">
          <Icon name="chat" />
          <span>Ask your library</span>
        </button>
        <button className="nav-item" onClick={() => fileInput.current?.click()}>
          <Icon name="upload" />
          <span>Add documents</span>
        </button>

        <div className="library-heading">
          <span className="sidebar-label">YOUR SOURCES</span>
          <button
            className="icon-button add-source"
            title="Add documents"
            aria-label="Add documents"
            onClick={() => fileInput.current?.click()}
          >
            <Icon name="add" size={16} />
          </button>
        </div>
        <div className="source-list">
          {documents.length ? (
            documents.map((document) => (
              <div
                className="source-row"
                key={document.id}
                title={document.name}
              >
                <Icon name="file" size={16} />
                <span className="source-name">{document.name}</span>
                <button
                  className="icon-button remove-source"
                  aria-label={`Remove ${document.name}`}
                  title="Remove document"
                  onClick={() => removeDocument(document.id)}
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            ))
          ) : (
            <p className="empty-sources">Your sources will appear here.</p>
          )}
        </div>

        <div className="sidebar-bottom">
          <span className={`status-dot ${connection}`} />
          <span>
            {connection === 'online'
              ? 'API connected'
              : connection === 'offline'
                ? 'API unavailable'
                : 'Connecting to API'}
          </span>
          <button
            className="icon-button refresh-button"
            onClick={refreshDocuments}
            aria-label="Refresh connection"
            title="Refresh connection"
          >
            <span>↻</span>
          </button>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>Ask your library</strong>
          </div>
          <div className="topbar-right">
            <span className="model-label">
              <span className="model-dot" /> RAG assistant
            </span>
            <div className="avatar">S</div>
          </div>
        </header>

        {/* Ignore dragleave events between children so the drop overlay does not flicker. */}
        <div
          className="conversation"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            uploadFiles(event.dataTransfer.files);
          }}
        >
          {dragging && (
            <div className="drop-overlay">
              <Icon name="upload" size={28} />
              <span>Drop files to add them to your library</span>
            </div>
          )}
          {messages.length === 1 ? (
            <div className="welcome">
              <div className="welcome-eyebrow">
                <span className="welcome-star">
                  <Icon name="spark" size={16} />
                </span>{' '}
                YOUR PRIVATE KNOWLEDGE SPACE
              </div>
              <h1>
                Answers live
                <br />
                in your <em>documents.</em>
              </h1>
              <p className="welcome-copy">
                Bring your files together. Ask a question.
                <br className="desktop-break" /> Get an answer grounded in what
                you’ve shared.
              </p>

              <button
                className={`upload-zone ${uploading ? 'is-uploading' : ''}`}
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
              >
                <span className="upload-icon">
                  <Icon name="upload" size={19} />
                </span>
                <span className="upload-copy">
                  <strong>
                    {uploading
                      ? 'Adding to your library…'
                      : 'Drop files here, or browse'}
                  </strong>
                  <small>PDF, TXT, Markdown or CSV · up to 10 MB each</small>
                </span>
                <span className="upload-action">Browse files</span>
              </button>

              <div className="suggestion-label">START WITH A QUESTION</div>
              <div className="suggestions">
                {[
                  'What are the main takeaways?',
                  'Summarize the key ideas',
                  'What should I know first?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuestion(suggestion)}
                  >
                    {suggestion}
                    <span>↗</span>
                  </button>
                ))}
              </div>
              {!documents.length && (
                <div className="library-note">
                  <span className="note-line" /> Your library is ready for its
                  first source
                </div>
              )}
            </div>
          ) : (
            <div className="message-list">
              {messages.slice(1).map((message, index) => (
                <article
                  className={`message ${message.role} ${message.error ? 'message-error' : ''}`}
                  key={`${message.role}-${index}`}
                >
                  {message.role === 'assistant' && (
                    <div className="assistant-avatar">
                      <Icon name="spark" size={16} />
                    </div>
                  )}
                  <div className="message-body">
                    <div className="message-meta">
                      {message.role === 'user' ? 'You' : 'Context'}
                      <span>
                        {message.role === 'assistant'
                          ? '· GROUNDED RESPONSE'
                          : ''}
                      </span>
                    </div>
                    <p className="message-content">{message.content}</p>
                    {message.sources?.length > 0 && (
                      <div className="citations">
                        <div className="citation-heading">
                          SOURCES <span>{message.sources.length}</span>
                        </div>
                        {message.sources.map((source) => (
                          <div
                            className="citation"
                            key={`${source.number}-${source.source}`}
                          >
                            <span className="citation-number">
                              {source.number}
                            </span>
                            <div>
                              <strong>{source.source}</strong>
                              <p>
                                {source.excerpt}
                                {source.excerpt.length >= 260 ? '…' : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
              {busy && (
                <div className="typing">
                  <span />
                  <span />
                  <span /> Searching your sources
                </div>
              )}
              <div ref={conversationEnd} />
            </div>
          )}
        </div>

        <div className="composer-wrap">
          {notice && (
            <div
              className={`notice ${notice.toLowerCase().includes('couldn') || notice.toLowerCase().includes('failed') ? 'notice-error' : ''}`}
              role="status"
            >
              {notice}
              <button aria-label="Dismiss" onClick={() => setNotice('')}>
                <Icon name="close" size={14} />
              </button>
            </div>
          )}
          {messages.length === 1 && documents.length > 0 && (
            <div className="indexed-count">
              <span className="status-dot online" /> {documents.length}{' '}
              {documents.length === 1 ? 'source' : 'sources'} ready to search
            </div>
          )}
          <form className="composer" onSubmit={sendMessage}>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form.requestSubmit();
                }
              }}
              placeholder="Ask a question about your documents…"
              rows={1}
              aria-label="Ask a question"
            />
            <div className="composer-tools">
              <div className="composer-hint">
                <span>↵</span> to ask <span className="hint-divider">·</span>{' '}
                shift + ↵ for new line
              </div>
              <div className="composer-actions">
                <button
                  className="icon-button attach-button"
                  type="button"
                  title="Attach documents"
                  aria-label="Attach documents"
                  onClick={() => fileInput.current?.click()}
                >
                  <Icon name="add" size={18} />
                </button>
                <button
                  className="send-button"
                  type="submit"
                  disabled={!question.trim() || busy || connection !== 'online'}
                  aria-label="Send question"
                >
                  <Icon name="send" size={16} />
                </button>
              </div>
            </div>
          </form>
          <p className="disclaimer">
            Answers are generated from your sources. Check citations for
            context.
          </p>
        </div>
      </section>
      <input
        ref={fileInput}
        className="visually-hidden"
        type="file"
        accept=".pdf,.txt,.md,.csv"
        multiple
        onChange={(event) => uploadFiles(event.target.files)}
      />
    </main>
  );
}

export default App;
