import http from 'node:http';

const PORT = Number(process.env.PORT || 5174);
const PINWHEEL_API_BASE_URL = 'https://sandbox.getpinwheel.com';
const DEFAULT_PINWHEEL_VERSION = process.env.PINWHEEL_VERSION || '2025-07-08';

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Pinwheel-Version',
  });
  res.end(payload);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Pinwheel-Version',
    });
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/link-token') {
    sendJson(res, 404, { error: 'not_found' });
    return;
  }

  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    sendJson(res, 400, { error: 'invalid_json', message: String(e?.message || e) });
    return;
  }

  const apiKey = body.apiKey;
  const requestBody = body.requestBody;
  const pinwheelVersion = body.pinwheelVersion || DEFAULT_PINWHEEL_VERSION;

  if (!apiKey || typeof apiKey !== 'string') {
    sendJson(res, 400, { error: 'missing_api_key' });
    return;
  }
  if (!requestBody || typeof requestBody !== 'object') {
    sendJson(res, 400, { error: 'missing_request_body' });
    return;
  }

  try {
    const upstream = await fetch(`${PINWHEEL_API_BASE_URL}/v1/link_tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Pinwheel-Version': pinwheelVersion,
        'x-api-secret': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type') || '';
    const parsed =
      contentType.includes('application/json') && text ? JSON.parse(text) : { raw: text };

    sendJson(res, upstream.status, parsed);
  } catch (e) {
    sendJson(res, 502, { error: 'upstream_error', message: String(e?.message || e) });
  }
});

server.listen(PORT, () => {
  console.log(`Pinwheel dev proxy listening on http://localhost:${PORT}`);
  console.log(
    `Forwarding to ${PINWHEEL_API_BASE_URL}/v1/link_tokens (Pinwheel-Version=${DEFAULT_PINWHEEL_VERSION})`,
  );
});
