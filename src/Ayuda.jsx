import React from 'react';

export default function Ayuda() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-3xl font-black text-gray-900 mb-8 border-b pb-4 border-yellow-400">
          Centro de Ayuda y Preguntas Frecuentes
        </h1>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">¿Dónde están ubicados?</h3>
            <p className="text-gray-600 mt-2">
              Nuestro local comercial está ubicado en la ciudad de Las Heras, provincia de Santa Cruz. Podés pasar a retirar tus repuestos directamente por nuestra sucursal.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800">¿Hacen envíos a otras localidades?</h3>
            <p className="text-gray-600 mt-2">
              Sí, despachamos pedidos a través de Correo Argentino a toda la región y al resto del país. Al momento de comprar vas a poder coordinar la opción de envío.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800">¿Cuáles son las formas de pago?</h3>
            <p className="text-gray-600 mt-2">
              Aceptamos pagos seguros a través de Mercado Pago con tarjetas de crédito, débito o dinero en cuenta. También podés elegir "Acordar con el vendedor" si preferís transferir o pagar en el local.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800">Políticas de Devolución</h3>
            <p className="text-gray-600 mt-2">
              Si el repuesto no es el correcto o tiene alguna falla de fábrica, tenés 10 días para realizar el cambio. El producto debe estar en su empaque original sin indicios de uso.
            </p>
          </div>
        </div>

        {/* Botón de WhatsApp al final */}
        <div className="mt-12 bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
          <h4 className="text-xl font-bold text-gray-800 mb-2">¿Seguís con dudas?</h4>
          <p className="text-gray-600 mb-6">Contactate directamente con nosotros y te asesoramos al instante.</p>
          <a 
            href="https://wa.me/5492974377349" 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center gap-2 bg-[#00A650] hover:bg-[#008f45] text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Chatear por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}