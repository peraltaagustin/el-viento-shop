import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { User, LogOut, Package, ArrowLeft, Settings, MapPin, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';

const provinciasArgentina = [
  'Buenos Aires', 'Ciudad Autónoma de Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
];

export default function MiCuenta() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [modoRegistro, setModoRegistro] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState('pedidos'); 

  const [datosCliente, setDatosCliente] = useState({
    nombre: '', apellido: '', dni: '', telefono: '', direccion: '', ciudad: '', provincia: 'Santa Cruz', codigo_postal: ''
  });
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  
  // NUEVO: Estado para guardar los pedidos del cliente
  const [misPedidos, setMisPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        cargarDatosDelCliente(session.user.id);
        cargarPedidos(session.user.id); // Llamamos a la función de pedidos
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        cargarDatosDelCliente(session.user.id);
        cargarPedidos(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const cargarDatosDelCliente = async (userId) => {
    const { data, error } = await supabase.from('clientes').select('*').eq('id', userId).single();
    if (data && !error) {
      setDatosCliente({
        nombre: data.nombre || '', apellido: data.apellido || '', dni: data.dni || '',
        telefono: data.telefono || '', direccion: data.direccion || '', ciudad: data.ciudad || '',
        provincia: data.provincia || 'Santa Cruz', codigo_postal: data.codigo_postal || ''
      });
    }
  };

  // NUEVA FUNCIÓN: Descarga los pedidos desde Supabase
  const cargarPedidos = async (userId) => {
    setCargandoPedidos(true);
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('cliente_id', userId)
      .order('creado_en', { ascending: false });
    
    if (data && !error) {
      setMisPedidos(data);
    }
    setCargandoPedidos(false);
  };

  const manejarAuth = async (e) => {
    e.preventDefault();
    setCargando(true);
    if (modoRegistro) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert('Error al registrarse: ' + error.message);
      else alert('¡Cuenta creada con éxito! Ya podés ingresar.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert('Error al iniciar sesión. Revisá tus datos.');
    }
    setCargando(false);
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const guardarDatosPersonales = async (e) => {
    e.preventDefault();
    setGuardandoDatos(true);
    const { error } = await supabase.from('clientes').upsert({ id: session.user.id, email: session.user.email, ...datosCliente });
    if (error) alert('Error al guardar datos: ' + error.message);
    else alert('Tus datos fueron actualizados correctamente.');
    setGuardandoDatos(false);
  };

  // Función auxiliar para el color del estado del pedido
  const colorEstado = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Confirmado': return 'bg-blue-100 text-blue-800';
      case 'Entregado': return 'bg-green-100 text-green-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const iconoEstado = (estado) => {
    switch (estado) {
      case 'Pendiente': return <Clock className="w-4 h-4" />;
      case 'Confirmado': return <Package className="w-4 h-4" />;
      case 'Entregado': return <CheckCircle className="w-4 h-4" />;
      case 'Cancelado': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] font-sans flex flex-col">
      <header className="bg-[#111111] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer min-w-max" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="Logo El Viento" className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-lg" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/FACC15/111827?text=EV'; }} />
            <div className="hidden sm:flex flex-col">
              <span className="text-xl md:text-2xl font-black tracking-tight leading-none text-white drop-shadow-md">EL VIENTO</span>
              <span className="text-[9px] text-marca-amarillo font-bold tracking-[0.2em] mt-1 uppercase">Servicios & Repuestos</span>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="text-sm font-bold text-gray-300 hover:text-marca-amarillo flex items-center gap-2 transition-colors border-2 border-gray-700 hover:border-marca-amarillo px-4 py-2 rounded-full">
            <ArrowLeft className="w-4 h-4" /> VOLVER A LA TIENDA
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-8 md:py-12 flex justify-center">
        {!session ? (
          <div className="w-full max-w-md">
            <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg border border-gray-200">
              <div className="flex justify-center mb-6">
                <div className="bg-marca-amarillo p-4 rounded-full shadow-inner"><User className="w-10 h-10 text-marca-negro" /></div>
              </div>
              <h2 className="text-3xl font-black text-center text-marca-negro mb-2 tracking-tight">{modoRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
              <p className="text-center text-sm text-gray-500 mb-8 font-medium">{modoRegistro ? 'Completá tus datos para sumarte a El Viento.' : 'Ingresá para gestionar tus pedidos y direcciones.'}</p>

              <form onSubmit={manejarAuth} className="space-y-5">
                <div><label className="block text-sm font-black text-marca-negro mb-1 uppercase tracking-wide">Email</label><input type="email" required placeholder="tucorreo@ejemplo.com" className="w-full p-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-marca-amarillo outline-none transition-all text-marca-negro bg-gray-50 focus:bg-white" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><label className="block text-sm font-black text-marca-negro mb-1 uppercase tracking-wide">Contraseña</label><input type="password" required minLength="6" placeholder="••••••••" className="w-full p-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-marca-amarillo outline-none transition-all text-marca-negro bg-gray-50 focus:bg-white" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <button type="submit" disabled={cargando} className="w-full bg-marca-amarillo text-marca-negro font-black py-4 rounded hover:bg-yellow-500 transition-colors disabled:opacity-50 text-lg shadow-sm tracking-wide uppercase mt-4">
                  {cargando ? 'Procesando...' : (modoRegistro ? 'REGISTRARME' : 'INGRESAR')}
                </button>
              </form>
              <div className="mt-8 text-center border-t-2 border-gray-100 pt-6">
                <button type="button" onClick={() => setModoRegistro(!modoRegistro)} className="text-sm font-bold text-gray-500 hover:text-marca-negro transition-colors">
                  {modoRegistro ? '¿Ya tenés cuenta? Iniciá sesión acá' : '¿No tenés cuenta? Registrate gratis acá'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-32">
                <div className="bg-marca-negro p-6 text-white text-center">
                  <div className="w-16 h-16 bg-marca-amarillo rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-[#222]"><User className="w-8 h-8 text-marca-negro" /></div>
                  <h3 className="font-black text-lg truncate" title={session.user.email}>¡Hola!</h3>
                  <p className="text-xs text-gray-400 font-medium truncate" title={session.user.email}>{session.user.email}</p>
                </div>
                <nav className="flex flex-col py-2">
                  <button onClick={() => setSeccionActiva('pedidos')} className={`flex items-center justify-between px-6 py-4 transition-colors font-bold ${seccionActiva === 'pedidos' ? 'bg-gray-50 text-marca-negro border-l-4 border-marca-amarillo' : 'text-gray-600 hover:bg-gray-50 hover:text-marca-negro border-l-4 border-transparent'}`}>
                    <div className="flex items-center gap-3"><Package className={`w-5 h-5 ${seccionActiva === 'pedidos' ? 'text-marca-amarillo' : 'text-gray-400'}`} /> Mis Pedidos</div>
                  </button>
                  <button onClick={() => setSeccionActiva('datos')} className={`flex items-center justify-between px-6 py-4 transition-colors font-bold border-t border-gray-100 ${seccionActiva === 'datos' ? 'bg-gray-50 text-marca-negro border-l-4 border-marca-amarillo' : 'text-gray-600 hover:bg-gray-50 hover:text-marca-negro border-l-4 border-transparent'}`}>
                    <div className="flex items-center gap-3"><Settings className={`w-5 h-5 ${seccionActiva === 'datos' ? 'text-marca-amarillo' : 'text-gray-400'}`} /> Mis Datos</div>
                  </button>
                  <button onClick={cerrarSesion} className="flex items-center gap-3 px-6 py-4 mt-2 text-red-500 hover:bg-red-50 font-bold transition-colors border-t border-gray-100 border-l-4 border-transparent">
                    <LogOut className="w-5 h-5" /> Cerrar Sesión
                  </button>
                </nav>
              </div>
            </aside>

            <main className="flex-1">
              {seccionActiva === 'pedidos' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <div className="border-b-2 border-marca-negro pb-4 mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-marca-negro uppercase tracking-wide">Mis Pedidos</h2>
                  </div>
                  
                  {cargandoPedidos ? (
                    <div className="text-center py-10 text-gray-500">Cargando tu historial...</div>
                  ) : misPedidos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <div className="bg-white p-4 rounded-full shadow-sm mb-4"><Package className="w-12 h-12 text-gray-300" /></div>
                      <h3 className="text-xl font-bold text-marca-negro mb-2">Aún no realizaste ninguna compra</h3>
                      <p className="text-gray-500 mb-6 max-w-md">Cuando confirmes un pedido en la tienda, aparecerá en esta lista con su estado de envío.</p>
                      <button onClick={() => navigate('/')} className="bg-marca-negro text-white font-bold py-3 px-8 rounded hover:bg-gray-800 transition-colors uppercase tracking-wide">Ir a la Tienda</button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {misPedidos.map(pedido => {
                        const fecha = new Date(pedido.creado_en).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
                        return (
                          <div key={pedido.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Fecha del Pedido</p>
                                <p className="font-bold text-marca-negro">{fecha}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Total</p>
                                <p className="font-bold text-marca-negro">${pedido.total.toLocaleString('es-AR')}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Estado</p>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${colorEstado(pedido.estado)}`}>
                                  {iconoEstado(pedido.estado)} {pedido.estado}
                                </span>
                              </div>
                            </div>
                            <div className="p-4 bg-white">
                              <h4 className="text-sm font-bold text-gray-700 mb-2">Artículos:</h4>
                              <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed pl-2 border-l-2 border-marca-amarillo">
                                {pedido.detalle}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {seccionActiva === 'datos' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <div className="border-b-2 border-marca-negro pb-4 mb-8">
                    <h2 className="text-2xl font-black text-marca-negro uppercase tracking-wide">Datos Personales</h2>
                    <p className="text-gray-500 text-sm mt-1">Completá tu información para agilizar tus próximas compras y envíos.</p>
                  </div>
                  <form onSubmit={guardarDatosPersonales} className="space-y-8">
                    <div>
                      <h3 className="text-lg font-bold text-marca-negro flex items-center gap-2 mb-4 border-b border-gray-100 pb-2"><User className="w-5 h-5 text-marca-amarillo" /> Identificación</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Nombre</label><input type="text" className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-marca-amarillo outline-none text-marca-negro" value={datosCliente.nombre} onChange={(e) => setDatosCliente({...datosCliente, nombre: e.target.value})} placeholder="Ej: Juan" /></div>
                        <div><label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Apellido</label><input type="text" className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-marca-amarillo outline-none text-marca-negro" value={datosCliente.apellido} onChange={(e) => setDatosCliente({...datosCliente, apellido: e.target.value})} placeholder="Ej: Pérez" /></div>
                        <div><label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">DNI</label><input type="text" className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-marca-amarillo outline-none text-marca-negro" value={datosCliente.dni} onChange={(e) => setDatosCliente({...datosCliente, dni: e.target.value})} placeholder="Ej: 30123456" /></div>
                        <div><label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Teléfono Móvil</label><div className="relative"><Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><input type="tel" className="w-full p-2.5 pl-10 border border-gray-300 rounded focus:ring-2 focus:ring-marca-amarillo outline-none text-marca-negro" value={datosCliente.telefono} onChange={(e) => setDatosCliente({...datosCliente, telefono: e.target.value})} placeholder="Ej: 297 123 4567" /></div></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-marca-negro flex items-center gap-2 mb-4 border-b border-gray-100 pb-2"><MapPin className="w-5 h-5 text-marca-amarillo" /> Dirección Principal</h3>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-4"><label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Calle y Número</label><input type="text" className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-marca-amarillo outline-none text-marca-negro" value={datosCliente.direccion} onChange={(e) => setDatosCliente({...datosCliente, direccion: e.target.value})} placeholder="Ej: San Martín 123" /></div>
                        <div className="md:col-span-2"><label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Cód. Postal</label><input type="text" className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-marca-amarillo outline-none text-marca-negro" value={datosCliente.codigo_postal} onChange={(e) => setDatosCliente({...datosCliente, codigo_postal: e.target.value})} placeholder="Ej: 9011" /></div>
                        <div className="md:col-span-3"><label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Localidad / Ciudad</label><input type="text" className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-marca-amarillo outline-none text-marca-negro" value={datosCliente.ciudad} onChange={(e) => setDatosCliente({...datosCliente, ciudad: e.target.value})} placeholder="Ej: Las Heras" /></div>
                        <div className="md:col-span-3">
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Provincia</label>
                          <select className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-marca-amarillo outline-none text-marca-negro" value={datosCliente.provincia} onChange={(e) => setDatosCliente({...datosCliente, provincia: e.target.value})}>
                            <option value="">Seleccioná una provincia</option>
                            {provinciasArgentina.map(prov => (
                              <option key={prov} value={prov}>{prov}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 flex justify-end">
                      <button type="submit" disabled={guardandoDatos} className="bg-marca-amarillo text-marca-negro font-black py-3.5 px-8 rounded hover:bg-yellow-500 transition-colors disabled:opacity-50 text-base shadow-sm tracking-wide uppercase">
                        {guardandoDatos ? 'Guardando...' : 'Guardar Mis Datos'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}