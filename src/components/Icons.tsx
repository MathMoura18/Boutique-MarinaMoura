type P = { className?: string }

export const InstagramIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const WhatsappIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z" strokeLinejoin="round" />
    <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .8c-1-.4-2.3-1.7-2.7-2.7l.8-1-1-2z" fill="currentColor" stroke="none" />
  </svg>
)

export const PixIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M17.6 16.9a2.9 2.9 0 0 1-2-.8l-2.9-2.9a.55.55 0 0 0-.8 0l-2.9 2.9a2.9 2.9 0 0 1-2 .8H6.4l3.7 3.7a2.7 2.7 0 0 0 3.8 0l3.7-3.7zM7 7.1a2.9 2.9 0 0 1 2 .8l2.9 2.9c.2.2.6.2.8 0L15.6 8a2.9 2.9 0 0 1 2-.8h.6l-3.7-3.7a2.7 2.7 0 0 0-3.8 0L6.4 7.1zm13.6 3L18.4 8h-.8a1.9 1.9 0 0 0-1.3.6L13.4 11.5a1.9 1.9 0 0 1-2.7 0L7.8 8.6A1.9 1.9 0 0 0 6.5 8h-1l-2.1 2.1a2.7 2.7 0 0 0 0 3.8L5.5 16h1a1.9 1.9 0 0 0 1.3-.6l2.9-2.9a1.9 1.9 0 0 1 2.7 0l2.9 2.9a1.9 1.9 0 0 0 1.3.5h.8l2.2-2.1a2.7 2.7 0 0 0 0-3.8z" />
  </svg>
)
