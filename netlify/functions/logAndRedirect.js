exports.handler = async (event) => {
  // ① slug を取得
  const slug = event.queryStringParameters?.slug;

  // ② slug から target / campaign を決定
  const MAP = {
    hobo: {
      target: 'https://www.youtube.com/watch?v=GJKuDaL9r84',
      campaign: 'JOIN20250508',
    },
    // 例）ほかの短縮リンク
    // greet: {
    //   target: 'https://example.com/hello',
    //   campaign: 'GREETING2025',
    // },
  };

  const entry = MAP[slug];
  if (!entry) {
    return { statusCode: 404, body: 'Unknown slug' };
  }

  const { target, campaign } = entry;

  // ③ クリックログ
  const now = new Date().toISOString();
  const ip  = event.headers['x-forwarded-for'] || 'unknown';
  const ua  = event.headers['user-agent']      || 'unknown';

  console.log('[ClickLog]', { time: now, ip, ua, target, campaign });

  // ④ Measurement Protocol（Node18+ は fetch 組み込み）
  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: `${Date.now()}.${Math.floor(Math.random() * 1e6)}`,
          events: [
            {
              name: 'email_click',
              params: {
                target_url: target,
                campaign: campaign,
                platform: 'netlify_function',
              },
            },
          ],
        }),
      }
    );
  } catch (err) {
    console.error('[GA4] Failed to send event:', err);
  }

  // ⑤ リダイレクト
  return {
    statusCode: 302,
    headers: {
      Location: target,
      'Cache-Control': 'no-cache',
    },
  };
};
