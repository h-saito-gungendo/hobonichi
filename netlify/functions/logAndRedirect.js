const fetch = require('node-fetch'); // Node.js 18未満なら必要

exports.handler = async (event, context) => {
  const target = event.queryStringParameters?.target;
  const campaign = event.queryStringParameters?.campaign || 'default_campaign';

  if (!target) {
    return {
      statusCode: 400,
      body: 'Missing target parameter',
    };
  }

  const now = new Date().toISOString();
  const ip = event.headers['x-forwarded-for'] || 'unknown';
  const ua = event.headers['user-agent'] || 'unknown';

  console.log('[ClickLog]', { time: now, ip, ua, target, campaign });

  // ① Measurement Protocol 送信
  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: `${Date.now()}.${Math.floor(Math.random() * 1000000)}`,
          events: [
            {
              name: 'email_click',
              params: {
                target_url: target,
                campaign: campaign,
                platform: 'netlify_function'
              }
            }
          ]
        })
      }
    );
    console.log('[GA4] Measurement Protocol response:', await response.text());
  } catch (err) {
    console.error('[GA4] Failed to send event:', err);
  }

  // ② リダイレクト
  return {
    statusCode: 302,
    headers: {
      Location: target,
      'Cache-Control': 'no-cache',
    },
  };
};
