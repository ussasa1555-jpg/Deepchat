'use client';

import React, { memo } from 'react';
import { formatMessage } from '@/lib/formatMessage';

interface MessageItemProps {
  message: {
    id: string;
    uid: string;
    body: string;
    created_at: string;
    users?: {
      nickname: string;
    };
    reactions?: any[];
  };
  currentUserUid: string | null;
  isOwnMessage: boolean;
  displayName: string;
  time: string;
  searchQuery?: string;
  isEditing?: boolean;
  editingText?: string;
  canEdit?: boolean;
  hoveredMessageId?: string | null;
  isRead?: boolean;
  readTime?: string | null;
  onEdit?: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
  onReaction?: (id: string, reaction: string) => void;
  onStartEdit?: (id: string, text: string) => void;
  onCancelEdit?: () => void;
  onHover?: (id: string | null) => void;
  onEditTextChange?: (text: string) => void;
  onUserClick?: (uid: string) => void;
}

export const MessageItem = memo(function MessageItem({
  message,
  currentUserUid,
  isOwnMessage,
  displayName,
  time,
  searchQuery = '',
  isEditing = false,
  editingText = '',
  canEdit = false,
  hoveredMessageId = null,
  isRead = false,
  readTime = null,
  onEdit,
  onDelete,
  onReaction,
  onStartEdit,
  onCancelEdit,
  onHover,
  onEditTextChange,
  onUserClick,
}: MessageItemProps) {
  const highlightMatch = (text: string) => {
    if (!searchQuery.trim()) return formatMessage(text);
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-accent/30 text-accent">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      onMouseEnter={() => onHover?.(message.id)}
      onMouseLeave={() => onHover?.(null)}
      className="group relative"
    >
      {isEditing ? (
        <div className="log-line bg-surface/30 p-2 border border-accent">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editingText}
              onChange={(e) => onEditTextChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onEdit?.(message.id, editingText);
                } else if (e.key === 'Escape') {
                  onCancelEdit?.();
                }
              }}
              className="flex-1 bg-transparent border-none outline-none text-accent font-mono"
              autoFocus
              maxLength={2000}
            />
            <button
              onClick={() => onEdit?.(message.id, editingText)}
              className="text-accent hover:text-accent/70 text-xs"
            >
              [SAVE]
            </button>
            <button
              onClick={onCancelEdit}
              className="text-muted hover:text-muted/70 text-xs"
            >
              [CANCEL]
            </button>
          </div>
        </div>
      ) : (
        <div className="log-line">
          {isOwnMessage && isRead && (
            <span className="text-accent text-[10px] mr-1" title={`Görüldü ${readTime}`}>
              ✓
            </span>
          )}
          <span className="timestamp">{time}</span>
          <span
            className={`uid ${isOwnMessage ? 'text-retro-magenta' : ''} ${
              !isOwnMessage ? 'cursor-pointer hover:text-accent/70' : ''
            }`}
            onClick={() => !isOwnMessage && onUserClick?.(message.uid)}
            title={!isOwnMessage ? 'View profile' : ''}
          >
            {displayName}
          </span>
          <span className="separator">&gt;</span>
          <span className="message">{highlightMatch(message.body)}</span>
          {isOwnMessage && hoveredMessageId === message.id && (
            <span className="ml-2 inline-flex gap-1">
              {canEdit && (
                <button
                  onClick={() => onStartEdit?.(message.id, message.body)}
                  className="text-[10px] text-accent hover:text-accent/70"
                  title="Edit (within 1 min)"
                >
                  [EDIT]
                </button>
              )}
              <button
                onClick={() => onDelete?.(message.id)}
                className="text-[10px] text-error hover:text-error/70"
                title="Delete"
              >
                [DEL]
              </button>
            </span>
          )}
        </div>
      )}
      {/* Reactions */}
      {!isEditing && message.reactions && message.reactions.length > 0 && (
        <div className="ml-24 mt-0.5 flex gap-1">
          {['+1', '-1', '?', '!', 'fire'].map((emoji) => {
            const count = message.reactions?.filter((r) => r.reaction === emoji).length || 0;
            if (count === 0) return null;
            const userReacted = message.reactions?.some(
              (r) => r.reaction === emoji && r.uid === currentUserUid
            );
            return (
              <button
                key={emoji}
                onClick={() => onReaction?.(message.id, emoji)}
                className={`text-[10px] px-1.5 py-0.5 border transition-all ${
                  userReacted
                    ? 'border-accent text-accent bg-accent/20'
                    : 'border-muted text-muted hover:border-accent/50'
                }`}
              >
                {emoji === 'fire' ? '🔥' : emoji} {count}
              </button>
            );
          })}
        </div>
      )}
      {/* Reaction Picker */}
      {!isEditing && hoveredMessageId === message.id && (
        <div className="ml-24 mt-1 flex gap-1">
          {['+1', '-1', '?', '!', 'fire'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReaction?.(message.id, emoji)}
              className="text-[10px] px-1.5 py-0.5 border border-muted text-muted hover:border-accent hover:text-accent transition-all"
              title={`React with ${emoji}`}
            >
              {emoji === 'fire' ? '🔥' : emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});














