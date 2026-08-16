'use client';

import type { DocumentJobContext } from '@/hooks/useQuotations';
import { DocSection } from './DocSection';

const APPLIANCES = [
  'AC Unit', 'Washing Machine', 'Refrigerator', 'Oven / Stove',
  'Dishwasher', 'Dryer', 'Microwave', 'Water Heater', 'Other',
];

/**
 * Customer + appliance detail, typed straight into the document. The
 * backend turns this into a real customer and repair job behind the
 * scenes (API/app/services/customerJobResolver.js) — the office never has
 * to create a "job" first, which is how the paper process actually works.
 *
 * Name and phone are the only required fields: phone is what the customer
 * is matched on, so a repeat customer's record is reused rather than
 * duplicated.
 */
export function JobContextFields({
  value,
  onChange,
  technicians = [],
}: {
  value: DocumentJobContext;
  onChange: (next: DocumentJobContext) => void;
  technicians?: Array<{ id: string; name: string }>;
}) {
  const set = <K extends keyof DocumentJobContext>(key: K, v: DocumentJobContext[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <>
      <DocSection title="Bill To — Customer Details" icon="🏢" accent="blue">
        <div className="fg c2">
          <div className="field full">
            <label htmlFor="jc-name">Customer / Company Name *</label>
            <input id="jc-name" value={value.customer_name || ''} placeholder="Full name or company"
              onChange={(e) => set('customer_name', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="jc-phone">Phone / WhatsApp *</label>
            <input id="jc-phone" value={value.customer_phone || ''} placeholder="+971 XX XXX XXXX"
              onChange={(e) => set('customer_phone', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="jc-contact">Contact Person</label>
            <input id="jc-contact" value={value.customer_contact_person || ''} placeholder="Name of contact person"
              onChange={(e) => set('customer_contact_person', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="jc-email">Customer Email</label>
            <input id="jc-email" type="email" value={value.customer_email || ''} placeholder="customer@email.com"
              onChange={(e) => set('customer_email', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="jc-address">Address / Area</label>
            <input id="jc-address" value={value.customer_address || ''} placeholder="e.g. Dubai Marina"
              onChange={(e) => set('customer_address', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="jc-building">Building / Villa #</label>
            <input id="jc-building" value={value.customer_building || ''} placeholder="Building name or number"
              onChange={(e) => set('customer_building', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="jc-location">Location / Landmark</label>
            <input id="jc-location" value={value.customer_location || ''} placeholder="Nearest landmark"
              onChange={(e) => set('customer_location', e.target.value)} />
          </div>
        </div>
      </DocSection>

      <DocSection title="Appliance Details" icon="🔧" accent="blue">
        <div className="fg c4">
          <div className="field">
            <label htmlFor="jc-appliance">Appliance Type</label>
            <select id="jc-appliance" value={value.appliance_type || ''}
              onChange={(e) => set('appliance_type', e.target.value)}>
              <option value="">— Select —</option>
              {APPLIANCES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="jc-brand">Brand / Make</label>
            <input id="jc-brand" value={value.brand || ''} placeholder="Samsung, LG…"
              onChange={(e) => set('brand', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="jc-model">Model Number</label>
            <input id="jc-model" value={value.model || ''} placeholder="Model"
              onChange={(e) => set('model', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="jc-serial">Serial Number</label>
            <input id="jc-serial" value={value.serial_number || ''} placeholder="Serial"
              onChange={(e) => set('serial_number', e.target.value)} />
          </div>
          <div className="field full">
            <label htmlFor="jc-fault">Fault Description</label>
            <textarea id="jc-fault" value={value.reported_fault || ''}
              placeholder="Describe the fault found — what is not working…"
              onChange={(e) => set('reported_fault', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="jc-tech">Technician</label>
            <select id="jc-tech" value={value.technician_id || ''}
              onChange={(e) => set('technician_id', e.target.value)}>
              <option value="">— Unassigned —</option>
              {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="jc-urgency">Urgency</label>
            <select id="jc-urgency" value={value.urgency || 'normal'}
              onChange={(e) => set('urgency', e.target.value as DocumentJobContext['urgency'])}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </DocSection>
    </>
  );
}
