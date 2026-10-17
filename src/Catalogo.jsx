import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { ShoppingCart, Search, User, Zap, ChevronDown, Menu, Truck, Filter, ChevronRight, X, Trash2 } from 'lucide-react';

export default function Catalogo() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [carrito, setCarrito] = useState([]);
  
  const [busqueda, setBusqueda] = useState(searchParams.get('q') || '');
  const [categoriaActiva, setCategoriaActiva] = useState(searchParams.get('cat') || 'Todas');
  const [soloEnvioGratis, setSoloEnvioGratis] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const categorias = ['Motor', 'Frenos', 'Herramientas', 'Accesorios', 'Baterías', 'Suspensión', 'Lubricantes'];
  const numeroWhatsApp = "5493541336420"; 

  useEffect(() => {
    const carritoGuardado = JSON.parse(localStorage.getItem('carrito') || '[]');
    setCarrito(carritoGuardado);

    async function cargarProductos() {
      const { data, error } = await supabase.from('productos').select('*').order('creado_en', { ascending: false });
      if (!error && data) setProductos(data);
      setCargando(false);
    }
    cargarProductos();
  }, []);

  const ejecutarBusqueda = (e) => {
    e.preventDefault();
    navigate(`/catalogo?q=${busqueda}`);
  };

  const seleccionarCategoria = (cat) => {
    setCategoriaActiva(cat);
    navigate(`/catalogo?cat=${cat}`);
    setMenuAbierto(false);
  };

  const eliminarDelCarrito = (indice) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito.splice(indice, 1);
    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
  };

  const totalCarrito = carrito.reduce((total, item) => {
    const tieneDescuento = item.descuento > 0;
    const precioFinal = tieneDescuento ? item.precio * (1 - (item.descuento / 100)) : item.precio;
    return total + precioFinal;
  }, 0);

