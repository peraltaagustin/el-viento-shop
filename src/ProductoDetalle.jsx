import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabase';
import { ShoppingCart, ShieldCheck, Truck, Clock, Search, User, Zap, ChevronRight, X, Trash2, ChevronDown, Menu } from 'lucide-react';

export default function ProductoDetalle({ numeroWhatsApp }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [imagenActiva, setImagenActiva] = useState('');

  const [carrito, setCarrito] = useState([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);

  const categoriasMenu = ['Motor', 'Frenos', 'Herramientas', 'Accesorios', 'Baterías', 'Suspensión', 'Lubricantes'];

  useEffect(() => {
    const carritoGuardado = JSON.parse(localStorage.getItem('carrito') || '[]');
    setCarrito(carritoGuardado);
  }, []);

  const guardarCarrito = (nuevoCarrito) => {
    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
  };

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      window.scrollTo(0, 0); 

      const { data: prodData, error: prodError } = await supabase.from('productos').select('*').eq('id', id).single();

      if (!prodError && prodData) {
        setProducto(prodData);
        setCantidad(1);
        if (prodData.galeria && prodData.galeria.length > 0) setImagenActiva(prodData.galeria[0]);
        else setImagenActiva(prodData.imagen_url || 'https://placehold.co/600x600/eeeeee/a3a3a3?text=Sin+Imagen');
        
        const { data: relData } = await supabase.from('productos').select('*').eq('categoria', prodData.categoria).neq('id', id).limit(4);
        if (relData) setRelacionados(relData);
      }
      setCargando(false);
    }
    cargarDatos();
  }, [id]);

  const agregarAlCarritoActual = () => {
    const nuevosItems = Array(cantidad).fill(producto);
    guardarCarrito([...carrito, ...nuevosItems]);
    setCarritoAbierto(true);
  };

  const eliminarDelCarrito = (indice) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito.splice(indice, 1);
    guardarCarrito(nuevoCarrito);
  };

  const totalCarrito = carrito.reduce((total, item) => {
    const tieneDescuento = item.descuento > 0;
    const precioFinal = tieneDescuento ? item.precio * (1 - (item.descuento / 100)) : item.precio;
    return total + precioFinal;
  }, 0);

  const enviarPedido = async () => {
    if (carrito.length === 0) return;

    // CANDADO: Verificamos si el usuario está logueado
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      alert("Para finalizar tu compra y coordinar el envío, por favor iniciá sesión o creá una cuenta.");
      setCarritoAbierto(false);
      navigate('/cuenta');
      return; // Frenamos la ejecución acá
    }
    
    let detalleTexto = "";
    carrito.forEach((item) => {
      const tieneDescuento = item.descuento > 0;
      const precioFinal = tieneDescuento ? item.precio * (1 - (item.descuento / 100)) : item.precio;
      detalleTexto += `- ${item.nombre} ($${precioFinal.toLocaleString('es-AR')})\n`;
    });
    
    const { error } = await supabase.from('pedidos').insert([
      { cliente_id: authData.session.user.id, detalle: detalleTexto, total: totalCarrito, estado: 'Pendiente' }
    ]);
    if (error) {
      alert("⚠️ Error al procesar tu pedido: " + error.message);
      return; 
    }

    let mensaje = "👋 ¡Hola El Viento! Quiero encargar estos repuestos:\n\n";
    carrito.forEach((item) => {
      const tieneDescuento = item.descuento > 0;
      const precioFinal = tieneDescuento ? item.precio * (1 - (item.descuento / 100)) : item.precio;
      mensaje += `🔧 ${item.nombre} $${precioFinal.toLocaleString('es-AR')}\n`;
    });
    mensaje += `\n💰 *Total estimado: $${totalCarrito.toLocaleString('es-AR')}*`;
    
    window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`, '_blank');
    
    setCarrito([]);
    localStorage.removeItem('carrito');
    setCarritoAbierto(false);
  };

  const pagarConMercadoPago = async () => {
    if (carrito.length === 0) return;

    // CANDADO: Verificamos si el usuario está logueado
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      alert("Para abonar online y coordinar el envío, por favor iniciá sesión o creá una cuenta.");
      setCarritoAbierto(false);
      navigate('/cuenta');
      return; // Frenamos la ejecución acá
    }

    setProcesandoPago(true);

    let detalleTexto = "";
    carrito.forEach((item) => {
      const tieneDescuento = item.descuento > 0;
      const precioFinal = tieneDescuento ? item.precio * (1 - (item.descuento / 100)) : item.precio;
      detalleTexto += `- ${item.nombre} ($${precioFinal.toLocaleString('es-AR')})\n`;
    });

    await supabase.from('pedidos').insert([
      { cliente_id: authData.session.user.id, detalle: detalleTexto, total: totalCarrito, estado: 'Pendiente' }
    ]);

    try {
      const res = await fetch('/api/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrito })
      });
      const data = await res.json();
      if (data.init_point) {
        setCarrito([]);
        localStorage.removeItem('carrito');
        window.location.href = data.init_point;
      } else {
        alert("Error de Mercado Pago. Recordá que esta función requiere subir la página a Vercel.");
      }
    } catch (e) {
      alert("La conexión con Mercado Pago solo funciona cuando la página está subida a Vercel. Por ahora usá el botón de WhatsApp.");
    }
    setProcesandoPago(false);
  };

  const manejarCompraRapida = () => {
    agregarAlCarritoActual();
  };

  const ejecutarBusqueda = (e) => {
    e.preventDefault();
    if(busqueda.trim()) navigate(`/catalogo?q=${busqueda}`);
  };

  const seleccionarCategoria = (cat) => {
    navigate(`/catalogo?cat=${cat}`);
    setMenuAbierto(false);
  };

  if (cargando) return <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center text-xl font-bold">Cargando detalles...</div>;
  if (!producto) return <div className="min-h-screen bg-[#F4F4F4] flex flex-col items-center justify-center font-sans"><h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2><button onClick={() => navigate('/')} className="text-marca-amarillo font-bold hover:underline">Volver al inicio</button></div>;

  const tieneDescuento = producto.descuento > 0;
  const precioFinal = tieneDescuento ? producto.precio * (1 - (producto.descuento / 100)) : producto.precio;
  const ahorro = producto.precio - precioFinal;
  const cuotas = producto.cuotas || 1;
  const valorCuota = cuotas > 1 ? precioFinal / cuotas : 0;
  const tieneStock = producto.hay_stock !== false;
  const imagenesGaleria = producto.galeria && producto.galeria.length > 0 ? producto.galeria : [producto.imagen_url];

  return (
    <div className="min-h-screen bg-[#F4F4F4] font-sans relative pb-16">
      
      {/* HEADER */}
      <header className="bg-[#111111] text-white sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-4 md:gap-8">
          <div className="flex items-center gap-3 cursor-pointer min-w-max" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="Logo El Viento" className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/FACC15/111827?text=EV'; }} />
            <div className="hidden sm:flex flex-col">
              <span className="text-2xl md:text-3xl font-black tracking-tight leading-none text-white drop-shadow-md">EL VIENTO</span>
              <span className="text-[10px] text-marca-amarillo font-bold tracking-[0.2em] mt-1 uppercase">Servicios & Repuestos</span>
            </div>
          </div>
          <form onSubmit={ejecutarBusqueda} className="flex-1 max-w-2xl flex shadow-md">
            <input type="text" placeholder="Buscar productos, marcas y más..." className="w-full py-2.5 md:py-3.5 px-4 text-black focus:outline-none text-sm md:text-base rounded-l border-none bg-white" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <button type="submit" className="bg-marca-amarillo px-4 md:px-8 flex items-center justify-center hover:bg-yellow-500 transition-colors rounded-r"><Search className="text-marca-negro w-5 h-5" /></button>
          </form>
          <div className="flex items-center gap-6">
            <div onClick={() => navigate('/cuenta')} className="hidden md:flex items-center gap-3 cursor-pointer hover:text-marca-amarillo transition-colors">
              <User className="w-7 h-7" />
              <div className="flex flex-col"><span className="text-sm font-bold leading-tight">Mi Cuenta</span><span className="text-[11px] text-gray-400">Ingresar o Registrarse</span></div>
            </div>
            <div className="flex items-center gap-2 cursor-pointer hover:text-marca-amarillo transition-colors relative" onClick={() => setCarritoAbierto(true)}>
              <div className="p-2 relative"><ShoppingCart className="w-7 h-7 md:w-8 md:h-8" /><span className="absolute -top-1 -right-1 bg-marca-amarillo text-marca-negro text-[11px] font-black w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center border-2 border-marca-negro">{carrito.length}</span></div>
            </div>
          </div>
        </div>

        <div className="bg-[#EBEBEB] border-b border-gray-300 relative">
          <div className="max-w-[1400px] mx-auto flex items-center text-sm font-bold h-12">
            <div className="h-full bg-white text-marca-negro px-6 flex items-center gap-2 cursor-pointer border-r border-l border-gray-300 hover:bg-gray-50 transition-colors relative" onMouseEnter={() => setMenuAbierto(true)} onMouseLeave={() => setMenuAbierto(false)}>
              <Menu className="w-5 h-5 text-marca-amarillo" />
              <span className="uppercase text-marca-negro tracking-wide">Categorías</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
              <div className={`absolute top-12 left-0 w-64 bg-white border-x border-b border-gray-200 shadow-2xl z-50 flex flex-col py-2 transition-all duration-300 origin-top ${menuAbierto ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-90 invisible'}`}>
                <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-marca-negro font-black border-b border-gray-100 hover:text-marca-amarillo transition-colors" onClick={() => seleccionarCategoria('Todas')}>Todas las categorías</div>
                {categoriasMenu.map(cat => (<div key={cat} className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-gray-700 hover:text-marca-amarillo border-l-4 border-transparent hover:border-marca-amarillo transition-all" onClick={() => seleccionarCategoria(cat)}>{cat}</div>))}
              </div>
            </div>
            <ul className="flex items-center gap-6 px-6 text-gray-600 hidden lg:flex">
              <li onClick={() => navigate('/catalogo')} className="cursor-pointer hover:text-marca-negro transition-colors uppercase tracking-wide">Ver todo el Catálogo</li>
              <li className="cursor-pointer hover:text-marca-negro transition-colors uppercase tracking-wide">Cuotas sin Interés</li>
            </ul>
            <div className="ml-auto px-4 hidden md:block"><span className="text-marca-amarillo bg-marca-negro px-3 py-1.5 text-xs rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm"><Zap className="w-3 h-3" /> Especial Talleres</span></div>
          </div>
        </div>
      </header>

      {/* MIGA DE PAN */}
      <div className="max-w-[1400px] mx-auto px-4 py-4 text-sm text-gray-500 font-medium flex items-center gap-2">
        <span onClick={() => navigate('/')} className="cursor-pointer hover:text-marca-amarillo transition-colors">Inicio</span>
        <ChevronRight className="w-3 h-3" />
        <span onClick={() => seleccionarCategoria(producto.categoria)} className="cursor-pointer hover:text-marca-amarillo transition-colors">{producto.categoria}</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-400 uppercase text-xs tracking-wider">{producto.nombre.substring(0, 30)}...</span>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="w-full lg:w-2/3 flex flex-col gap-8">
            <div className="bg-white rounded p-8 border border-gray-200 shadow-sm flex flex-col items-center relative">
              {!tieneStock && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded">
                  <span className="bg-red-600 text-white font-black px-6 py-3 rounded text-xl uppercase tracking-widest rotate-[-10deg] border-4 border-white shadow-2xl">Agotado</span>
                </div>
              )}
              {producto.envio_gratis && (
                <div className="w-full flex justify-start mb-4 z-0">
                  <span className="text-sm font-bold text-[#00A650] flex items-center gap-1"><Truck className="w-5 h-5" /> Envío GRATIS</span>
                </div>
              )}
              <div className="w-full h-[400px] flex items-center justify-center mb-8 z-0">
                <img src={imagenActiva} alt={producto.nombre} className={`max-w-full max-h-full object-contain ${!tieneStock ? 'grayscale' : ''}`} />
              </div>
              {imagenesGaleria.length > 1 && (
                <div className="flex gap-4 overflow-x-auto py-2 px-2 no-scrollbar w-full justify-center z-0">
                  {imagenesGaleria.map((imgUrl, idx) => (
                    <div key={idx} onClick={() => setImagenActiva(imgUrl)} className={`w-20 h-20 rounded border-2 p-1 cursor-pointer flex items-center justify-center ${imagenActiva === imgUrl ? 'border-marca-amarillo' : 'border-gray-200 hover:border-gray-400'}`}>
                      <img src={imgUrl} alt={`Vista ${idx+1}`} className={`max-w-full max-h-full object-contain ${!tieneStock ? 'grayscale' : ''}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded p-8 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-marca-negro border-b border-gray-200 pb-2">Características y Descripción</h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm md:text-base">
                {producto.descripcion || "Este repuesto es una opción práctica y funcional, ideal para el uso diario en el taller o para el mantenimiento de tu vehículo."}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded p-6 lg:p-8 border border-gray-200 shadow-sm sticky top-36">
              {!tieneStock && (
                <div className="bg-red-50 border border-red-200 text-red-600 font-bold p-3 rounded mb-4 text-sm text-center uppercase tracking-wide">
                  Producto temporalmente sin stock
                </div>
              )}
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight mb-6">{producto.nombre}</h1>

              <div className="mb-6 flex flex-col items-start gap-1">
                {tieneDescuento && <div className="text-gray-400 text-sm line-through">$ {producto.precio.toLocaleString('es-AR')}</div>}
                <div className="flex items-center gap-4 w-full">
                  <span className="text-4xl md:text-5xl font-black text-marca-negro">$ {precioFinal.toLocaleString('es-AR')}</span>
                  {tieneDescuento && (
                    <div className="flex flex-col items-center">
                      <span className="bg-[#00A650] text-white font-black text-xs px-2 py-1 rounded">{producto.descuento}% OFF</span>
                      <span className="text-[#FF6B00] text-[10px] font-bold mt-1 border border-[#FF6B00] px-1 rounded">AHORRO ${ahorro.toLocaleString('es-AR')}</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">Precio con impuestos incluidos.</div>
              </div>

              {cuotas > 1 && (
                <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-6">
                  <div className="text-lg font-bold text-marca-negro mb-1">{cuotas} Sin Interés: <span className="text-[#FF6B00]">$ {valorCuota.toLocaleString('es-AR', {maximumFractionDigits: 0})}</span></div>
                  <div className="flex gap-2 mt-2">
                    <div className="bg-[#00579F] text-white text-[9px] font-bold px-1 rounded flex items-center justify-center">VISA</div>
                    <div className="bg-[#FF5F00] text-white text-[9px] font-bold px-1 rounded flex items-center justify-center">MASTER</div>
                    <div className="bg-[#00AEEF] text-white text-[9px] font-bold px-1 rounded flex items-center justify-center">AMEX</div>
                  </div>
                </div>
              )}

              {tieneStock ? (
                <>
                  <div className="flex items-center gap-4 mb-6 border-y border-gray-200 py-4">
                    <span className="text-sm font-bold text-gray-700">Cantidad:</span>
                    <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                      <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="px-3 py-1 bg-white hover:bg-gray-100 font-bold transition-colors">-</button>
                      <span className="w-10 text-center text-sm font-bold border-x border-gray-300">{cantidad}</span>
                      <button onClick={() => setCantidad(cantidad + 1)} className="px-3 py-1 bg-white hover:bg-gray-100 font-bold transition-colors">+</button>
                    </div>
                    <span className="text-xs font-bold text-[#00A650]">¡Últimos Disponibles!</span>
                  </div>

                  <div className="flex flex-col gap-3 mb-8">
                    <button onClick={manejarCompraRapida} className="w-full bg-[#00A650] text-white font-black py-3.5 rounded hover:bg-[#008A43] transition-colors text-center text-sm uppercase tracking-wide shadow-md">
                      COMPRAR AHORA
                    </button>
                    <button onClick={agregarAlCarritoActual} className="w-full bg-white border-2 border-[#00A650] text-[#00A650] font-black py-3 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
                      <ShoppingCart className="w-5 h-5" /> AGREGAR AL CARRITO
                    </button>
                  </div>
                </>
              ) : (
                <div className="mb-8 border-t border-gray-200 pt-6">
                  <div className="w-full bg-gray-200 text-gray-400 font-black py-4 rounded cursor-not-allowed text-center text-sm uppercase tracking-wide border-2 border-gray-300">
                    AGOTADO
                  </div>
                </div>
              )}

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3 text-gray-600">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 text-gray-400" />
                  <div><p className="font-bold text-marca-negro">Compra Segura</p><p className="text-xs">Tus datos siempre protegidos.</p></div>
                </div>
                {producto.envio_gratis ? (
                  <div className="flex items-start gap-3 text-gray-600">
                    <Truck className="w-5 h-5 flex-shrink-0 text-[#00A650]" />
                    <div><p className="font-bold text-[#00A650]">Envío GRATIS a tu sucursal</p><p className="text-xs">Disponible en todo Santa Cruz.</p></div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 text-gray-600">
                    <Truck className="w-5 h-5 flex-shrink-0 text-gray-400" />
                    <div><p className="font-bold text-marca-negro">Envío a domicilio</p><p className="text-xs text-marca-amarillo cursor-pointer font-bold">Calcular costo de envío</p></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RELACIONADOS */}
        {relacionados.length > 0 && (
          <div className="pt-8">
            <h2 className="text-2xl font-black text-marca-negro mb-8 border-b-2 border-marca-negro inline-block pb-1">
              Quienes vieron esto, también compraron
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {relacionados.map((prod) => {
                const tieneDescRel = prod.descuento > 0;
                const finalRel = tieneDescRel ? prod.precio * (1 - (prod.descuento / 100)) : prod.precio;
                const stockRel = prod.hay_stock !== false;

                return (
                  <Link key={prod.id} to={`/producto/${prod.id}`} className={`bg-white rounded p-4 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative ${!stockRel ? 'opacity-80' : ''}`}>
                    {tieneDescRel && <div className="absolute top-2 right-2 bg-[#00A650] text-white font-black text-xs px-2 py-1 rounded z-10 shadow-sm">{prod.descuento}% OFF</div>}
                    <div className="relative">
                      {!stockRel && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-20 flex items-center justify-center rounded">
                          <span className="bg-red-600 text-white font-bold px-2 py-1 text-[10px] rounded uppercase tracking-widest rotate-[-10deg] border border-white">Agotado</span>
                        </div>
                      )}
                      <div className="relative mb-4 h-32 flex items-center justify-center p-2">
                        <img src={prod.galeria && prod.galeria.length > 0 ? prod.galeria[0] : prod.imagen_url || 'https://placehold.co/400'} alt={prod.nombre} className={`max-w-full max-h-full object-contain transition-transform duration-500 ${stockRel ? 'group-hover:scale-105' : 'grayscale'}`} />
                      </div>
                      <h3 className="text-xs text-gray-700 leading-snug mb-2 line-clamp-2 min-h-[32px] group-hover:text-marca-negro transition-colors">{prod.nombre}</h3>
                    </div>
                    <div className="mt-auto">
                      {tieneDescRel ? <div className="text-gray-400 text-[10px] line-through mb-0.5">${prod.precio.toLocaleString('es-AR')}</div> : <div className="h-3.5"></div>}
                      <div className="text-lg font-black text-marca-negro mb-3">${finalRel.toLocaleString('es-AR')}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#111111] text-gray-300 pt-16 pb-8 border-t-[6px] border-marca-amarillo w-full mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="Logo El Viento" className="w-12 h-12 object-contain drop-shadow" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/FACC15/111827?text=EV'; }} />
              <div className="flex flex-col"><span className="text-2xl font-black tracking-tight leading-none text-white">EL VIENTO</span><span className="text-[10px] text-marca-amarillo tracking-[0.1em] mt-1 uppercase font-bold">Servicios & Repuestos</span></div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">Tu tienda de confianza para repuestos, accesorios y herramientas de mecánica automotriz en toda la región de Santa Cruz.</p>
          </div>
          <div>
            <h4 className="text-lg font-black uppercase tracking-wider mb-6 text-white">Atención al Cliente</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors">
                <ChevronRight className="w-4 h-4 text-marca-amarillo" />
                <Link className="text-gray-400 hover:text-white" to="/ayuda">Centro de Ayuda</Link>
              </li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors">
                <ChevronRight className="w-4 h-4 text-marca-amarillo" />
                <a href="https://www.correoargentino.com.ar/formularios/e-commerce" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white">Seguimiento de Envíos</a>
              </li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors">
                <ChevronRight className="w-4 h-4 text-marca-amarillo" />
                <a href={`https://wa.me/${numeroWhatsApp}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white">Contacto Directo</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-black uppercase tracking-wider mb-6 text-white">Categorías</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /> <Link className="text-gray-400 hover:text-white" to="/catalogo?cat=Herramientas">Herramientas Manuales</Link></li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /> <Link className="text-gray-400 hover:text-white" to="/catalogo?cat=Lubricantes">Filtros y Lubricantes</Link></li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /> <Link className="text-gray-400 hover:text-white" to="/catalogo?cat=Eléctrico">Iluminación y Eléctrico</Link></li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /> <Link className="text-gray-400 hover:text-white" to="/catalogo?cat=Accesorios">Accesorios Interior</Link></li>
            </ul>
          </div>
          <div className="flex flex-col">
            <h3 className="text-white font-black mb-4 uppercase">Redes Sociales</h3>
            <p className="text-gray-400 text-sm mb-4">Seguinos para enterarte de las mejores ofertas y novedades para tu taller.</p>
            <div className="flex flex-col gap-3 text-sm">
              <a href="https://www.instagram.com/_.el.viento_/" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                Instagram
              </a>
              <a href="https://www.facebook.com/elvientolasheras" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                Facebook
              </a>
              <a href="mailto:Serviciosyrepuestoselviento@hotmail.com" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                Email
              </a>
              <a href={`https://wa.me/${numeroWhatsApp}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#00A650] flex items-center gap-2 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                (2974) 377349
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 Servicios y Repuestos El Viento. Todos los derechos reservados.</p>
          <div className="flex gap-4"><span className="hover:text-white cursor-pointer transition-colors">Términos y Condiciones</span><span className="hover:text-white cursor-pointer transition-colors">Privacidad</span></div>
        </div>
      </footer>

      {/* MODAL DEL CARRITO */}
      {carritoAbierto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setCarritoAbierto(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-xl font-black text-marca-negro flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-marca-amarillo" /> MI PEDIDO</h2>
              <button onClick={() => setCarritoAbierto(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {carrito.length === 0 ? (
                <div className="text-center text-gray-500 mt-20 flex flex-col items-center">
                  <ShoppingCart className="w-16 h-16 text-gray-200 mb-4" />
                  <p className="text-lg font-bold text-gray-400">Tu carrito está vacío.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {carrito.map((item, index) => {
                    const tieneDesc = item.descuento > 0;
                    const precioItem = tieneDesc ? item.precio * (1 - (item.descuento / 100)) : item.precio;
                    return (
                      <li key={index} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex-1 pr-3">
                          <p className="font-bold text-sm text-gray-800 line-clamp-1">{item.nombre}</p>
                          <p className="text-marca-negro font-black mt-1">${precioItem.toLocaleString('es-AR')}</p>
                        </div>
                        <button onClick={() => eliminarDelCarrito(index)} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            {carrito.length > 0 && (
              <div className="p-5 border-t border-gray-200 bg-gray-50 shadow-inner">
                <div className="flex justify-between items-end mb-5">
                  <span className="font-bold text-gray-500 uppercase text-sm tracking-wider">Total estimado:</span>
                  <span className="font-black text-3xl text-marca-negro">${totalCarrito.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={pagarConMercadoPago} disabled={procesandoPago} className="w-full bg-[#009EE3] text-white font-black py-4 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#0089C5] transition-colors shadow-md disabled:opacity-50 text-sm">
                    {procesandoPago ? 'CONECTANDO...' : 'PAGAR ONLINE CON TARJETA'}
                  </button>
                  <button onClick={enviarPedido} className="w-full bg-white border-2 border-[#00A650] text-[#00A650] font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-sm">
                    ACORDAR CON EL VENDEDOR (WhatsApp)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}