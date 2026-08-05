import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../Configs/.env') });

const API_URL = `http://localhost:${process.env.API_PORT || 5000}/api`;
const DEV_EMAIL = 'dev@local.test';
const DEV_PASSWORD = 'dev-local-bypass-password';

async function login() {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, { email: DEV_EMAIL, password: DEV_PASSWORD });
    return res.data.accessToken;
  } catch {
    await axios.post(`${API_URL}/auth/register`, { email: DEV_EMAIL, password: DEV_PASSWORD, fullName: 'Dev User' });
    const res = await axios.post(`${API_URL}/auth/login`, { email: DEV_EMAIL, password: DEV_PASSWORD });
    return res.data.accessToken;
  }
}

async function main() {
  const token = await login();
  const h = { headers: { Authorization: `Bearer ${token}` } };

  // Client (business)
  let clients = (await axios.get(`${API_URL}/clients`, h)).data.data;
  let client = clients.find((c) => c.name === 'Shams Al Barakat (Demo)');
  if (!client) {
    client = (
      await axios.post(
        `${API_URL}/clients`,
        { name: 'Shams Al Barakat (Demo)', business_type: 'repair', city: 'Dubai', phone: '+971505715261' },
        h
      )
    ).data.data;
    console.log('Created demo client:', client.id);
  } else {
    console.log('Using existing demo client:', client.id);
  }
  const clientId = client.id;

  // Technician
  const techRes = await axios.post(
    `${API_URL}/technicians`,
    { client_id: clientId, name: 'Ahmed Hassan', phone: '+971501112222', speciality: 'Washing Machine, AC' },
    h
  ).catch((e) => ({ data: { data: null }, error: e.response?.data }));
  console.log('Technician:', techRes.data?.data?.name || techRes.error);

  // Customer
  const customer = (
    await axios.post(
      `${API_URL}/customers`,
      { client_id: clientId, name: 'Fatima Al Mansoori', phone: '+971502223333', area: 'Al Quoz, Dubai', address: 'Unit 4706, Gate 1', source: 'whatsapp', status: 'booked' },
      h
    )
  ).data.data;
  console.log('Created customer:', customer.id);

  // Job
  const job = (
    await axios.post(
      `${API_URL}/jobs`,
      { client_id: clientId, customer_id: customer.id, appliance_type: 'washing_machine', brand: 'LG', model: '7kg Front Load', reported_fault: 'Not draining water, making loud noise during spin cycle' },
      h
    )
  ).data.data;
  console.log('Created job:', job.id, job.job_number);

  await axios.put(`${API_URL}/jobs/${job.id}?client_id=${clientId}`, { status: 'inspected' }, h);

  // Inspection report
  const inspection = (
    await axios.post(
      `${API_URL}/inspections`,
      {
        client_id: clientId,
        job_id: job.id,
        inspected_by: 'Ahmed Hassan',
        findings: [
          { description: 'Drain pump is blocked with debris and needs replacement' },
          { description: 'Motor bearing showing early wear, recommend inspection during repair' },
        ],
        taxable_amount: 203,
        tax_rate: 5,
        notes: 'Customer approved on-site inspection; parts available in stock.',
      },
      h
    )
  ).data.data;
  console.log('Created inspection report:', inspection.report_number);

  await axios.put(`${API_URL}/jobs/${job.id}?client_id=${clientId}`, { status: 'quoted' }, h);

  // Quotation
  const quotation = (
    await axios.post(
      `${API_URL}/quotations`,
      {
        client_id: clientId,
        job_id: job.id,
        items: [
          { description: 'Drain Pump Replacement', item_type: 'part', quantity: 1, unit_price: 203 },
          { description: 'Labour & Service', item_type: 'labour', quantity: 1, unit_price: 175 },
        ],
        discount_amount: 0,
        vat_percent: 5,
        notes: 'Standard 30-day warranty on parts.',
      },
      h
    )
  ).data.data;
  console.log('Created quotation:', quotation.quotation_number, 'total:', quotation.total_amount);

  // Approve → auto-generates invoice
  const approved = (
    await axios.put(
      `${API_URL}/quotations/${quotation.id}?client_id=${clientId}`,
      { status: 'approved', approved_by: 'Fatima Al Mansoori', approval_channel: 'whatsapp' },
      h
    )
  ).data.data;
  console.log('Approved quotation. Auto-generated invoice:', approved.generated_invoice?.invoice_number);

  await axios.put(`${API_URL}/jobs/${job.id}?client_id=${clientId}`, { status: 'completed' }, h);

  console.log('\n✅ Demo data seeded. Set this client active in the Clients page to see it.');
  console.log('Client ID:', clientId);
}

main().catch((err) => {
  console.error('SEED FAILED:', err.response?.data || err.message);
  process.exit(1);
});
