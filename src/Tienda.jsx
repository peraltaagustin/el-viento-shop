import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { ShoppingCart, Search, User, X, Trash2, Zap, Car, Disc, Battery, Wrench, Shield, ChevronRight, ChevronLeft, ChevronDown, Menu, Truck } from 'lucide-react';

export default function Tienda() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [carrito, setCarrito] = useState([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  const [slideActual, setSlideActual] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);

  const numeroWhatsApp = "5491100000000"; 

  const categoriasMenu = ['Motor', 'Frenos', 'Herramientas', 'Accesorios', 'Baterías', 'Suspensión', 'Lubricantes'];

  const categoriasIconos = [
    { nombre: 'Motor', icono: Wrench }, 
    { nombre: 'Suspensión', icono: Car },
    { nombre: 'Frenos', icono: Disc },
    { nombre: 'Baterías', icono: Battery },
    { nombre: 'Herramientas', icono: Wrench },
    { nombre: 'Eléctrico', icono: Zap },
    { nombre: 'Seguridad', icono: Shield },
  ];

  const slides = [
    {
      etiqueta: "DESTACADO DE LA SEMANA",
      titulo: "HERRAMIENTAS\nPROFESIONALES",
      subtitulo: "Renová tu taller con la mejor calidad",
      imagenFondo: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?q=80&w=2070&auto=format&fit=crop" 
    },
    {
      etiqueta: "DESTACADO DE LA SEMANA",
      titulo: "BATERÍAS Y ENCENDIDO",
      subtitulo: "Energía que no te abandona",
      imagenFondo: "https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=2070&auto=format&fit=crop" 
    },
    {
      etiqueta: "DESTACADO DE LA SEMANA",
      titulo: "SEMANA DEL NEUMÁTICO",
      subtitulo: "Hasta 40% OFF en primeras marcas",
      imagenFondo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1964&auto=format&fit=crop" 
    }
  ];

  useEffect(() => {
    const carritoGuardado = JSON.parse(localStorage.getItem('carrito') || '[]');
    setCarrito(carritoGuardado);

    const intervalo = setInterval(() => {
      setSlideActual((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000); 
    return () => clearInterval(intervalo);
  }, [slides.length]);

  const siguienteSlide = () => setSlideActual(slideActual === slides.length - 1 ? 0 : slideActual + 1);
  const anteriorSlide = () => setSlideActual(slideActual === 0 ? slides.length - 1 : slideActual - 1);

  useEffect(() => {
    async function cargarProductos() {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('creado_en', { ascending: false })
        .limit(8); 

      if (!error && data) setProductos(data);
      setCargando(false);
    }
    cargarProductos();
  }, []);

  const ejecutarBusqueda = (e) => {
    e.preventDefault();
    if(busqueda.trim()) {
      navigate(`/catalogo?q=${busqueda}`);
    }
  };

  const seleccionarCategoria = (cat) => {
    navigate(`/catalogo?cat=${cat}`);
    setMenuAbierto(false);
  };

  const agregarAlCarrito = (producto) => {
    const nuevoCarrito = [...carrito, producto];
    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
    setCarritoAbierto(true); 
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
    
    let detalleTexto = "";
    carrito.forEach((item) => {
      const tieneDescuento = item.descuento > 0;
      const precioFinal = tieneDescuento ? item.precio * (1 - (item.descuento / 100)) : item.precio;
      detalleTexto += `- ${item.nombre} ($${precioFinal.toLocaleString('es-AR')})\n`;
    });
    
    const { data: authData } = await supabase.auth.getSession();
    if (authData.session) {
      const { error } = await supabase.from('pedidos').insert([
        { cliente_id: authData.session.user.id, detalle: detalleTexto, total: totalCarrito, estado: 'Pendiente' }
      ]);
      if (error) {
        alert("⚠️ Error al guardar el pedido en tu cuenta: " + error.message);
        return; 
      }
    }

    let mensaje = "👋 ¡Hola El Viento! Quiero encargar estos repuestos:\n\n";
    carrito.forEach((item) => {
      const tieneDescuento = item.descuento > 0;
      const precioFinal = tieneDescuento ? item.precio * (1 - (item.descuento / 100)) : item.precio;
      mensaje += `🔧 ${item.nombre} - $${precioFinal.toLocaleString('es-AR')}\n`;
    });
    mensaje += `\n💰 *Total estimado: $${totalCarrito.toLocaleString('es-AR')}*`;
    
    window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`, '_blank');
    
    setCarrito([]);
    localStorage.removeItem('carrito');
    setCarritoAbierto(false);
  };

  const pagarConMercadoPago = async () => {
    if (carrito.length === 0) return;
    setProcesandoPago(true);

    let detalleTexto = "";
    carrito.forEach((item) => {
      const tieneDescuento = item.descuento > 0;
      const precioFinal = tieneDescuento ? item.precio * (1 - (item.descuento / 100)) : item.precio;
      detalleTexto += `- ${item.nombre} ($${precioFinal.toLocaleString('es-AR')})\n`;
    });

    const { data: authData } = await supabase.auth.getSession();
    if (authData.session) {
      await supabase.from('pedidos').insert([
        { cliente_id: authData.session.user.id, detalle: detalleTexto, total: totalCarrito, estado: 'Pendiente' }
      ]);
    }

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

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans relative">
      
      {/* HEADER NUEVO CON LOGO DESTACADO */}
      <header className="bg-[#111111] text-white sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-4 md:gap-8">
          
          <div className="flex items-center gap-3 cursor-pointer min-w-max" onClick={() => navigate('/')}>
            <img 
              src="/logo.png" 
              alt="Logo El Viento" 
              className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg" 
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/FACC15/111827?text=EV'; }} 
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-2xl md:text-3xl font-black tracking-tight leading-none text-white drop-shadow-md">EL VIENTO</span>
              <span className="text-[10px] text-marca-amarillo font-bold tracking-[0.2em] mt-1 uppercase">Servicios & Repuestos</span>
            </div>
          </div>
          
          <form onSubmit={ejecutarBusqueda} className="flex-1 max-w-2xl flex shadow-md">
            <input 
              type="text" 
              placeholder="Buscar productos, marcas y más..." 
              className="w-full py-2.5 md:py-3.5 px-4 text-black focus:outline-none text-sm md:text-base rounded-l border-none bg-white"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button type="submit" className="bg-marca-amarillo px-4 md:px-8 flex items-center justify-center hover:bg-yellow-500 transition-colors rounded-r">
              <Search className="text-marca-negro w-5 h-5" />
            </button>
          </form>

          <div className="flex items-center gap-6">
            <div onClick={() => navigate('/cuenta')} className="hidden md:flex items-center gap-3 cursor-pointer hover:text-marca-amarillo transition-colors">
              <User className="w-7 h-7" />
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
            <div 
              className="h-full bg-white text-marca-negro px-6 flex items-center gap-2 cursor-pointer border-r border-l border-gray-300 hover:bg-gray-50 transition-colors relative"
              onMouseEnter={() => setMenuAbierto(true)}
              onMouseLeave={() => setMenuAbierto(false)}
            >
              <Menu className="w-5 h-5 text-marca-amarillo" />
              <span className="uppercase text-marca-negro tracking-wide">Categorías</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
              
              <div className={`absolute top-12 left-0 w-64 bg-white border-x border-b border-gray-200 shadow-2xl z-50 flex flex-col py-2 transition-all duration-300 origin-top ${menuAbierto ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-90 invisible'}`}>
                <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-marca-negro font-black border-b border-gray-100 hover:text-marca-amarillo transition-colors" onClick={() => seleccionarCategoria('Todas')}>Todas las categorías</div>
                {categoriasMenu.map(cat => (
                  <div 
                    key={cat} 
                    className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-gray-700 hover:text-marca-amarillo border-l-4 border-transparent hover:border-marca-amarillo transition-all"
                    onClick={() => seleccionarCategoria(cat)}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </div>

            <ul className="flex items-center gap-6 px-6 text-gray-600 hidden lg:flex">
              <li onClick={() => navigate('/catalogo')} className="cursor-pointer hover:text-marca-negro transition-colors uppercase tracking-wide">Ver todo el Catálogo</li>
              <li className="cursor-pointer hover:text-marca-negro transition-colors uppercase tracking-wide">Cuotas sin Interés</li>
            </ul>
            <div className="ml-auto px-4 hidden md:block">
              <span className="text-marca-amarillo bg-marca-negro px-3 py-1.5 text-xs rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Zap className="w-3 h-3" /> Especial Talleres
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION CARRUSEL */}
      <div className="relative overflow-hidden bg-marca-negro h-[500px] flex items-center group">
        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === slideActual ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            style={{
              backgroundImage: `linear-gradient(to right, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.4) 100%), url(${slide.imagenFondo})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="max-w-[1400px] mx-auto px-8 lg:px-16 h-full flex flex-col justify-center items-start">
              <span className="bg-marca-amarillo text-marca-negro font-black px-4 py-1.5 text-sm tracking-wide mb-6 shadow-md">
                {slide.etiqueta}
              </span>
              <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight mb-4 text-white whitespace-pre-line drop-shadow-lg">
                {slide.titulo}
              </h1>
              <p className="text-xl md:text-2xl font-medium mb-10 text-gray-200 drop-shadow-md">
                {slide.subtitulo}
              </p>
              <button onClick={() => navigate('/catalogo')} className="bg-marca-amarillo text-marca-negro font-black px-10 py-4 text-lg hover:bg-yellow-500 transition-transform hover:scale-105 shadow-lg">
                VER PRODUCTOS
              </button>
            </div>
          </div>
        ))}
        {/* Controles Carrusel */}
        <button onClick={anteriorSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 text-white p-3 rounded-full hover:bg-marca-amarillo hover:text-marca-negro transition-all opacity-0 group-hover:opacity-100"><ChevronLeft className="w-8 h-8" /></button>
        <button onClick={siguienteSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 text-white p-3 rounded-full hover:bg-marca-amarillo hover:text-marca-negro transition-all opacity-0 group-hover:opacity-100"><ChevronRight className="w-8 h-8" /></button>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button key={index} onClick={() => setSlideActual(index)} className={`h-2 rounded-full transition-all shadow-md ${index === slideActual ? 'w-8 bg-marca-amarillo' : 'w-2 bg-white/50 hover:bg-white'}`} />
          ))}
        </div>
      </div>

      {/* CATEGORÍAS CIRCULARES */}
      <div className="bg-white py-16 shadow-sm border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4">
          <h2 className="text-2xl font-black mb-10 text-marca-negro uppercase tracking-wide">
            Comprá por <span className="text-marca-amarillo border-b-4 border-marca-amarillo pb-1">Categoría</span>
          </h2>
          <div className="flex justify-between items-center gap-4 overflow-x-auto no-scrollbar pb-4">
            {categoriasIconos.map((cat, idx) => {
              const Icono = cat.icono;
              return (
                <div key={idx} onClick={() => seleccionarCategoria(cat.nombre)} className="flex flex-col items-center gap-4 cursor-pointer group min-w-[100px]">
                  <div className="w-24 h-24 rounded-full border-2 border-gray-200 flex items-center justify-center transition-all duration-300 group-hover:border-marca-amarillo group-hover:shadow-md bg-white">
                    <Icono className="w-10 h-10 text-gray-500 group-hover:text-marca-amarillo transition-colors" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider text-gray-500 group-hover:text-marca-negro transition-colors">
                    {cat.nombre}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* OFERTAS DESTACADAS CON CONTROL DE STOCK */}
      <main className="max-w-[1400px] mx-auto px-4 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-marca-negro uppercase tracking-wide">Ofertas Destacadas</h2>
            <p className="text-gray-500 mt-2">Los repuestos más buscados al mejor precio</p>
          </div>
          <button onClick={() => navigate('/catalogo')} className="text-sm font-bold text-marca-negro hover:text-marca-amarillo transition-colors uppercase tracking-wider hidden sm:block">
            Ver todas las ofertas &rarr;
          </button>
        </div>
        
        {cargando ? (
          <div className="text-center text-gray-500 font-medium py-20">Cargando destacados...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {productos.map((prod) => {
              const tieneDescuento = prod.descuento > 0;
              const precioFinal = tieneDescuento ? prod.precio * (1 - (prod.descuento / 100)) : prod.precio;
              const cuotas = prod.cuotas || 1;
              const valorCuota = cuotas > 1 ? precioFinal / cuotas : 0;
              const urlPortada = prod.galeria && prod.galeria.length > 0 ? prod.galeria[0] : prod.imagen_url;
              const tieneStock = prod.hay_stock !== false;

              return (
                <Link key={prod.id} to={`/producto/${prod.id}`} className={`bg-white rounded p-4 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group ${!tieneStock ? 'opacity-80' : ''}`}>
                  
                  {/* Etiqueta Descuento */}
                  {tieneDescuento && (
                    <div className="absolute top-4 right-4 bg-[#00A650] text-white font-black text-xs px-2 py-1 rounded z-10 shadow-sm">
                      {prod.descuento}% OFF
                    </div>
                  )}

                  <div className="relative">
                    {/* CARTEL SIN STOCK VISUAL */}
                    {!tieneStock && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex items-center justify-center rounded">
                        <span className="bg-red-600 text-white font-black px-4 py-2 rounded uppercase tracking-widest rotate-[-10deg] border-2 border-white shadow-lg">
                          Agotado
                        </span>
                      </div>
                    )}

                    <div className="relative mb-4 h-44 flex items-center justify-center p-2">
                      <img 
                        src={urlPortada || 'https://placehold.co/400x400/eeeeee/a3a3a3?text=Sin+Imagen'} 
                        alt={prod.nombre}
                        className={`max-w-full max-h-full object-contain transition-transform duration-500 ${tieneStock ? 'group-hover:scale-105' : 'grayscale'}`}
                      />
                    </div>
                    <h3 className="text-sm text-gray-700 leading-snug mb-3 line-clamp-2 min-h-[40px] group-hover:text-marca-negro transition-colors">
                      {prod.nombre}
                    </h3>
                  </div>

                  <div className="mt-auto">
                    {tieneDescuento ? <div className="text-gray-400 text-xs line-through mb-0.5">$ {prod.precio.toLocaleString('es-AR')}</div> : <div className="h-4"></div>}
                    <div className="text-2xl font-black text-marca-negro mb-1">$ {precioFinal.toLocaleString('es-AR')}</div>
                    
                    {cuotas > 1 ? (
                      <div className="text-sm font-bold text-[#FF6B00] mb-2">
                        <span className="text-marca-negro">{cuotas}</span> x <span className="text-marca-negro">$ {valorCuota.toLocaleString('es-AR', {maximumFractionDigits: 0})}</span> S/Interés
                      </div>
                    ) : <div className="h-5 mb-2"></div>}

                    {prod.envio_gratis ? (
                      <div className="text-xs font-bold text-[#00A650] flex items-center gap-1 mb-4">
                        <Truck className="w-4 h-4" /> Envío GRATIS
                      </div>
                    ) : <div className="h-4 mb-4"></div>}
                    
                    <div 
                      onClick={(e) => { 
                        e.preventDefault(); // ESTO FRENA LA REDIRECCIÓN SI SE TOCA EL BOTÓN
                        if(tieneStock) agregarAlCarrito(prod); 
                      }} 
                      className={`w-full border-2 font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors text-sm cursor-pointer ${tieneStock ? 'bg-white border-marca-negro text-marca-negro group-hover:bg-marca-negro group-hover:text-white' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}`}
                    >
                      {tieneStock ? <><ShoppingCart className="w-4 h-4" /> AGREGAR AL CARRITO</> : <X className="w-4 h-4" />}
                      {tieneStock ? '' : 'SIN STOCK'}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      {/* FOOTER REDISEÑADO A ANCHO COMPLETO */}
      <footer className="bg-[#111111] text-gray-300 pt-16 pb-8 border-t-[6px] border-marca-amarillo w-full">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Info Empresa */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="Logo El Viento" className="w-12 h-12 object-contain drop-shadow" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/FACC15/111827?text=EV'; }} />
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight leading-none text-white">EL VIENTO</span>
                <span className="text-[10px] text-marca-amarillo tracking-[0.1em] mt-1 uppercase font-bold">Servicios & Repuestos</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Tu tienda de confianza para repuestos, accesorios y herramientas de mecánica automotriz en toda la región de Santa Cruz.
            </p>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="text-lg font-black uppercase tracking-wider mb-6 text-white">Atención al Cliente</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-marca-amarillo" /> Centro de Ayuda</li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-marca-amarillo" /> Políticas de Devolución</li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-marca-amarillo" /> Seguimiento de Envíos</li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-marca-amarillo" /> Contacto Directo</li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="text-lg font-black uppercase tracking-wider mb-6 text-white">Categorías</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /> Herramientas Manuales</li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /> Filtros y Lubricantes</li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /> Iluminación y Eléctrico</li>
              <li className="flex items-center gap-2 hover:text-marca-amarillo cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /> Accesorios Interior</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-black uppercase tracking-wider mb-6 text-white">Newsletter</h4>
            <p className="text-sm mb-4 text-gray-400">Suscribite para recibir las mejores ofertas exclusivas para tu taller.</p>
            <div className="flex w-full shadow-lg">
              <input type="email" placeholder="Ingresá tu email" className="w-full bg-[#1A1A1A] border border-gray-700 text-white px-4 py-3 rounded-l focus:outline-none focus:border-marca-amarillo text-sm transition-colors" />
              <button className="bg-marca-amarillo text-marca-negro font-black px-6 rounded-r hover:bg-yellow-500 transition-colors text-sm">ENVIAR</button>
            </div>
          </div>
        </div>
        
        {/* Copyright Centrado */}
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
              <h2 className="text-xl font-black text-marca-negro flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-marca-amarillo" /> MI PEDIDO
              </h2>
              <button onClick={() => setCarritoAbierto(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
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

                {/* BOTONES DOBLES DE PAGO */}
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={pagarConMercadoPago} 
                    disabled={procesandoPago}
                    className="w-full bg-[#009EE3] text-white font-black py-4 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#0089C5] transition-colors shadow-md disabled:opacity-50 text-sm"
                  >
                    {procesandoPago ? 'CONECTANDO...' : 'PAGAR ONLINE CON TARJETA'}
                  </button>
                  <button 
                    onClick={enviarPedido} 
                    className="w-full bg-white border-2 border-[#00A650] text-[#00A650] font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-sm"
                  >
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