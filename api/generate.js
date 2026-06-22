export const config = { runtime: 'edge' };

const ACCESS_CODE = '3503';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Guard — reject requests without the valid access code
  if (body.accessCode !== ACCESS_CODE) {
    return new Response('Unauthorized', { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response('API key not configured on server', { status: 500 });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 900,
      system: body.system,
      messages: [{ role: 'user', content: body.prompt }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return new Response(JSON.stringify({ error: data?.error?.message || 'Claude API error' }), {
      status: response.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ text: data.content?.[0]?.text?.trim() || '' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
