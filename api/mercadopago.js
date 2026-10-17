export default async function handler(req, res) {
  // Configuraciones de seguridad
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
    
    // Leemos el carrito y armamos la lista para Mercado Pago
    const items = carrito.map((item) => {
      const tieneDescuento = item.descuento > 0;
      const precioFinal = tieneDescuento ? item.precio * (1 - (item.descuento / 100)) : item.precio;
      
      return {
        title: item.nombre,
        unit_price: parseFloat(precioFinal),
        quantity: 1,
        currency_id: "ARS"
      };
    });

    // Configuramos el link de pago
    const preference = {
      items: items,
      back_urls: {
        success: "https://el-viento-shop.vercel.app/cuenta", // A donde vuelve si paga bien
        failure: "https://el-viento-shop.vercel.app/",
        pending: "https://el-viento-shop.vercel.app/cuenta"
      },
      auto_return: "approved"
    };

    // Nos comunicamos en secreto con Mercado Pago
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preference)
    });

    const mpData = await mpResponse.json();

    // Le devolvemos el link de cobro a tu página
    res.status(200).json({ init_point: mpData.init_point });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}