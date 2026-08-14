'use client';

import { useState } from 'react';
import { Send, MessageCircle, Mail } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';

interface SendResult {
  whatsappSent: boolean;
  whatsappError: string | null;
  emailError: string | null;
  hasWhatsapp: boolean;
}

/**
 * Shared "send to customer" control for the Quotation/Invoice/Inspection
 * detail pages. The primary button goes through the backend — same
 * WhatsApp(+template fallback)/email delivery path the bot already uses
 * automatically — for a real on-demand send. The two manual icon buttons are
 * a fallback for when that's not enough (no number/email on file yet, or the
 * technician wants to attach something custom): they just open WhatsApp Web
 * or the default mail client with the customer pre-filled. Rendered as a
 * standalone bordered bar rather than inline text links so it can't be
 * missed among the page's other controls.
 */
export function SendDocumentBar({
  documentLabel,
  customerName,
  customerPhone,
  customerEmail,
  businessPhone,
  businessEmail,
  onSend,
  onSent,
}: {
  documentLabel: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  /** Falls back to the company's own number/email (from Settings) when the
   *  customer record has none on file, so the manual links are never just
   *  silently missing — worst case you're messaging/emailing yourself the
   *  document to forward on manually. */
  businessPhone?: string;
  businessEmail?: string;
  onSend: () => Promise<SendResult>;
  /** Called after a successful send so the caller can refetch the document —
   *  the backend marks it 'sent', but nothing here updates the page's own
   *  status badge (or the list it came from) without this. */
  onSent?: () => void;
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle');
  const [result, setResult] = useState<SendResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const phoneForLink = customerPhone || businessPhone;
  const usingFallbackPhone = !customerPhone && !!businessPhone;
  const emailForLink = customerEmail || businessEmail;
  const usingFallbackEmail = !customerEmail && !!businessEmail;

  const greeting = customerName ? `Hi ${customerName}, ` : 'Hi, ';
  const waLink = phoneForLink
    ? `https://wa.me/${phoneForLink.replace(/\D/g, '')}?text=${encodeURIComponent(`${greeting}please find your ${documentLabel} attached.`)}`
    : null;
  const mailLink = emailForLink
    ? `mailto:${emailForLink}?subject=${encodeURIComponent(documentLabel)}&body=${encodeURIComponent(`${greeting}please find your ${documentLabel} attached.`)}`
    : null;

  const handleSend = async () => {
    setStatus('sending');
    setErrorMsg(null);
    try {
      const r = await onSend();
      setResult(r);
      setStatus(r.whatsappSent || !r.hasWhatsapp ? 'done' : 'failed');
      onSent?.();
    } catch (err) {
      setStatus('failed');
      setErrorMsg(err instanceof Error ? err.message : 'Send failed');
    }
  };

  return (
    <div className="w-full flex items-center gap-3 flex-wrap bg-slate-900 border border-blue-500/30 rounded-md px-4 py-3 shadow-[0_0_16px_rgba(59,130,246,0.12)]">
      <Send className="w-4 h-4 text-blue-400 shrink-0" strokeWidth={2} />
      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide shrink-0">Send to Customer</span>

      <ActionButton
        text={status === 'sending' ? 'Sending…' : 'Send Now'}
        variant="primary"
        showArrow={false}
        disabled={status === 'sending'}
        onClick={handleSend}
        className="ml-auto"
      />

      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          title={usingFallbackPhone ? 'No WhatsApp number on file for this customer — using the business number instead' : 'Open WhatsApp with this document pre-filled'}
          className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-md px-2.5 py-1.5 hover:bg-emerald-500/20 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" strokeWidth={2} />
          WhatsApp{usingFallbackPhone && ' (business)'}
        </a>
      )}
      {mailLink && (
        <a
          href={mailLink}
          title={usingFallbackEmail ? 'No email on file for this customer — using the business email instead' : 'Open your mail client with this document pre-filled'}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-md px-2.5 py-1.5 hover:bg-blue-500/20 transition-colors"
        >
          <Mail className="w-3.5 h-3.5" strokeWidth={2} />
          Email{usingFallbackEmail && ' (business)'}
        </a>
      )}
      {!waLink && !mailLink && (
        <span className="text-xs text-slate-600">No WhatsApp/email on file for this customer, and no business contact set in Settings.</span>
      )}
      {status === 'done' && (
        <span className="w-full text-xs text-emerald-400">
          Sent{result?.emailError ? ' — email copy failed' : ''}
        </span>
      )}
      {status === 'failed' && (
        <span className="w-full text-xs text-red-400">
          {errorMsg || result?.whatsappError || 'Could not send — try WhatsApp/Email above'}
        </span>
      )}
    </div>
  );
}
