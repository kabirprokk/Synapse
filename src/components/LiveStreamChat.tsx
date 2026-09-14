/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Radio, Bot, ShieldCheck, Sparkles } from 'lucide-react';
import { StreamCommentary } from '../types';

interface LiveStreamChatProps {
  comments: StreamCommentary[];
  onSendMessage: (msg: string) => void;
  viewerCount: number;
}

export const LiveStreamChat: React.FC<LiveStreamChatProps> = ({
  comments,
  onSendMessage,
  viewerCount,
}) => {
  const [inputText, setInputText] = useState('');
  const feedContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedContainerRef.current) {
      feedContainerRef.current.scrollTop = feedContainerRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div
      id="stream-chat-container"
      className="w-full bg-[#060a14]/90 border border-[#1e2c4a] rounded-3xl p-4 md:p-5 backdrop-blur-2xl flex flex-col gap-3 shadow-[0_12px_40px_rgba(0,0,0,0.8)] relative overflow-hidden"
    >
      {/* Corner reticles */}
      <span className="absolute top-2 left-2 font-mono text-[9px] text-[#00f0ff]/30 select-none">┌</span>
      <span className="absolute top-2 right-2 font-mono text-[9px] text-[#ff334b]/30 select-none">┐</span>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1b2742] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#ff334b] animate-ping" />
          <h3 className="font-headline text-sm font-bold text-[#dae2fd] flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-[#ff334b]" />
            LIVE STREAM CHAT
          </h3>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs text-[#8899b7]">
          <span className="text-[#00f0ff] font-semibold">{viewerCount.toLocaleString()}</span>
          <span>online</span>
        </div>
      </div>

      {/* Message Feed */}
      <div ref={feedContainerRef} className="h-64 sm:h-72 overflow-y-auto pr-1 flex flex-col gap-2.5 font-mono text-xs scrollbar-thin">
        {comments.map((c) => (
          <div
            key={c.id}
            className={`p-2 rounded-xl transition-all ${
              c.isSystem
                ? 'bg-[#0f1d38]/60 border border-[#1e3463] text-[#7df4ff]'
                : 'bg-[#0a1224]/70 border border-[#172238] text-[#dae2fd]'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {c.isSystem ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#00f0ff]/20 text-[#00f0ff] flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    REFEREE
                  </span>
                ) : (
                  <span
                    className="px-1.5 py-0.2 rounded text-[9px] font-bold"
                    style={{
                      backgroundColor: `${c.badgeColor || '#a078ff'}22`,
                      color: c.badgeColor || '#d0bcff',
                    }}
                  >
                    {c.badge || 'VIEWER'}
                  </span>
                )}
                <span className="font-semibold text-xs text-[#dae2fd]">{c.user}</span>
              </div>
              <span className="text-[10px] text-[#8899b7]/70 shrink-0">{c.timestamp}</span>
            </div>
            <p className="text-xs leading-relaxed font-sans text-[#dae2fd]/90 break-words">
              {c.message}
            </p>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message to the stream..."
          className="flex-1 bg-[#0a1224] border border-[#222f4d] rounded-full px-4 py-2 text-xs font-sans text-[#dae2fd] placeholder-[#8899b7]/50 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/50"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-full bg-[#00f0ff] hover:bg-[#38bdf8] text-[#051b33] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(0,240,255,0.4)]"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SEND</span>
        </button>
      </form>
    </div>
  );
};
