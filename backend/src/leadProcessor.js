// Turns a lead id from a webhook into a stored, broadcast lead.

const { fetchLead } = require('./graphApi');
const leadStore = require('./leadStore');
const realtime = require('./realtime');

// Field names Meta uses for the standard contact questions.
const NAME_FIELDS = ['full_name', 'name'];
const EMAIL_FIELDS = ['email', 'work_email'];
const PHONE_FIELDS = ['phone_number', 'phone', 'work_phone_number'];

function pick(fields, names) {
  for (const name of names) {
    if (fields[name]) return fields[name];
  }
  return null;
}

 
function normalizeLead(raw, leadId) {
  if (!raw || typeof raw !== 'object' || !raw.id) {
    throw new Error('Graph API response has no lead id');
  }
  if (String(raw.id) !== String(leadId)) {
    throw new Error(`Graph API returned lead ${raw.id}, expected ${leadId}`);
  }

  const fields = {};
  const fieldData = Array.isArray(raw.field_data) ? raw.field_data : [];
  for (const item of fieldData) {
    if (!item || typeof item.name !== 'string') continue;
    const values = Array.isArray(item.values) ? item.values : [];
    const value = values
      .map((v) => String(v).trim())
      .filter(Boolean)
      .join(', ');
    if (value) fields[item.name] = value;
  }

  const splitName = [fields.first_name, fields.last_name].filter(Boolean).join(' ');

  return {
    id: String(raw.id),
    name: pick(fields, NAME_FIELDS) || splitName || null,
    email: pick(fields, EMAIL_FIELDS),
    phone: pick(fields, PHONE_FIELDS),
    fields,
    formId: raw.form_id || null,
    adId: raw.ad_id || null,
    createdTime: raw.created_time || null,
    receivedAt: new Date().toISOString(),
  };
}


async function processLead(leadId) {
  if (!leadStore.claim(leadId)) {
    console.log(`[lead] ${leadId}: duplicate notification ignored`);
    return;
  }

  try {
    const raw = await fetchLead(leadId);
    const lead = normalizeLead(raw, leadId);

    if (leadStore.add(lead)) {
      realtime.broadcastNewLead(lead);
      console.log(`[lead] ${leadId}: stored and broadcast (${leadStore.count()} total)`);
    }
  } catch (err) {
    leadStore.release(leadId);

    if (err.code === 190) {
      console.error(
        `[lead] ${leadId}: access token is invalid or expired. Generate a new Page access token and update META_PAGE_ACCESS_TOKEN.`
      );
    } else {
      const detail = err.code ? ` (Graph code ${err.code})` : '';
      console.error(`[lead] ${leadId}: could not be processed${detail}: ${err.message}`);
    }
  }
}

module.exports = { processLead, normalizeLead };
