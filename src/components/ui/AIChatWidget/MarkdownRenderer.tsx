'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Lightweight markdown renderer — no external deps.
 * Supports: **bold**, *italic*, `code`, headings, bullets, numbered lists, horizontal rules.
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
    let last = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) {
        parts.push(text.slice(last, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={key++}>{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={key++}>{match[3]}</em>);
      } else if (match[4]) {
        parts.push(
          <code key={key++} style={{
            background: 'rgba(15,139,141,0.12)',
            color: 'var(--accent-primary)',
            padding: '1px 5px',
            borderRadius: '4px',
            fontSize: '0.88em',
            fontFamily: 'var(--font-mono)',
          }}>
            {match[4]}
          </code>
        );
      }
      last = match.index + match[0].length;
    }

    if (last < text.length) parts.push(text.slice(last));
    return parts;
  };

  const renderBlock = (line: string, idx: number): React.ReactNode => {
    // Heading 3
    if (line.startsWith('### ')) {
      return (
        <h3 key={idx} style={{
          fontSize: '1rem',
          fontWeight: 600,
          marginTop: '1rem',
          marginBottom: '0.25rem',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          {renderInline(line.slice(4))}
        </h3>
      );
    }

    // Heading 2
    if (line.startsWith('## ')) {
      return (
        <h2 key={idx} style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          marginTop: '1.25rem',
          marginBottom: '0.35rem',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
        }}>
          {renderInline(line.slice(3))}
        </h2>
      );
    }

    // Heading 1
    if (line.startsWith('# ')) {
      return (
        <h1 key={idx} style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          marginTop: '1.25rem',
          marginBottom: '0.35rem',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
        }}>
          {renderInline(line.slice(2))}
        </h1>
      );
    }

    // Horizontal rule
    if (line === '---' || line === '***') {
      return (
        <hr key={idx} style={{
          border: 'none',
          borderTop: '1px solid var(--border-subtle)',
          margin: '0.75rem 0',
        }} />
      );
    }

    // Empty line — spacing
    if (line.trim() === '') {
      return <div key={idx} style={{ height: '0.4rem' }} />;
    }

    return (
      <p key={idx} style={{ margin: '0.2rem 0', lineHeight: 1.65 }}>
        {renderInline(line)}
      </p>
    );
  };

  // Pre-process: handle bullet lists and numbered lists
  const parseContent = (raw: string): React.ReactNode[] => {
    const lines = raw.split('\n');
    const result: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Bullet list block
      if (/^[-*•] /.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*•] /.test(lines[i])) {
          items.push(lines[i].replace(/^[-*•] /, ''));
          i++;
        }
        result.push(
          <ul key={`ul-${i}`} style={{
            paddingLeft: '1.2rem',
            margin: '0.3rem 0',
            listStyle: 'none',
          }}>
            {items.map((item, j) => (
              <li key={j} style={{
                margin: '0.2rem 0',
                lineHeight: 1.6,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
              }}>
                <span style={{ color: 'var(--accent-primary)', marginTop: '4px', flexShrink: 0 }}>•</span>
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Numbered list block
      if (/^\d+\. /.test(line)) {
        const items: string[] = [];
        let startNum = 1;
        while (i < lines.length && /^\d+\. /.test(lines[i])) {
          items.push(lines[i].replace(/^\d+\. /, ''));
          i++;
        }
        result.push(
          <ol key={`ol-${i}`} style={{
            paddingLeft: '1.4rem',
            margin: '0.3rem 0',
          }}>
            {items.map((item, j) => (
              <li key={j} style={{ margin: '0.2rem 0', lineHeight: 1.6 }}>
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      result.push(renderBlock(line, i));
      i++;
    }

    return result;
  };

  return (
    <div className={className} style={{ fontSize: '0.93rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
      {parseContent(content)}
    </div>
  );
}
