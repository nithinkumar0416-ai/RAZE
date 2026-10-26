import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to split content by code blocks: ```lang\ncode\n```
  const parts: Array<{ type: 'text' | 'code'; content: string; lang?: string }> = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex, match.index)
      });
    }

    parts.push({
      type: 'code',
      lang: match[1] || 'bash',
      content: match[2].trimEnd()
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.substring(lastIndex)
    });
  }

  // Basic markdown text renderer (handles headings, lists, bold, tables)
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      // H3
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-base font-bold text-white mt-3 mb-1 font-raze tracking-wide">
            {line.replace('### ', '')}
          </h3>
        );
        return;
      }
      // H4
      if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={idx} className="text-sm font-semibold text-raze-ice mt-2 mb-1 font-raze">
            {line.replace('#### ', '')}
          </h4>
        );
        return;
      }
      // Bullet list item
      if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={idx} className="ml-4 list-disc text-raze-silver text-xs sm:text-sm leading-relaxed my-0.5">
            {formatInline(line.substring(2))}
          </li>
        );
        return;
      }
      // Numbered list item
      if (/^\d+\.\s/.test(line)) {
        elements.push(
          <li key={idx} className="ml-4 list-decimal text-raze-silver text-xs sm:text-sm leading-relaxed my-0.5">
            {formatInline(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
        return;
      }
      // Horizontal rule
      if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={idx} className="border-white/10 my-3" />);
        return;
      }
      // Empty line / paragraph break
      if (!line.trim()) {
        elements.push(<div key={idx} className="h-2" />);
        return;
      }

      // Normal paragraph line
      elements.push(
        <p key={idx} className="text-xs sm:text-sm leading-relaxed text-raze-silver my-0.5 font-sans">
          {formatInline(line)}
        </p>
      );
    });

    return elements;
  };

  // Helper for inline styles: **bold**, `code`, *italic*
  const formatInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-white/10 text-raze-cyan font-mono text-[11px] border border-white/5">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-raze-silver">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-3 font-sans selection:bg-raze-blue/30 selection:text-white">
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          return (
            <div key={idx} className="rounded-xl overflow-hidden border border-white/10 bg-[#06080F] my-3 shadow-md">
              <div className="flex items-center justify-between px-3.5 py-2 bg-white/[0.04] border-b border-white/5 text-[11px] font-mono text-raze-silverMuted">
                <div className="flex items-center gap-1.5 text-raze-cyan">
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="uppercase">{part.lang}</span>
                </div>
                <button
                  onClick={() => handleCopyCode(part.content, idx)}
                  className="flex items-center gap-1 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-white/5"
                  title="Copy code snippet"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy code</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3.5 overflow-x-auto custom-scroll font-mono text-xs text-raze-ice leading-relaxed">
                <pre>{part.content}</pre>
              </div>
            </div>
          );
        }

        return <div key={idx}>{renderFormattedText(part.content)}</div>;
      })}
    </div>
  );
};
