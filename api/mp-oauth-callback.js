import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { code, state: comercioId } = req.query;
  if (!code || !comercioId) {
    return res.status(400).send('Faltan parámetros de Mercado Pago');
  }

  try {
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.MP_CLIENT_ID,
        client_secret: process.env.MP_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.PUBLIC_URL}/api/mp-oauth-callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Error de Mercado Pago:', tokenData);
      return res.status(500).send('No se pudo vincular la cuenta de Mercado Pago');
    }

    const { error } = await supabase
      .from('comercios')
      .update({
        mp_access_token: tokenData.access_token,
        mp_refresh_token: tokenData.refresh_token,
        mp_user_id: String(tokenData.user_id),
      })
      .eq('id', comercioId);

    if (error) {
      console.error(error);
      return res.status(500).send('No se pudo guardar la vinculación');
    }

    res.writeHead(302, { Location: `${process.env.PUBLIC_URL}/?mp=conectado` });
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error inesperado vinculando Mercado Pago');
  }
}
