'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Lightbulb, BookOpen } from 'lucide-react';

interface GuideItem {
  title: string;
  content: string;
}

interface AdminGuideProps {
  title: string;
  items: GuideItem[];
  /** Show a compact inline version */
  compact?: boolean;
}

/**
 * Collapsible admin guide panel — provides contextual help & examples for each admin page.
 */
export default function AdminGuide({ title, items, compact }: AdminGuideProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      marginBottom: compact ? '1rem' : '1.5rem',
      borderRadius: 'var(--radius)',
      border: '1px solid rgba(59,130,246,0.2)',
      background: 'rgba(59,130,246,0.04)',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: compact ? '0.6rem 1rem' : '0.75rem 1rem',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--info)', fontSize: compact ? '0.8rem' : '0.85rem',
          fontWeight: 600, textAlign: 'left',
        }}
      >
        <BookOpen size={compact ? 14 : 16} />
        <span style={{ flex: 1 }}>{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div style={{
          padding: '0 1rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
          animation: 'fadeIn 0.2s ease',
        }}>
          {items.map((item, i) => (
            <div key={i} style={{
              padding: '0.75rem 1rem',
              background: 'rgba(0,0,0,0.15)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '3px solid rgba(59,130,246,0.4)',
            }}>
              <div style={{
                fontSize: '0.82rem', fontWeight: 700,
                marginBottom: '0.4rem', color: 'var(--text)',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}>
                {i === 0 ? <HelpCircle size={13} /> : <Lightbulb size={13} style={{ color: 'var(--accent)' }} />}
                {item.title}
              </div>
              <div style={{
                fontSize: '0.78rem', color: 'var(--text-secondary)',
                lineHeight: 1.7, whiteSpace: 'pre-wrap',
              }}>
                {item.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
