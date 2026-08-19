import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { bolsaId } = req.body;
  if (!bolsaId) return res.status(400).json({ error: 'Falta bolsaId' });

  const { data: bolsa, error: bolsaError } = await supabase
    .from('bolsas')
    .select('*, comercios(*)')
    .eq('id', bolsaId)
    .single();

  if (bolsaError || !bolsa) {
    return res.status(404).json({ error: 'Bolsa no encontrada' });
  }
  if (bolsa.cantidad <= 0) {
    return res.status(400).json({ error: 'Ya no quedan unidades de esta bolsa' });
  }
  const comercio = bolsa.comercios;
  if (!comercio.mp_access_token) {
    return res.status(400).json({
      error: 'Este comercio todavía no vinculó su cuenta de Mercado Pago',
    });
  }

  const precio = Number(bolsa.precio_descuento);
  const comisionPct = Number(comercio.comision_pct) || 15;
  const montoComision = Math.round(precio * (comisionPct / 100));

  const prefRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${comercio.mp_access_token}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: `${bolsa.descripcion} — ${comercio.nombre}`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: precio,
        },
      ],
      marketplace_fee: montoComision,
      external_reference: bolsa.id,
      back_urls: {
        success: `${process.env.PUBLIC_URL}/?pago=exito`,
        failure: `${process.env.PUBLIC_URL}/?pago=error`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.PUBLIC_URL}/api/webhook`,
    }),
  });

  const pref = await prefRes.json();
  if (!prefRes.ok) {
    console.error('Error creando preferencia:', pref);
    return res.status(500).json({ error: 'No se pudo iniciar el pago' });
  }

  res.status(200).json({ init_point: pref.init_point });
}
