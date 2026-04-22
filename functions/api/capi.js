export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const {
      event_name,
      event_id,
      event_source_url,
      fbp,
      fbc,
      custom_data = {}
    } = body;

    const ip =
      context.request.headers.get('CF-Connecting-IP') ||
      context.request.headers.get('X-Forwarded-For') ||
      '';

    const userAgent = context.request.headers.get('User-Agent') || '';

    const payload = {
      data: [
        {
          event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id,
          action_source: 'website',
          event_source_url,
          user_data: {
            ...(ip ? { client_ip_address: ip } : {}),
            ...(userAgent ? { client_user_agent: userAgent } : {}),
            ...(fbp ? { fbp } : {}),
            ...(fbc ? { fbc } : {})
          },
          custom_data
        }
      ]
    };

    const testCode = context.env.META_TEST_EVENT_CODE;
    if (testCode) payload.test_event_code = testCode;

    const url = `https://graph.facebook.com/v19.0/${context.env.META_PIXEL_ID}/events?access_token=${context.env.META_CAPI_TOKEN}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const metaResponse = await response.text();

    return new Response(
      JSON.stringify({
        success: response.ok,
        meta: metaResponse
      }),
      {
        status: response.ok ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
