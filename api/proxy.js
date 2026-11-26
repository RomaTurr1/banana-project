export default async function handler(req, res) {
  try {
    // req.url looks like /api/proxy?path=artworks/search&q=cats...
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const path = urlObj.searchParams.get('path') || '';
    urlObj.searchParams.delete('path');

    const queryString = urlObj.searchParams.toString();
    const targetUrl = `https://api.artic.edu/api/v1/${path}${queryString ? `?${queryString}` : ''}`;

    const upstream = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MyExpoApp/1.0',
      },
    });

    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.send(body);
  } catch (err) {
    res.status(502).json({ error: err.message || 'Upstream fetch failed' });
  }
}
