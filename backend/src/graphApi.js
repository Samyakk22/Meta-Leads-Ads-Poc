// Meta Graph API communication: fetches the details of a single lead.

const { config } = require('./config');

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 1_000;

// Graph error codes
const TRANSIENT_CODES = new Set([1, 2, 4, 17, 32, 341, 613]);

class GraphApiError extends Error {
  constructor(message, { status, code, type, retryable } = {}) {
    super(message);
    this.name = 'GraphApiError';
    this.status = status;
    this.code = code;
    this.type = type;
    this.retryable = Boolean(retryable);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestLead(leadId) {
  const url = new URL(
    `${config.graphBaseUrl}/${config.graphVersion}/${encodeURIComponent(leadId)}`
  );
  url.searchParams.set('fields', 'id,created_time,field_data,form_id,ad_id');

  let response;
  try {
    response = await fetch(url, {
      // Header rather than query string so the token never ends up in logs.
      headers: { Authorization: `Bearer ${config.pageAccessToken}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw new GraphApiError(`Network error calling Graph API: ${err.message}`, {
      retryable: true,
    });
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    
  }

  if (!response.ok || !body || body.error) {
    const error = (body && body.error) || {};
    const retryable =
      response.status >= 500 ||
      response.status === 429 ||
      error.is_transient === true ||
      TRANSIENT_CODES.has(error.code);

    throw new GraphApiError(
     error.message || `Graph API responded with HTTP ${response.status}`,
      { status: response.status, code: error.code, type: error.type, retryable }
    );
  }

  return body;
}

async function fetchLead(leadId) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await requestLead(leadId);
    } catch (err) {
      if (!err.retryable || attempt >= MAX_ATTEMPTS) throw err;

      const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `[graph] lead ${leadId}: attempt ${attempt}/${MAX_ATTEMPTS} failed (${err.message}); retrying in ${delay}ms`
      );
  await sleep(delay);
    }
  }
}

module.exports = { fetchLead, GraphApiError };
