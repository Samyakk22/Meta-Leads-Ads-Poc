const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = {
  port: Number(process.env.PORT) || 3000,
  verifyToken: process.env.META_VERIFY_TOKEN || '',
  pageAccessToken: process.env.META_PAGE_ACCESS_TOKEN || '',
  appSecret: process.env.META_APP_SECRET || '',
  graphVersion: process.env.META_GRAPH_VERSION || 'v24.0',
 
  graphBaseUrl: process.env.META_GRAPH_BASE_URL || 'https://graph.facebook.com',
};

function assertConfig() {
  const missing = [];
  if (!config.verifyToken) missing.push('META_VERIFY_TOKEN');
  if (!config.pageAccessToken) missing.push('META_PAGE_ACCESS_TOKEN');

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Copy backend/.env.example to backend/.env and fill them in.'
    );
    process.exit(1);
  }

  if (!config.appSecret) {
    console.warn(
      '[config] META_APP_SECRET is not set: webhook signatures will NOT be verified.'
    );
  }
}

module.exports = { config, assertConfig };
