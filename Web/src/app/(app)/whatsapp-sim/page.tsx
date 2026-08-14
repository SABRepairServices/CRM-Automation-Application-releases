'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FlaskConical, RotateCcw, Send, FileText, Wrench, User, Radio } from 'lucide-react';
import { useWhatsappSim, SimMessage } from '@/hooks/useWhatsappSim';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const STAGE_LABEL: Record<string, string> = {
  inspection_sent: 'Inspection sent â€” waiting on customer',
  quotation_sent: 'Quotation sent â€” waiting on customer',
  awaiting_completion: 'Approved â€” waiting for technician DONE',
  invoice_sent: 'Invoice sent',
};

const digits = (v: string | null | undefined) => String(v || '').replace(/\D/g, '');

/** Matches on the last 9 digits, the same way the bot resolves numbers. */
const sameNumber = (a: string | null | undefined, b: string | null | undefined) => {
  const x = digits(a).slice(-9);
  const y = digits(b).slice(-9);
  return x.length > 0 && x === y;
};

function ChatPane({
  title,
  subtitle,
  icon,
  accent,
  messages,
  myNumber,
  emptyHint,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
  messages: SimMessage[];
  myNumber: string;
  emptyHint: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden h-[460px]">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2.5 shrink-0">
        <span className={accent}>{icon}</span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">{title}</div>
          <div className="text-[11px] text-slate-500 font-mono truncate">{subtitle}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-xs text-slate-600 text-center pt-10">{emptyHint}</p>
        ) : (
          messages.map((m) => {
            const isMine = sameNumber(m.from_number, myNumber);
            const doc = m.raw_payload?.dryRunDocument;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                    isMine ? 'bg-emerald-600/20 border border-emerald-700/40 text-emerald-50' : 'bg-slate-800 border border-slate-700 text-slate-100'
                  }`}
                >
                  {m.body}
                  {doc && (
                    <a
                      href={`${API_URL}/whatsapp-sim/document/${doc}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-blue-300 hover:text-blue-200 underline decoration-dotted"
                    >
                      <FileText className="w-3 h-3" /> Open the PDF the customer receives
                    </a>
                  )}
                  <div className="mt-1 text-[10px] text-slate-500 font-mono">
                    {new Date(m.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

export default function WhatsappSimPage() {
  const { messages, threads, status, sending, error, loadStatus, loadConversation, loadThreads, sendInbound, reset } =
    useWhatsappSim();

  const [clientId, setClientId] = useState('');
  const [techNumber, setTechNumber] = useState('');
  const [custNumber, setCustNumber] = useState('971509998877');
  const [custName, setCustName] = useState('Test Customer');
  const [techDraft, setTechDraft] = useState('');
  const [custDraft, setCustDraft] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('selectedClientId');
    if (stored) setClientId(stored);
    loadStatus().then((s) => {
      if (s?.technicians?.length) setTechNumber(digits(s.technicians[0].phone));
    });
    loadConversation();
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inpTemplate = useMemo(
    () =>
      `INP\nCustomer: ${custName}\nPhone: ${custNumber}\nAppliance: Washing Machine\nFindings: Drain pump seized; Filter blocked\nAmount: 250`,
    [custName, custNumber]
  );

  const techMessages = messages.filter(
    (m) => sameNumber(m.from_number, techNumber) || sameNumber(m.to_number, techNumber)
  );
  const custMessages = messages.filter(
    (m) => sameNumber(m.from_number, custNumber) || sameNumber(m.to_number, custNumber)
  );

  const activeThread = threads.find((t) => sameNumber(t.customer_whatsapp, custNumber));

  const sendTech = async (text: string) => {
    if (!text.trim() || !techNumber) return;
    await sendInbound(techNumber, text, 'text', 'Technician');
    setTechDraft('');
  };

  const sendCust = async (text: string, type: string = 'text') => {
    if (type === 'text' && !text.trim()) return;
    await sendInbound(custNumber, text, type, custName);
    setCustDraft('');
  };

  return (
    <div className="px-4 py-4 bg-slate-950 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-2 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-violet-400" />
              WhatsApp Simulator
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Type as the technician and as the customer. Every message goes through the real webhook and the real bot â€”
              the only thing switched off is the final hand-off to Meta.
            </p>
          </div>
          <button
            onClick={() => clientId && confirm('Reset the simulation? This clears the entire conversation history.') && reset(clientId)}
            disabled={sending || !clientId}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800/60 border border-slate-700 text-slate-200 rounded-md hover:bg-slate-700/60 transition-colors disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset simulation
          </button>
        </div>

        {status && (
          <div
            className={`flex items-start gap-2.5 px-4 py-3 rounded-md mb-5 text-xs border ${
              status.dryRun
                ? 'bg-violet-500/10 border-violet-500/30 text-violet-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            <Radio className="w-4 h-4 mt-0.5 shrink-0" />
            {status.dryRun ? (
              <span>
                <strong className="font-semibold">Dry-run mode.</strong> Documents are really generated and every
                decision is really made â€” outbound messages are recorded instead of delivered. Add the Meta credentials
                and this same code sends for real, with no changes.
              </span>
            ) : (
              <span>
                <strong className="font-semibold">Live credentials are configured.</strong> Messages sent here will
                reach real phones. Use a number you control.
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-900 text-red-400 text-sm px-4 py-3 rounded-md mb-5">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Technician number</label>
            <select
              value={techNumber}
              onChange={(e) => setTechNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-white"
            >
              {(status?.technicians || []).map((t) => (
                <option key={t.id} value={digits(t.phone)}>
                  {t.name} â€” {t.phone}
                </option>
              ))}
              {(status?.technicians || []).length === 0 && <option value="">No technicians found</option>}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Customer number</label>
            <input
              value={custNumber}
              onChange={(e) => setCustNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Customer name</label>
            <input
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-white"
            />
          </div>
        </div>

        {activeThread && (
          <div className="bg-slate-900 border border-slate-800 rounded-md px-4 py-3 mb-5 flex flex-wrap items-center gap-x-6 gap-y-1">
            <div className="text-xs text-slate-500">
              Job <span className="text-white font-mono">{activeThread.job_number || 'â€”'}</span>
            </div>
            <div className="text-xs text-slate-500">
              Stage{' '}
              <span className="text-violet-300 font-medium">
                {STAGE_LABEL[activeThread.stage] || activeThread.stage}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Waiting on <span className="text-white">{activeThread.status.replace('awaiting_', '')}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <ChatPane
              title="Technician's phone"
              subtitle={techNumber || 'no technician selected'}
              icon={<Wrench className="w-4 h-4" />}
              accent="text-emerald-400"
              messages={techMessages}
              myNumber={techNumber}
              emptyHint="Send an INP command to start a job."
            />
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setTechDraft(inpTemplate)}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700"
              >
                Fill INP template
              </button>
              <button
                onClick={() => sendTech('DONE')}
                disabled={sending || !techNumber}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-40"
              >
                Send DONE
              </button>
              <button
                onClick={() => sendTech('hello can you help')}
                disabled={sending || !techNumber}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-40"
              >
                Send gibberish
              </button>
            </div>
            {!techNumber && (
              <p className="text-[11px] text-amber-400">Select a technician above before sending as one.</p>
            )}
            <div className="flex gap-2">
              <textarea
                value={techDraft}
                onChange={(e) => setTechDraft(e.target.value)}
                rows={3}
                placeholder="INP / QOT / INV / DONE â€¦"
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white font-mono placeholder:text-slate-600"
              />
              <button
                onClick={() => sendTech(techDraft)}
                disabled={sending || !techDraft.trim() || !techNumber}
                className="px-3 self-stretch bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-md transition-colors"
                aria-label="Send as technician"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <ChatPane
              title={`${custName}'s phone`}
              subtitle={custNumber}
              icon={<User className="w-4 h-4" />}
              accent="text-blue-400"
              messages={custMessages}
              myNumber={custNumber}
              emptyHint="The customer sees documents here once the technician sends INP."
            />
            <div className="flex flex-wrap gap-1.5">
              {['approved', 'yes go ahead', 'no too expensive', 'can you do it for 150?'].map((q) => (
                <button
                  key={q}
                  onClick={() => sendCust(q)}
                  disabled={sending}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
              <button
                onClick={() => sendCust('', 'audio')}
                disabled={sending}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-40"
              >
                Send voice note
              </button>
            </div>
            <div className="flex gap-2">
              <textarea
                value={custDraft}
                onChange={(e) => setCustDraft(e.target.value)}
                rows={3}
                placeholder="Reply as the customerâ€¦"
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white placeholder:text-slate-600"
              />
              <button
                onClick={() => sendCust(custDraft)}
                disabled={sending || !custDraft.trim()}
                className="px-3 self-stretch bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-md transition-colors"
                aria-label="Send as customer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

