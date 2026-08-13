'use client';

import { useState } from 'react';
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
 * automatically — for a real on-demand send. The two manual links are a
 * fallback for when that's not enough (no number/email on file yet, or the
 * technician wants to attach something custom): they just open WhatsApp Web
 * or the default mail client with the customer pre-filled.
 */
export function SendDocumentBar({
  documentLabel,
  customerName,
  customerPhone,
  customerEmail,
  businessPhone,
  businessEmail,
  onSend,
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
    } catch (err) {
      setStatus('failed');
      setErrorMsg(err instanceof Error ? err.message : 'Send failed');
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <ActionButton
        text={status === 'sending' ? 'Sending…' : 'Send to Customer'}
        variant="ghost"
        showArrow={false}
        disabled={status === 'sending'}
        onClick={handleSend}
      />
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          title={usingFallbackPhone ? 'No WhatsApp number on file for this customer — using the business number instead' : undefined}
          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          WhatsApp manually{usingFallbackPhone && ' (business no.)'}
        </a>
      )}
      {mailLink && (
        <a
          href={mailLink}
          title={usingFallbackEmail ? 'No email on file for this customer — using the business email instead' : undefined}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Email manually{usingFallbackEmail && ' (business)'}
        </a>
      )}
      {!waLink && !mailLink && (
        <span className="text-xs text-slate-600">No WhatsApp/email on file for this customer, and no business contact set in Settings.</span>
      )}
      {status === 'done' && (
        <span className="text-xs text-emerald-400">
          Sent{result?.emailError ? ' — email copy failed' : ''}
        </span>
      )}
      {status === 'failed' && (
        <span className="text-xs text-red-400">
          {errorMsg || result?.whatsappError || 'Could not send — try the manual links'}
        </span>
      )}
    </div>
  );
}