const enviarPedido = async () => {
    if (carrito.length === 0) return;
    
    // 1. Armamos el texto del detalle para la base de datos
    let detalleTexto = "";
    carrito.forEach((item) => {
      const tieneDescuento = item.descuento > 0;
      const precioFinal = tieneDescuento ? item.precio * (1 - (item.descuento / 100)) : item.precio;
      detalleTexto += `- ${item.nombre} ($${precioFinal.toLocaleString('es-AR')})\n`;
    });
    
    // 2. Intentamos guardar el pedido en Supabase si está logueado
    const { data: authData } = await supabase.auth.getSession();
    if (authData.session) {
      const { error } = await supabase.from('pedidos').insert([
        {
          cliente_id: authData.session.user.id,
          detalle: detalleTexto,
          total: totalCarrito,
          estado: 'Pendiente'
        }
      ]);
      
      // SI HAY UN ERROR, EL SISTEMA NOS AVISA Y FRENA EL PROCESO
      if (error) {
        alert("⚠️ Error al guardar el pedido en tu cuenta: " + error.message);
        return; 
      }
    }

    // 3. Armamos el mensaje para WhatsApp
    let mensaje = "👋 ¡Hola El Viento! Quiero encargar estos repuestos:\n\n";
    carrito.forEach((item) => {
      const tieneDescuento = item.descuento > 0;
      const precioFinal = tieneDescuento ? item.precio * (1 - (item.descuento / 100)) : item.precio;
      mensaje += `🔧 ${item.nombre} - $${precioFinal.toLocaleString('es-AR')}\n`;
    });
    mensaje += `\n💰 *Total estimado: $${totalCarrito.toLocaleString('es-AR')}*`;
    
    // 4. Abrimos WhatsApp y limpiamos el carrito solo si el guardado fue exitoso
    window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`, '_blank');
    
    setCarrito([]);
    localStorage.removeItem('carrito');
    setCarritoAbierto(false);
  };
  const productosFiltrados = productos.filter((prod) => {
    const coincideBusqueda = prod.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaActiva === 'Todas' || prod.categoria === categoriaActiva;
    const coincideEnvio = soloEnvioGratis ? prod.envio_gratis === true : true;
    return coincideBusqueda && coincideCategoria && coincideEnvio;
  });

  const [carritoAbierto, setCarritoAbierto] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F4F4] font-sans pb-16">
      
      {/* HEADER NUEVO */}
      <header className="bg-[#111111] text-white sticky top-0 z-50">
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
            <button type="submit" className="bg-marca-amarillo px-4 md:px-8 flex items-center justify-center hover:bg-yellow-500 transition-colors rounded-r">
              <Search className="text-marca-negro w-5 h-5" />
            </button>
          </form>

          <div className="flex items-center gap-6">
<div onClick={() => navigate('/cuenta')} className="hidden md:flex items-center gap-3 cursor-pointer hover:text-marca-amarillo transition-colors">              <User className="w-7 h-7" />
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight">Mi Cuenta</span>
                <span className="text-[11px] text-gray-400">Ingresar o Registrarse</span>
              </div>
            </div>
            <div className="flex items-center gap-2 cursor-pointer hover:text-marca-amarillo transition-colors relative" onClick={() => setCarritoAbierto(true)}>
              <div className="p-2 relative">
                <ShoppingCart className="w-7 h-7 md:w-8 md:h-8" />
                <span className="absolute -top-1 -right-1 bg-marca-amarillo text-marca-negro text-[11px] font-black w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center border-2 border-marca-negro">
                  {carrito.length}
                </span>
              </div>
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
                {categorias.map(cat => (
                  <div key={cat} className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-gray-700 hover:text-marca-amarillo border-l-4 border-transparent hover:border-marca-amarillo transition-all" onClick={() => seleccionarCategoria(cat)}>{cat}</div>
                ))}
              </div>
            </div>
            <ul className="flex items-center gap-6 px-6 text-gray-600 hidden lg:flex">
              <li className="cursor-pointer hover:text-marca-negro transition-colors uppercase tracking-wide">Cuotas sin Interés</li>
              <li className="cursor-pointer hover:text-marca-negro transition-colors uppercase tracking-wide">Envío Gratis</li>
            </ul>
            <div className="ml-auto px-4 hidden md:block">
              <span className="text-marca-amarillo bg-marca-negro px-3 py-1.5 text-xs rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm"><Zap className="w-3 h-3" /> Especial Talleres</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* SIDEBAR DE FILTROS */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="flex items-center gap-2 font-black text-marca-negro mb-6 border-b pb-2">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200 mb-6 shadow-sm">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-bold text-gray-700">Envío Gratis</span>
              <input type="checkbox" className="w-4 h-4 text-marca-amarillo focus:ring-marca-amarillo border-gray-300 rounded" checked={soloEnvioGratis} onChange={(e) => setSoloEnvioGratis(e.target.checked)} />
            </label>
          </div>
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3 uppercase text-sm tracking-wide">Categorías</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className={`cursor-pointer hover:text-marca-negro ${categoriaActiva === 'Todas' ? 'font-bold text-marca-negro' : ''}`} onClick={() => seleccionarCategoria('Todas')}>Todas ({productos.length})</li>
              {categorias.map(cat => {
                const count = productos.filter(p => p.categoria === cat).length;
                return (
                  <li key={cat} className={`cursor-pointer flex justify-between hover:text-marca-negro ${categoriaActiva === cat ? 'font-bold text-marca-negro' : ''}`} onClick={() => seleccionarCategoria(cat)}>
                    <span>{cat}</span><span className="text-gray-400">({count})</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>

        {/* GRILLA DE CATÁLOGO CON STOCK */}
        <main className="flex-1">
          <div className="flex justify-between items-end mb-6">
            <h1 className="text-2xl font-black text-marca-negro capitalize">
              {busqueda ? `Resultados para "${busqueda}"` : categoriaActiva === 'Todas' ? 'Catálogo Completo' : categoriaActiva}
            </h1>
            <span className="text-sm text-gray-500 font-bold">{productosFiltrados.length} Resultados</span>
          </div>

          {cargando ? (
            <div className="text-center py-20 text-gray-500 font-bold">Cargando catálogo...</div>
          ) : productosFiltrados.length === 0 ? (
            <div className="bg-white p-12 text-center border border-gray-200 rounded shadow-sm">
              <p className="text-lg text-gray-600 font-bold">No se encontraron repuestos con esos filtros.</p>
              <button onClick={() => {setBusqueda(''); seleccionarCategoria('Todas'); setSoloEnvioGratis(false);}} className="mt-4 text-marca-amarillo font-bold hover:underline">Limpiar búsqueda</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {productosFiltrados.map((prod) => {
                const tieneDescuento = prod.descuento > 0;
                const precioFinal = tieneDescuento ? prod.precio * (1 - (prod.descuento / 100)) : prod.precio;
                const cuotas = prod.cuotas || 1;
                const valorCuota = cuotas > 1 ? precioFinal / cuotas : 0;
                const urlPortada = prod.galeria && prod.galeria.length > 0 ? prod.galeria[0] : prod.imagen_url;
                const tieneStock = prod.hay_stock !== false;

                return (
                  <Link key={prod.id} to={`/producto/${prod.id}`} className={`bg-white rounded p-4 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group ${!tieneStock ? 'opacity-80' : ''}`}>
                    {tieneDescuento && (
                      <div className="absolute top-4 right-4 bg-[#00A650] text-white font-black text-xs px-2 py-1 rounded z-10 shadow-sm">{prod.descuento}% OFF</div>
                    )}
                    
                    <div className="relative">
                      {!tieneStock && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex items-center justify-center rounded">
                          <span className="bg-red-600 text-white font-black px-4 py-2 rounded uppercase tracking-widest rotate-[-10deg] border-2 border-white shadow-lg">Agotado</span>
                        </div>
                      )}
                      <div className="relative mb-4 h-44 flex items-center justify-center p-2">
                        <img src={urlPortada || 'https://placehold.co/400x400/eeeeee/a3a3a3?text=Sin+Imagen'} alt={prod.nombre} className={`max-w-full max-h-full object-contain transition-transform duration-500 ${tieneStock ? 'group-hover:scale-105' : 'grayscale'}`} />
                      </div>
                      <h3 className="text-sm text-gray-700 leading-snug mb-3 line-clamp-2 min-h-[40px] group-hover:text-marca-negro transition-colors">{prod.nombre}</h3>
                    </div>

                    <div className="mt-auto">
                      {tieneDescuento ? <div className="text-gray-400 text-xs line-through mb-0.5">$ {prod.precio.toLocaleString('es-AR')}</div> : <div className="h-4"></div>}
                      <div className="text-2xl font-black text-marca-negro mb-1">$ {precioFinal.toLocaleString('es-AR')}</div>
                      {cuotas > 1 ? (
                        <div className="text-sm font-bold text-[#FF6B00] mb-2"><span className="text-marca-negro">{cuotas}</span> x <span className="text-marca-negro">$ {valorCuota.toLocaleString('es-AR', {maximumFractionDigits: 0})}</span> S/Interés</div>
                      ) : <div className="h-5 mb-2"></div>}
                      {prod.envio_gratis ? (
                        <div className="text-xs font-bold text-[#00A650] flex items-center gap-1 mb-4"><Truck className="w-4 h-4" /> Envío GRATIS</div>
                      ) : <div className="h-4 mb-4"></div>}
                      <button disabled={!tieneStock} onClick={(e) => { if(!tieneStock) e.preventDefault(); }} className={`w-full border-2 font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors text-sm ${tieneStock ? 'bg-white border-marca-negro text-marca-negro group-hover:bg-marca-negro group-hover:text-white' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}`}>
                        {tieneStock ? <><ShoppingCart className="w-4 h-4" /> VER DETALLE</> : <X className="w-4 h-4" />}
                        {tieneStock ? '' : 'SIN STOCK'}
                      </button>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* FOOTER REDISEÑADO */}
      <footer className="bg-[#111111] text-gray-300 pt-16 pb-8 border-t-[6px] border-marca-amarillo w-full mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="Logo El Viento" className="w-12 h-12 object-contain drop-shadow" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/FACC15/111827?text=EV'; }} />
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight leading-none text-white">EL VIENTO</span>
                <span className="text-[10px] text-marca-amarillo tracking-[0.1em] mt-1 uppercase font-bold">Servicios & Repuestos</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">Tu tienda de confianza para repuestos, accesorios y herramientas de mecánica automotriz en toda la región de Santa Cruz.</p>
          </div>
          <div>
            <h4 className="text-lg font-black uppercase tracking-wider mb-6 text-white">Atención al Cliente</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-marca-amarillo" /> Centro de Ayuda</li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-marca-amarillo" /> Políticas de Devolución</li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-marca-amarillo" /> Seguimiento de Envíos</li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-marca-amarillo" /> Contacto Directo</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-black uppercase tracking-wider mb-6 text-white">Categorías</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /> Herramientas Manuales</li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /> Filtros y Lubricantes</li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /> Iluminación y Eléctrico</li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /> Accesorios Interior</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-black uppercase tracking-wider mb-6 text-white">Newsletter</h4>
            <p className="text-sm mb-4 text-gray-400">Suscribite para recibir las mejores ofertas exclusivas para tu taller.</p>
            <div className="flex w-full shadow-lg">
              <input type="email" placeholder="Ingresá tu email" className="w-full bg-[#1A1A1A] border border-gray-700 text-white px-4 py-3 rounded-l focus:outline-none focus:border-marca-amarillo text-sm transition-colors" />
              <button className="bg-marca-amarillo text-marca-negro font-black px-6 rounded-r hover:bg-yellow-500 transition-colors text-sm">ENVIAR</button>
            </div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 Servicios y Repuestos El Viento. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">Términos y Condiciones</span>
            <span className="hover:text-white cursor-pointer transition-colors">Privacidad</span>
          </div>
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
                <button onClick={enviarPedido} className="w-full bg-[#00A650] text-white font-black py-4 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#008A43] transition-colors shadow-lg shadow-green-200">
                  CONFIRMAR POR WHATSAPP
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}