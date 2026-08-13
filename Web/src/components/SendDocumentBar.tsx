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
  onSend,
}: {
  documentLabel: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  onSend: () => Promise<SendResult>;
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle');
  const [result, setResult] = useState<SendResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const greeting = customerName ? `Hi ${customerName}, ` : 'Hi, ';
  const waLink = customerPhone
    ? `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`${greeting}please find your ${documentLabel} attached.`)}`
    : null;
  const mailLink = customerEmail
    ? `mailto:${customerEmail}?subject=${encodeURIComponent(documentLabel)}&body=${encodeURIComponent(`${greeting}please find your ${documentLabel} attached.`)}`
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
        <a href={waLink} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
          WhatsApp manually
        </a>
      )}
      {mailLink && (
        <a href={mailLink} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
          Email manually
        </a>
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
