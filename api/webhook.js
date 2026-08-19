import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generarCodigo() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

export default async function handler(req, res) {
  try {
    const { type, data } = req.query.type ? req.query : req.body;
    if (type !== 'payment') return res.status(200).end();

    const paymentId = data?.id || req.query['data.id'];
    if (!paymentId) return res.status(200).end();

    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN_PLATAFORMA}` },
    });
    const pago = await payRes.json();

    if (pago.status !== 'approved') return res.status(200).end();

    const bolsaId = pago.external_reference;

    const { data: bolsa } = await supabase
      .from('bolsas')
      .select('*')
      .eq('id', bolsaId)
      .single();

    if (!bolsa || bolsa.cantidad <= 0) return res.status(200).end();

    const { data: existente } = await supabase
      .from('reservas')
      .select('id')
      .eq('mp_payment_id', String(paymentId))
      .maybeSingle();
    if (existente) return res.status(200).end();

    await supabase
      .from('bolsas')
      .update({ cantidad: bolsa.cantidad - 1 })
      .eq('id', bolsaId);

    await supabase.from('reservas').insert({
      bolsa_id: bolsaId,
      codigo: generarCodigo(),
      estado: 'pagada',
      mp_payment_id: String(paymentId),
      monto_total: pago.transaction_amount,
      monto_comision: pago.marketplace_fee || 0,
    });

    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(200).end();
  }
}
