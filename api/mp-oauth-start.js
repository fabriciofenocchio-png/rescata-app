// GET /api/mp-oauth-start?comercioId=xxxx
// Redirige al comercio a la pantalla de Mercado Pago donde autoriza
// que Rescatá reciba una parte de cada pago que reciba (split).
export default function handler(req, res) {
  const { comercioId } = req.query;
  if (!comercioId) {
    return res.status(400).send('Falta comercioId');
  }

  const clientId = process.env.MP_CLIENT_ID;
  const redirectUri = `${process.env.PUBLIC_URL}/api/mp-oauth-callback`;

  const authUrl =
    `https://auth.mercadopago.com/authorization` +
    `?client_id=${clientId}` +
    `&response_type=code` +
    `&platform_id=mp` +
    `&state=${encodeURIComponent(comercioId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.writeHead(302, { Location: authUrl });
  res.end();
}
