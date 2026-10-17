export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { carrito } = req.body;
    
    // DIAGNÓSTICO: Obligamos a Vercel a decirnos qué token está usando
    const token = process.env.MP_ACCESS_TOKEN;
    console.log("¿Vercel detectó el token?:", token ? "SÍ" : "NO");
    console.log("El token empieza con:", token ? token.substring(0, 10) + "..." : "VACÍO");

    const items = carrito.map((item) => {
      const tieneDescuento = item.descuento > 0;
      const precioFinal = tieneDescuento ? item.precio * (1 - (item.descuento / 100)) : item.precio;
      
      return {
        title: item.nombre,
        unit_price: Number(precioFinal),
        quantity: 1,
        currency_id: "ARS"
      };
    });

    const preference = {
      items: items,
      back_urls: {
        success: "https://el-viento-shop.vercel.app/cuenta",
        failure: "https://el-viento-shop.vercel.app/",
        pending: "https://el-viento-shop.vercel.app/cuenta"
      },
      auto_return: "approved"
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preference)
    });

    const mpData = await mpResponse.json();
    console.log("RESPUESTA DE MERCADO PAGO:", mpData);

    if (!mpResponse.ok || !mpData.init_point) {
      return res.status(400).json({ error: "Rechazado por MP", detalle: mpData });
    }

    res.status(200).json({ init_point: mpData.init_point });
    
  } catch (error) {
    console.error("ERROR DE SERVIDOR:", error.message);
    res.status(500).json({ error: error.message });
  }
}