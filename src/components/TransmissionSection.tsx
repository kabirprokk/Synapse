/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, MessageSquare, Clock, Trash2, Github, ExternalLink } from 'lucide-react';
import { soundManager } from '../services/audio';
import { StoredTransmission } from '../types';

export const TransmissionSection: React.FC = () => {
  const [operatorName, setOperatorName] = useState('');
  const [commFrequency, setCommFrequency] = useState('');
  const [classification, setClassification] = useState('bug');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [formError, setFormError] = useState('');
  const [sentList, setSentList] = useState<StoredTransmission[]>([]);

  // Load real saved messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('synapse_transmissions');
      if (stored) {
        setSentList(JSON.parse(stored));
      }
    } catch {
      // Fallback gracefully
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorName.trim() || !commFrequency.trim() || !message.trim()) {
      setFormError('Please fill name, email, and message — all three are required.');
      return;
    }
    setFormError('');

    soundManager.playTone(700, 'sine', 0.12, 0.04);

    const newTransmission: StoredTransmission = {
      id: `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
      name: operatorName.trim(),
      email: commFrequency.trim(),
      topic: classification,
      message: message.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'Delivered',
    };

    const updatedList = [newTransmission, ...sentList].slice(0, 10);
    setSentList(updatedList);

    try {
      localStorage.setItem('synapse_transmissions', JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    setIsSent(true);
    setOperatorName('');
    setCommFrequency('');
    setMessage('');

    setTimeout(() => {
      setIsSent(false);
    }, 5000);
  };

  const handleClearMessages = () => {
    setSentList([]);
    try {
      localStorage.removeItem('synapse_transmissions');
    } catch {
      // ignore
    }
  };

  return (
    <section
      id="contact"
      className="relative w-full py-28 px-4 md:px-6 lg:px-8 border-t border-[#494454]/25 scroll-mt-20 overflow-hidden"
    >
      {/* Ambient Glow */}
      <div className="absolute top-20 right-1/4 w-[450px] h-[450px] rounded-full bg-[#00eefc]/10 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col gap-12 relative z-10">
        {/* Header */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#222a3d] border border-[#00eefc]/30 text-[#00eefc] font-mono text-xs mb-3">
            <MessageSquare className="w-3.5 h-3.5 text-[#00eefc]" />
            <span>COMMUNITY &amp; FEEDBACK</span>
          </div>
          <h2 className="font-headline text-3xl sm:text-4xl font-bold text-[#dae2fd] tracking-tight leading-tight">
            Send Feedback, Ideas, or Bug Reports
          </h2>
          <p className="text-base text-[#cbc3d7] mt-2.5 leading-relaxed">
            Noticed an unusual move, want to suggest another game or algorithm, or have an idea to share? Send a message directly to our team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Real Form (7 cols) */}
          <div className="lg:col-span-7 bg-[#131b2e]/75 border border-[#494454]/30 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" id="feedback-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="user-name"
                    className="font-headline text-xs text-[#cbc3d7] font-semibold"
                  >
                    Your Name or Handle
                  </label>
                  <input
                    id="user-name"
                    type="text"
                    required
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-[#060e20]/80 border border-[#494454]/40 rounded-xl px-4 py-2.5 text-[#dae2fd] placeholder:text-[#cbc3d7]/40 focus:border-[#00eefc] focus:ring-1 focus:ring-[#00eefc] outline-none text-sm transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="user-email"
                    className="font-headline text-xs text-[#cbc3d7] font-semibold"
                  >
                    Your Email Address
                  </label>
                  <input
                    id="user-email"
                    type="email"
                    required
                    value={commFrequency}
                    onChange={(e) => setCommFrequency(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-[#060e20]/80 border border-[#494454]/40 rounded-xl px-4 py-2.5 text-[#dae2fd] placeholder:text-[#cbc3d7]/40 focus:border-[#00eefc] focus:ring-1 focus:ring-[#00eefc] outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="user-topic"
                  className="font-headline text-xs text-[#cbc3d7] font-semibold"
                >
                  What is this message about?
                </label>
                <select
                  id="user-topic"
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  className="w-full bg-[#060e20]/80 border border-[#494454]/40 rounded-xl px-4 py-2.5 text-[#dae2fd] focus:border-[#00eefc] focus:ring-1 focus:ring-[#00eefc] outline-none text-sm transition-all cursor-pointer"
                >
                  <option value="bug">Report an AI move or gameplay bug</option>
                  <option value="feature">Suggest a new algorithm or feature</option>
                  <option value="code">Questions about the code / collaboration</option>
                  <option value="general">General feedback and comments</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="user-message"
                  className="font-headline text-xs text-[#cbc3d7] font-semibold"
                >
                  Your Message
                </label>
                <textarea
                  id="user-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. seed 42, depth 6, Lake missed block at (1,1) in round 12"
                  className="w-full bg-[#060e20]/80 border border-[#494454]/40 rounded-xl p-4 text-[#dae2fd] placeholder:text-[#cbc3d7]/40 focus:border-[#00eefc] focus:ring-1 focus:ring-[#00eefc] outline-none text-sm transition-all resize-y min-h-[100px]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 font-mono text-xs text-[#cbc3d7]">
                  <span className="w-2 h-2 rounded-full bg-[#00eefc]" />
                  <span>Real-time local message log</span>
                </div>

                <button
                  type="submit"
                  id="btn-submit-feedback"
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#00eefc] to-[#a078ff] text-[#23005c] hover:shadow-[0_0_24px_rgba(0,238,252,0.5)] active:scale-95 transition-all font-headline text-sm font-bold cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </div>
            </form>

            {/* Error message */}
            {formError && (
              <div
                role="alert"
                className="mt-4 p-4 rounded-xl bg-red-950/60 border border-red-400/40 text-red-200 text-sm"
              >
                {formError}
              </div>
            )}

            {/* Success Toast */}
            {isSent && (
              <div
                id="feedback-success-toast"
                className="mt-4 p-4 rounded-xl bg-[#222a3d] border border-[#00eefc]/60 text-[#00eefc] flex items-center gap-3 animate-in fade-in duration-300"
              >
                <CheckCircle2 className="w-5 h-5 text-[#00eefc] shrink-0" />
                <div className="flex flex-col">
                  <span className="font-headline text-sm font-bold text-[#dae2fd]">
                    Message Saved &amp; Recorded
                  </span>
                  <span className="font-sans text-xs text-[#cbc3d7]">
                    Thank you! Your feedback has been stored in your session message log.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Real message history & links (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Real Saved Messages List */}
            <div className="bg-[#131b2e]/75 border border-[#494454]/30 backdrop-blur-2xl rounded-2xl p-6 shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-sm font-bold text-[#dae2fd] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#00eefc]" />
                  Recent Submissions ({sentList.length})
                </h3>
                {sentList.length > 0 && (
                  <button
                    onClick={handleClearMessages}
                    className="text-xs text-[#cbc3d7] hover:text-[#ffb4ab] flex items-center gap-1 cursor-pointer transition-colors"
                    title="Clear saved messages"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {sentList.length === 0 ? (
                <div className="p-5 text-center text-xs text-[#cbc3d7] bg-[#060e20]/50 rounded-xl border border-[#494454]/20">
                  You haven&apos;t submitted any messages yet. Send one via the form to test it out!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {sentList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#060e20]/80 border border-[#494454]/30 flex flex-col gap-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#dae2fd] truncate">
                          {item.name}
                        </span>
                        <span className="font-mono text-[10px] text-[#cbc3d7]">
                          {item.createdAt}
                        </span>
                      </div>
                      <p className="text-[#cbc3d7] line-clamp-2 text-[11px]">
                        &ldquo;{item.message}&rdquo;
                      </p>
                      <span className="text-[10px] text-[#00eefc] font-medium mt-0.5">
                        Status: Saved Locally
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Community Links */}
            <div className="bg-[#131b2e]/75 border border-[#494454]/30 backdrop-blur-2xl rounded-2xl p-6 shadow-md flex flex-col gap-3">
              <h3 className="font-headline text-sm font-bold text-[#dae2fd]">
                Project Resources
              </h3>
              <div className="space-y-2 text-xs">
                <a
                  href="https://github.com/kabirprokk/Synapse"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#060e20]/80 border border-[#494454]/30 hover:border-[#00eefc]/50 hover:text-[#00eefc] transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Github className="w-4 h-4 text-[#dae2fd]" />
                    <span>Open-Source Implementation</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </a>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#060e20]/80 border border-[#494454]/30 text-[#cbc3d7]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#00eefc]" />
                    <span>Deterministic Random Seed</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#00eefc]">#4959-LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
