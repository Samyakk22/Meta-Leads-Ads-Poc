// In-memory lead storage

const leads = new Map(); 
const inFlight = new Set(); 

function claim(leadId) {
  if (leads.has(leadId) || inFlight.has(leadId)) return false;
  inFlight.add(leadId);
  return true;
}

function release(leadId) {
  inFlight.delete(leadId);
}

function add(lead) {
  inFlight.delete(lead.id);
  if (leads.has(lead.id)) return false;
  leads.set(lead.id, lead);
  return true;
}

function all() {
  return Array.from(leads.values()).reverse();
}

function count() {
  return leads.size;
}

module.exports = { claim, release, add, all, count };
