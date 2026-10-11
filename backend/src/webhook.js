// Meta webhook endpoints

const crypto = require('crypto');
const express = require('express');
const { config } = require('./config');
const { processLead } = require('./leadProcessor');

const router = express.Router();

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

function hasValidSignature(req) {
  if (!config.appSecret) return true; 

  const header = req.get('x-hub-signature-256');
  if (!header || !req.rawBody) return false;
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', config.appSecret).update(req.rawBody).digest('hex');
  return safeEqual(header, expected);
}

function extractLeadIds(payload) {
  const leadIds = [];
  const entries = Array.isArray(payload.entry) ? payload.entry : [];

  for (const entry of entries) {
    const changes = entry && Array.isArray(entry.changes) ? entry.changes : [];
    for (const change of changes) {
      if (!change || change.field !== 'leadgen') continue;

      const leadId = change.value && change.value.leadgen_id;
      // Lead ids are numeric strings; reject anything else
      if (leadId && /^\d+$/.test(String(leadId))) {
        leadIds.push(String(leadId));
      } else {
        console.warn('[webhook] leadgen change without a valid leadgen_id, skipped');
      }
    }
  }
  return [...new Set(leadIds)];
}

// Verification handshake: Meta calls this once when the callback URL is saved.
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && typeof token === 'string' && safeEqual(token, config.verifyToken)) {
    console.log('[webhook] verification succeeded');
    return res.status(200).type('text/plain').send(String(challenge ?? ''));
  }

  console.warn('[webhook] verification failed: wrong mode or verify token');
  return res.sendStatus(403);
});

// notification
router.post('/', (req, res) => {
  if (!hasValidSignature(req)) {
    console.warn('[webhook] rejected: missing or invalid X-Hub-Signature-256');
    return res.sendStatus(401);
  }

  const payload = req.body;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return res.status(400).json({ error: 'Malformed webhook payload' });
  }
  if (payload.object !== 'page') {
    return res.sendStatus(404);
  }
  const leadIds = extractLeadIds(payload);
  res.status(200).send('EVENT_RECEIVED');

  if (leadIds.length === 0) {
    console.log('[webhook] notification contained no leadgen ids');
    return;
  }

  console.log(`[webhook] received leadgen ids: ${leadIds.join(', ')}`);
  for (const leadId of leadIds) {
    processLead(leadId);
  }
});

module.exports = router;
