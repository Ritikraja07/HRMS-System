'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '../../components/ui/AppLayout';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { getSocket } from '../../lib/socket';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { getAvatarUrl } from '../../utils/formatters';

const fmtTime = ts => ts ? new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
const fmtSidebarTime = ts => {
  if (!ts) return '';
  const d = new Date(ts), now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const isImage = type => type?.startsWith('image/');

const CSS = `
  .comm-wrap {
    display: flex; border-radius: 16px; overflow: hidden;
    box-shadow: var(--shadow-elevated); border: 1px solid var(--color-border);
    height: calc(100vh - 112px); min-height: 500px; background: var(--color-card);
  }
  .comm-sidebar {
    width: 320px; min-width: 260px; display: flex; flex-direction: column;
    background: var(--color-card); border-right: 1px solid var(--color-border); overflow: hidden;
  }
  .comm-chat { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; background: var(--color-bg-subtle); position: relative; }
  .proj-item {
    display: flex; align-items: center; gap: 12px; padding: 13px 16px;
    cursor: pointer; transition: background .15s; border-bottom: 1px solid var(--color-border); position: relative;
  }
  .proj-item:hover { background: var(--color-bg-hover); }
  .proj-item.active { background: var(--color-primary-light); border-left: 3px solid var(--color-primary); padding-left: 13px; }
  .unread-badge {
    min-width: 20px; height: 20px; background: var(--color-primary); color: #fff;
    border-radius: 10px; font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; padding: 0 5px; flex-shrink: 0;
  }
  .chat-messages { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; }
  .chat-messages::-webkit-scrollbar { width: 5px; }
  .chat-messages::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
  .msg-bubble {
    min-width: 90px; max-width: 65%; padding: 8px 12px 4px;
    border-radius: 12px; font-size: 14px; line-height: 1.55; word-break: break-word;
  }
  .msg-own { background: var(--color-primary-light); border-radius: 14px 2px 14px 14px; }
  .msg-other { background: var(--color-card); border-radius: 2px 14px 14px 14px; box-shadow: var(--shadow-card); }
  .msg-meta { display: flex; justify-content: flex-end; align-items: center; gap: 3px; white-space: nowrap; margin-top: 2px; }
  .msg-time { font-size: 10px; color: var(--color-text-light); }
  .date-pill { text-align: center; margin: 12px 0 6px; }
  .date-pill span { background: var(--color-primary-light); color: var(--color-primary); font-size: 11px; font-weight: 600; padding: 3px 14px; border-radius: 20px; }
  .sb-search { background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.2); border-radius: 10px; padding: 9px 14px; font-size: 13.5px; width: 100%; outline: none; color: #fff; }
  .sb-search::placeholder { color: rgba(255,255,255,.55); }
  .chat-input {
    flex: 1; background: var(--color-card); border: 1px solid var(--color-border);
    border-radius: 22px; padding: 10px 16px; font-size: 14px; resize: none; outline: none;
    max-height: 120px; font-family: inherit; color: var(--color-text); line-height: 1.5;
  }
  .chat-input::placeholder { color: var(--color-text-light); }
  .chat-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
  .send-btn {
    width: 46px; height: 46px; border-radius: 50%; border: none;
    background: var(--color-primary); color: #fff; cursor: pointer;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: all .2s; box-shadow: 0 2px 8px rgba(37,99,235,.3);
  }
  .send-btn:hover:not(:disabled) { background: var(--color-primary-hover); transform: scale(1.06); }
  .send-btn:disabled { background: var(--color-text-light); box-shadow: none; cursor: not-allowed; }
  .attach-btn {
    width: 40px; height: 40px; border-radius: 50%; border: none;
    background: transparent; color: var(--color-text-muted); cursor: pointer;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .2s;
  }
  .attach-btn:hover { background: var(--color-primary-light); color: var(--color-primary); }
  .menu-btn {
    width: 36px; height: 36px; border-radius: 50%; border: none; background: transparent;
    color: rgba(255,255,255,.8); cursor: pointer;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .15s;
  }
  .menu-btn:hover { background: rgba(255,255,255,.15); color: #fff; }
  .dropdown {
    position: absolute; top: calc(100% + 6px); right: 0; background: var(--color-card);
    border-radius: 10px; box-shadow: var(--shadow-elevated); border: 1px solid var(--color-border);
    min-width: 190px; z-index: 100; overflow: hidden;
  }
  .dropdown-item {
    display: flex; align-items: center; gap: 10px; padding: 11px 16px; font-size: 13.5px;
    cursor: pointer; border: none; background: transparent; width: 100%;
    text-align: left; color: var(--color-text); transition: background .12s;
  }
  .dropdown-item:hover { background: var(--color-bg-hover); }
  .dropdown-item.danger { color: var(--color-danger); }
  .dropdown-item.danger:hover { background: var(--color-danger-bg); }
  .media-preview {
    margin: 8px 16px; background: var(--color-bg-subtle); border-radius: 12px;
    padding: 10px; border: 1px solid var(--color-border); display: flex; align-items: center; gap: 10px;
  }
  .media-preview img { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: var(--color-text-muted); }
  .typing-row { display: flex; align-items: center; gap: 8px; padding: 2px 4px; min-height: 24px; }
  .typing-dots { display: flex; gap: 3px; align-items: center; }
  .typing-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-text-muted); animation: tBounce 1.2s ease-in-out infinite; }
  .typing-dot:nth-child(2) { animation-delay: .2s; }
  .typing-dot:nth-child(3) { animation-delay: .4s; }
  @keyframes tBounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-5px); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .8s linear infinite; }
  .scroll-to-bottom {
    position: absolute; bottom: 80px; right: 24px; width: 38px; height: 38px;
    border-radius: 50%; background: var(--color-primary); color: #fff; border: none;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    box-shadow: var(--shadow-elevated); transition: transform .2s; z-index: 10;
  }
  .scroll-to-bottom:hover { transform: scale(1.1); }
  .chat-menu-toggle { display: none; }
  @media (max-width: 768px) {
    .comm-sidebar { position: absolute; left: 0; top: 0; bottom: 0; z-index: 20; width: 280px; transform: translateX(-100%); transition: transform .25s ease; }
    .comm-sidebar.mobile-open { transform: translateX(0); box-shadow: 4px 0 20px rgba(0,0,0,.15); }
    .comm-wrap { position: relative; border-radius: 12px; height: calc(100vh - 120px); }
    .chat-menu-toggle { display: flex; }
  }
`;

function CommunicationPageInner() {
  const { user, session } = useAuth();
  const { on, emit, joinRoom } = useSocket(user?.id, session?.access_token);
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('project');

  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMsg, setLastMsg] = useState({});
  const [mediaFile, setMediaFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [showMenu, setShowMenu] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const activeProjectRef = useRef(null);
  const projectsRef = useRef([]);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => { activeProjectRef.current = activeProject; }, [activeProject]);
  useEffect(() => { projectsRef.current = projects; }, [projects]);

  const scrollToBottom = useCallback((instant = false) => {
    const el = chatRef.current;
    if (!el) return;
    if (instant) {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  const isNearBottom = useCallback(() => {
    const el = chatRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  // Load projects once — honour ?project=ID from URL if present
  useEffect(() => {
    api.get('/api/projects').then(res => {
      if (res.data.success) {
        const list = res.data.data.projects || [];
        setProjects(list);
        if (list.length > 0) {
          const target = initialProjectId ? list.find(p => p.id === initialProjectId) : null;
          setActiveProject(target || list[0]);
        }
      }
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally run once on mount

  // Join all project rooms; rejoin on socket reconnect
  useEffect(() => {
    if (projects.length === 0) return;
    const socket = getSocket();
    const joinAll = () => projectsRef.current.forEach(p => emit('project:join', { projectId: p.id }));
    if (socket.connected) joinAll();
    socket.on('connect', joinAll);
    return () => socket.off('connect', joinAll);
  }, [projects.length, emit]);

  // Load messages when active project changes
  useEffect(() => {
    if (!activeProject) return;
    setLoading(true);
    setMessages([]);
    setTypingUsers({});
    setUnreadCounts(prev => ({ ...prev, [activeProject.id]: 0 }));

    api.get(`/api/messages/${activeProject.id}?limit=50`).then(res => {
      if (res.data.success) {
        setMessages(res.data.data.messages || []);
        setTimeout(() => scrollToBottom(true), 30);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [activeProject?.id]);

  // Incoming messages via socket
  useEffect(() => {
    const unsub = on('message:new', (msg) => {
      const pid = msg.project_id;
      const isActive = activeProjectRef.current?.id === pid;

      if (isActive) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (isNearBottom()) {
          setTimeout(() => scrollToBottom(false), 30);
        } else {
          setShowScrollBtn(true);
        }
      } else {
        setUnreadCounts(prev => ({ ...prev, [pid]: (prev[pid] || 0) + 1 }));
      }

      setLastMsg(prev => ({ ...prev, [pid]: { text: msg.content || '📎 Attachment', time: msg.created_at } }));
      setProjects(prev => {
        const idx = prev.findIndex(p => p.id === pid);
        if (idx === -1) return prev;
        const copy = [...prev];
        const [proj] = copy.splice(idx, 1);
        return [proj, ...copy];
      });
    });
    return unsub;
  }, [on, scrollToBottom, isNearBottom]);

  // Typing indicators from socket
  useEffect(() => {
    const unsub = on('typing:update', ({ userId, userName, isTyping }) => {
      if (userId === user?.id) return;
      setTypingUsers(prev => {
        const next = { ...prev };
        if (isTyping) next[userId] = userName || 'Someone';
        else delete next[userId];
        return next;
      });
    });
    return unsub;
  }, [on, user?.id]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll-to-bottom button visibility
  const handleScroll = useCallback(() => {
    setShowScrollBtn(!isNearBottom());
  }, [isNearBottom]);

  const handleTyping = useCallback(() => {
    const pid = activeProjectRef.current?.id;
    if (!pid || !user) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emit('typing:start', { projectId: pid, userId: user.id, userName: user.full_name?.split(' ')[0] });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      emit('typing:stop', { projectId: pid, userId: user.id });
    }, 1500);
  }, [emit, user]);

  const handleFilePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large. Max 10MB.'); return; }
    setMediaFile({ file, previewUrl: isImage(file.type) ? URL.createObjectURL(file) : null, type: file.type, name: file.name });
  };

  const clearMedia = () => {
    if (mediaFile?.previewUrl) URL.revokeObjectURL(mediaFile.previewUrl);
    setMediaFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async () => {
    if ((!input.trim() && !mediaFile) || !activeProject || sending) return;
    setSending(true);

    // Stop typing indicator
    if (isTypingRef.current) {
      isTypingRef.current = false;
      clearTimeout(typingTimerRef.current);
      emit('typing:stop', { projectId: activeProject.id, userId: user?.id });
    }

    const content = input.trim();
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      let file_url = null, file_name = null, file_type = null;

      if (mediaFile) {
        setUploading(true);
        const reader = new FileReader();
        const base64 = await new Promise((res, rej) => { reader.onload = () => res(reader.result); reader.onerror = rej; reader.readAsDataURL(mediaFile.file); });
        const up = await api.post(`/api/messages/${activeProject.id}/upload`, { file_base64: base64, file_name: mediaFile.name, file_type: mediaFile.type });
        if (up.data.success) { file_url = up.data.data.file_url; file_name = up.data.data.file_name; file_type = mediaFile.type; }
        setUploading(false);
        clearMedia();
      }

      const res = await api.post(`/api/messages/${activeProject.id}`, {
        content: content || undefined, file_url, file_name, file_type,
        message_type: file_url ? 'file' : 'text',
      });

      // Show message immediately from HTTP response; socket will also fire but dedup handles it
      if (res.data.success) {
        const newMsg = res.data.data.message;
        setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        setTimeout(() => scrollToBottom(false), 30);
        setShowScrollBtn(false);
      }
    } catch {
      toast.error('Failed to send message');
      if (content) setInput(content);
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const switchProject = (p) => {
    setActiveProject(p);
    setUnreadCounts(prev => ({ ...prev, [p.id]: 0 }));
    setTypingUsers({});
    setMobileSidebarOpen(false);
  };

  const filtered = projects.filter(p => p.name?.toLowerCase().includes(sidebarSearch.toLowerCase()));

  const grouped = messages.reduce((g, m) => {
    const date = new Date(m.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    (g[date] = g[date] || []).push(m);
    return g;
  }, {});

  const typingList = Object.values(typingUsers);
  const typingText = typingList.length === 1 ? `${typingList[0]} is typing`
    : typingList.length === 2 ? `${typingList[0]} and ${typingList[1]} are typing`
    : typingList.length > 2 ? 'Several people are typing' : '';

  return (
    <AppLayout title="Project Communication">
      <style>{CSS}</style>

      <div className="comm-wrap">

        {/* ── Sidebar ── */}
        <div className={`comm-sidebar${mobileSidebarOpen ? ' mobile-open' : ''}`}>

          {/* Sidebar Header */}
          <div style={{ padding: '16px 16px 12px', background: 'var(--color-primary)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <img
                src={getAvatarUrl(user?.avatar_url, user?.full_name)}
                alt="me"
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,.3)' }}
              />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, flex: 1 }}>Projects</span>
              <span style={{ background: 'rgba(255,255,255,.2)', color: '#fff', borderRadius: 8, padding: '3px 9px', fontSize: 11, fontWeight: 600 }}>
                {projects.length}
              </span>
            </div>
            <input
              className="sb-search"
              placeholder="Search projects..."
              value={sidebarSearch}
              onChange={e => setSidebarSearch(e.target.value)}
            />
          </div>

          {/* Project List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map(p => {
              const isActive = activeProject?.id === p.id;
              const unread = unreadCounts[p.id] || 0;
              const lm = lastMsg[p.id];
              const preview = lm?.text || (p.description ? p.description.slice(0, 40) : 'No messages yet');
              const timeLabel = lm?.time ? fmtSidebarTime(lm.time) : fmtSidebarTime(p.updated_at);

              return (
                <div key={p.id} className={`proj-item${isActive ? ' active' : ''}`} onClick={() => switchProject(p)}>
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                    background: isActive ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isActive ? '#fff' : 'var(--color-text-muted)', fontWeight: 800, fontSize: 18, position: 'relative',
                  }}>
                    {p.name?.[0]?.toUpperCase()}
                    <span style={{
                      position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%',
                      background: p.status === 'active' ? 'var(--color-success)' : 'var(--color-warning)',
                      border: '2px solid var(--color-card)',
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: unread ? 700 : 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </p>
                      <span style={{ fontSize: 11, color: unread ? 'var(--color-primary)' : 'var(--color-text-light)', flexShrink: 0, marginLeft: 8, fontWeight: unread ? 700 : 400 }}>
                        {timeLabel}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, fontSize: 12.5, color: unread ? 'var(--color-text)' : 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: unread ? 600 : 400 }}>
                        {preview}
                      </p>
                      {unread > 0 && <span className="unread-badge">{unread > 99 ? '99+' : unread}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="empty-state" style={{ padding: 40 }}>
                <span style={{ fontSize: 36 }}>📁</span>
                <p style={{ fontSize: 13 }}>No projects found</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile overlay */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 19 }}
          />
        )}

        {/* ── Chat Area ── */}
        <div className="comm-chat">
          {activeProject ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '12px 20px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, position: 'relative' }}>
                {/* Mobile back / menu toggle */}
                <button
                  className="menu-btn chat-menu-toggle"
                  onClick={() => setMobileSidebarOpen(v => !v)}
                  title="Projects"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                </button>

                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                  {activeProject.name?.[0]?.toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeProject.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,.75)' }}>
                    {typingText ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="typing-dots">
                          <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                        </span>
                        {typingText}
                      </span>
                    ) : (
                      <>
                        {(activeProject.project_members || []).map(m => m.user?.full_name?.split(' ')[0]).slice(0, 4).join(', ')}
                        {(activeProject.project_members?.length || 0) > 4 && ` +${(activeProject.project_members?.length || 0) - 4} more`}
                      </>
                    )}
                  </p>
                </div>

                <span style={{ background: 'rgba(255,255,255,.2)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 }}>
                  {activeProject.status?.replace(/_/g, ' ')}
                </span>

                <div ref={menuRef} style={{ position: 'relative' }}>
                  <button className="menu-btn" onClick={() => setShowMenu(v => !v)} title="More options">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                  {showMenu && (
                    <div className="dropdown">
                      <button className="dropdown-item danger" onClick={() => { setMessages([]); setShowMenu(false); toast.success('Chat cleared'); }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        Clear chat (locally)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages" ref={chatRef} onScroll={handleScroll}>
                {loading ? (
                  <div className="empty-state">
                    <div style={{ width: 36, height: 36, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading messages...</p>
                  </div>
                ) : Object.keys(grouped).length === 0 ? (
                  <div className="empty-state">
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>💬</div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>No messages yet</p>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Start the conversation!</p>
                  </div>
                ) : Object.entries(grouped).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="date-pill"><span>{date}</span></div>
                    {msgs.map((msg, idx) => {
                      const isOwn = msg.sender_id === user?.id;
                      const prevMsg = msgs[idx - 1];
                      const showAvatar = !isOwn && (idx === 0 || prevMsg?.sender_id !== msg.sender_id);
                      const showName = showAvatar;
                      const isConsecutive = idx > 0 && prevMsg?.sender_id === msg.sender_id;

                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            flexDirection: isOwn ? 'row-reverse' : 'row',
                            alignItems: 'flex-end',
                            gap: 6,
                            marginBottom: isConsecutive ? 2 : 6,
                            marginTop: showAvatar ? 10 : 0,
                          }}
                        >
                          {/* Avatar space */}
                          <div style={{ width: 30, flexShrink: 0, alignSelf: 'flex-end' }}>
                            {showAvatar && (
                              <img
                                src={getAvatarUrl(msg.sender?.avatar_url, msg.sender?.full_name)}
                                alt={msg.sender?.full_name}
                                style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                                onError={e => { e.target.src = getAvatarUrl(null, 'U'); }}
                              />
                            )}
                          </div>

                          {/* Bubble */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', maxWidth: '65%' }}>
                            {showName && (
                              <p style={{ margin: '0 0 3px 4px', fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
                                {msg.sender?.full_name}
                              </p>
                            )}
                            <div className={`msg-bubble ${isOwn ? 'msg-own' : 'msg-other'}`}>
                              {msg.message_type === 'announcement' && (
                                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-warning)', margin: '0 0 4px' }}>📢 Announcement</p>
                              )}
                              {msg.content && (
                                <p style={{ margin: 0, color: 'var(--color-text)' }}>{msg.content}</p>
                              )}
                              {msg.file_url && (
                                isImage(msg.file_type) ? (
                                  <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                                    <img src={msg.file_url} alt={msg.file_name} style={{ maxWidth: 220, maxHeight: 200, borderRadius: 8, display: 'block', marginTop: msg.content ? 6 : 0 }} />
                                  </a>
                                ) : (
                                  <a
                                    href={msg.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--color-primary)', textDecoration: 'none', marginTop: 6, background: 'var(--color-primary-light)', padding: '6px 10px', borderRadius: 8 }}
                                  >
                                    📎 {msg.file_name || 'Download file'}
                                  </a>
                                )
                              )}
                              <div className="msg-meta">
                                <span className="msg-time">{fmtTime(msg.created_at)}</span>
                                {isOwn && (
                                  <svg width="14" height="10" viewBox="0 0 16 11" fill="none">
                                    <path d="M1 5.5L5 9.5L15 1.5" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M5 5.5L9 9.5" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Scroll to bottom button */}
              {showScrollBtn && (
                <button className="scroll-to-bottom" onClick={() => { scrollToBottom(false); setShowScrollBtn(false); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              )}

              {/* Media Preview */}
              {mediaFile && (
                <div className="media-preview">
                  {mediaFile.previewUrl
                    ? <img src={mediaFile.previewUrl} alt="preview" />
                    : <div style={{ width: 56, height: 56, borderRadius: 8, background: 'var(--color-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📎</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mediaFile.name}</p>
                    <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-text-muted)' }}>{(mediaFile.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={clearMedia} style={{ background: 'var(--color-danger-bg)', border: 'none', color: 'var(--color-danger)', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              )}

              {/* Input Bar */}
              <div style={{ padding: '12px 16px', background: 'var(--color-card)', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" onChange={handleFilePick} />
                <button className="attach-btn" onClick={() => fileInputRef.current?.click()} title="Attach file">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    handleTyping();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                />
                <button
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={(!input.trim() && !mediaFile) || sending || uploading}
                  title="Send"
                >
                  {(sending || uploading)
                    ? <div className="spinner" />
                    : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )
                  }
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>💬</div>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Project Communication</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: 280, margin: 0 }}>
                Select a project from the left panel to start chatting with your team.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default function CommunicationPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--color-primary)' }}>Loading...</div>}>
      <CommunicationPageInner />
    </Suspense>
  );
}
