const BLOB_URL = 'https://jsonblob.com/api/jsonBlob/019cad68-da04-783a-938f-35ead1322b98';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const r = await fetch(BLOB_URL, { headers: { 'Accept': 'application/json' } });
    const data = await r.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(r.status).send(data);
  }

  if (req.method === 'PUT') {
    let body = '';
    for await (const chunk of req) body += chunk;
    const r = await fetch(BLOB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body
    });
    return res.status(r.status).json({ ok: r.ok });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
