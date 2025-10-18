import React from 'react';

/**
 * Format message text with basic formatting:
 * - -text- → important (red)
 * - URLs → clickable links (cyan)
 */
export function formatMessage(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  const patterns = [
    // Important: -text-
    {
      regex: /-([^-]+)-/g,
      render: (match: string, content: string, key: number) => (
        <span key={key} className="text-error font-bold">
          {content}
        </span>
      ),
    },
    // URLs
    {
      regex: /(https?:\/\/[^\s]+)/g,
      render: (match: string, content: string, key: number) => (
        <a
          key={key}
          href={content}
          target="_blank"
          rel="noopener noreferrer"
          className="text-retro-cyan underline hover:text-accent"
        >
          {content}
        </a>
      ),
    },
  ];

  // Process each pattern
  let processedText = text;
  const replacements: Array<{
    start: number;
    end: number;
    node: React.ReactNode;
  }> = [];

  patterns.forEach((pattern) => {
    const matches = Array.from(processedText.matchAll(pattern.regex));
    matches.forEach((match, index) => {
      if (match.index !== undefined) {
        const start = match.index;
        const end = start + match[0].length;
        const content = match[1] || match[0];
        const node = pattern.render(match[0], content, replacements.length);

        replacements.push({ start, end, node });
      }
    });
  });

  // Sort replacements by position
  replacements.sort((a, b) => a.start - b.start);

  // Build final output
  let lastIndex = 0;
  const finalParts: React.ReactNode[] = [];

  replacements.forEach((replacement, idx) => {
    // Check for overlaps
    if (replacement.start < lastIndex) return;

    // Add plain text before replacement
    if (replacement.start > lastIndex) {
      finalParts.push(processedText.substring(lastIndex, replacement.start));
    }

    // Add replacement node
    finalParts.push(replacement.node);

    lastIndex = replacement.end;
  });

  // Add remaining text
  if (lastIndex < processedText.length) {
    finalParts.push(processedText.substring(lastIndex));
  }

  return finalParts.length > 0 ? <>{finalParts}</> : text;
}


