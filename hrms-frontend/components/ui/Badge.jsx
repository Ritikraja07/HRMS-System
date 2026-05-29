'use client';

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const cls = {
    default: 'badge badge-gray',
    primary: 'badge badge-blue',
    success: 'badge badge-green',
    warning: 'badge badge-yellow',
    danger: 'badge badge-red',
    info: 'badge badge-blue',
    orange: 'badge badge-orange',
    purple: 'badge badge-purple',
  };

  const sizes = {
    xs: { padding: '1px 6px', fontSize: 10 },
    sm: { padding: '2px 8px', fontSize: 11.5 },
    md: { padding: '4px 10px', fontSize: 12.5 },
  };

  return (
    <span className={`${cls[variant] || 'badge badge-gray'} ${className}`} style={sizes[size]}>
      {children}
    </span>
  );
};

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 16, md: 28, lg: 44 };
  const s = sizes[size] || 28;
  return (
    <svg
      width={s} height={s}
      viewBox="0 0 24 24" fill="none"
      className={`animate-spin ${className}`}
      style={{ color: 'var(--color-primary)' }}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
};

export const LoadingScreen = ({ message = 'Loading...' }) => (
  <div style={{
    minHeight: '100vh', background: 'var(--color-bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <Spinner size="md" />
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>{message}</p>
    </div>
  </div>
);

export const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const sizes = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64, '2xl': 80 };
  const px = sizes[size] || 40;
  const initials = (name || 'U').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=2563eb&color=fff&size=128&bold=true`;

  return (
    <div style={{ width: px, height: px, borderRadius: px / 4, overflow: 'hidden', flexShrink: 0, background: '#dbeafe' }} className={className}>
      <img
        src={src || fallbackSrc}
        alt={name || 'User'}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={e => { e.target.src = fallbackSrc; }}
      />
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children, size = 'md', className = '' }) => {
  if (!isOpen) return null;

  const maxWidths = { sm: 440, md: 560, lg: 720, xl: 900, full: 1100 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className={`fade-in ${className}`}
        style={{
          position: 'relative', width: '100%', maxWidth: maxWidths[size] || 560,
          background: 'var(--color-card)', borderRadius: 14,
          border: '1px solid var(--color-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px', borderBottom: '1px solid var(--color-border)',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{title}</h2>
            <button
              onClick={onClose}
              style={{
                padding: 6, borderRadius: 6, border: 'none',
                background: 'transparent', cursor: 'pointer',
                color: 'var(--color-text-muted)', display: 'flex',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        )}
        <div style={{ padding: 24, maxHeight: '75vh', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
};

export default Badge;
