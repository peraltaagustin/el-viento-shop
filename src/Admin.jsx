import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Settings, LogOut, Upload, Link as LinkIcon, Edit, Trash2, CheckCircle, XCircle, Package, Box } from 'lucide-react';

export default function Admin() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargandoLogin, setCargandoLogin] = useState(false);
  
  // Pestañas del Admin
  const [pestanaActiva, setPestanaActiva] = useState('inventario'); // 'inventario' o 'pedidos'

  // Estados de Inventario
  const [productos, setProductos] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [cargandoGuardar, setCargandoGuardar] = useState(false);
  const [productoEditandoId, setProductoEditandoId] = useState(null);

  // Estados de Pedidos
  const [listaPedidos, setListaPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);

  const productoVacio = {
    nombre: '', descripcion: '', precio: '', descuento: 0, cuotas: 1, 
    envio_gratis: false, hay_stock: true, categoria: 'Motor', imagen_url: ''
  };

  const [formulario, setFormulario] = useState(productoVacio);
  const [archivosImagen, setArchivosImagen] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      if (pestanaActiva === 'inventario') cargarInventario();
      if (pestanaActiva === 'pedidos') cargarTodosLosPedidos();
    }
  }, [session, pestanaActiva]);

  // ==========================================
  // LÓGICA DE INVENTARIO
  // ==========================================
  const cargarInventario = async () => {
    setCargandoLista(true);
    const { data, error } = await supabase.from('productos').select('*').order('creado_en', { ascending: false });
    if (!error && data) setProductos(data);
    setCargandoLista(false);
  };

  const manejarGuardar = async (e) => {
    e.preventDefault();
    setCargandoGuardar(true);
    let urlsGaleria = productoEditandoId ? formulario.galeria || [] : [];
    if (formulario.imagen_url && archivosImagen.length === 0) urlsGaleria = [formulario.imagen_url];
    if (archivosImagen.length > 0) {
      urlsGaleria = [];
      for (const archivo of archivosImagen) {
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${archivo.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('repuestos-imagenes').upload(fileName, archivo);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('repuestos-imagenes').getPublicUrl(fileName);
          urlsGaleria.push(publicUrl);
        }
      }
    }
    const imagenPrincipal = urlsGaleria.length > 0 ? urlsGaleria[0] : 'https://placehold.co/600x600/eeeeee/a3a3a3?text=Sin+Imagen';
    const datosGuardar = {
      nombre: formulario.nombre, descripcion: formulario.descripcion, precio: parseFloat(formulario.precio),
      descuento: parseInt(formulario.descuento || 0), cuotas: parseInt(formulario.cuotas || 1),
      envio_gratis: formulario.envio_gratis, hay_stock: formulario.hay_stock, categoria: formulario.categoria,
      imagen_url: imagenPrincipal, galeria: urlsGaleria
    };

    let errorGrave = null;
    if (productoEditandoId) {
      const { error } = await supabase.from('productos').update(datosGuardar).eq('id', productoEditandoId);
      errorGrave = error;
    } else {
      const { error } = await supabase.from('productos').insert([datosGuardar]);
      errorGrave = error;
    }

    if (errorGrave) alert('Error: ' + errorGrave.message);
    else {
      alert(productoEditandoId ? 'Actualizado' : 'Creado');
      cancelarEdicion();
      cargarInventario();
    }
    setCargandoGuardar(false);
  };

  const iniciarEdicion = (prod) => {
    setProductoEditandoId(prod.id);
    setFormulario({ ...prod, imagen_url: '' });
    setArchivosImagen([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setProductoEditandoId(null);
    setFormulario(productoVacio);
    setArchivosImagen([]);
    const fileInput = document.getElementById('file-upload');
    if (fileInput) fileInput.value = "";
  };

  const eliminarProducto = async (id, nombre) => {
    if (window.confirm(`¿Borrar "${nombre}"?`)) {
      await supabase.from('productos').delete().eq('id', id);
      cargarInventario();
    }
  };

  // ==========================================
  // LÓGICA DE PEDIDOS
  // ==========================================
  const cargarTodosLosPedidos = async () => {
    setCargandoPedidos(true);
    // Traemos todos los pedidos
    const { data: pData } = await supabase.from('pedidos').select('*').order('creado_en', { ascending: false });
    // Traemos a todos los clientes para cruzar los datos
    const { data: cData } = await supabase.from('clientes').select('*');
    
    if (pData && cData) {
      // Unimos el pedido con los datos de contacto del cliente
      const pedidosCompletos = pData.map(ped => {
        const clienteInfo = cData.find(c => c.id === ped.cliente_id);
        return { ...ped, clienteInfo };
      });
      setListaPedidos(pedidosCompletos);
    }
    setCargandoPedidos(false);
  };

  const cambiarEstadoPedido = async (idPedido, nuevoEstado) => {
    const { error } = await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', idPedido);
    if (error) alert("Error al cambiar estado: " + error.message);
    else cargarTodosLosPedidos(); // Recarga la lista para mostrar el cambio
  };

  // ==========================================
  // AUTH
  // ==========================================
  const iniciarSesion = async (e) => {
    e.preventDefault();
    setCargandoLogin(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('Error: ' + error.message);
    setCargandoLogin(false);
  };

  const cerrarSesion = async () => await supabase.auth.signOut();

  // RENDERIZADO NO LOGUEADO
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow border-t-4 border-marca-amarillo">
          <div className="flex justify-center mb-6"><Settings className="w-12 h-12 text-marca-amarillo" /></div>
          <h2 className="text-2xl font-black text-center mb-6">Acceso Administrador</h2>
          <form className="space-y-4">
            <input type="email" placeholder="Email" required className="w-full p-2 border rounded" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Contraseña" required className="w-full p-2 border rounded" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={iniciarSesion} disabled={cargandoLogin} className="w-full bg-marca-amarillo font-bold py-2 rounded">Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  // RENDERIZADO LOGUEADO
  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      
      {/* BARRA SUPERIOR DE ADMINISTRADOR */}
      <header className="bg-marca-negro text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Settings className="text-marca-amarillo w-8 h-8" />
          <h1 className="text-xl font-black tracking-widest uppercase">Panel de Control</h1>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setPestanaActiva('inventario')} 
            className={`flex items-center gap-2 px-4 py-2 font-bold rounded transition-colors ${pestanaActiva === 'inventario' ? 'bg-marca-amarillo text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            <Box className="w-5 h-5" /> Inventario
          </button>
          <button 
            onClick={() => setPestanaActiva('pedidos')} 
            className={`flex items-center gap-2 px-4 py-2 font-bold rounded transition-colors ${pestanaActiva === 'pedidos' ? 'bg-marca-amarillo text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            <Package className="w-5 h-5" /> Pedidos de Clientes
          </button>
          <button onClick={cerrarSesion} className="ml-4 text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
            <LogOut className="w-5 h-5" /> Salir
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8">
        
        {/* =========================================
            PESTAÑA: GESTIÓN DE INVENTARIO
            ========================================= */}
        {pestanaActiva === 'inventario' && (
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 animate-fade-in">
            {/* Formulario de carga (El mismo que ya tenías) */}
            <div className="w-full lg:w-[45%] xl:w-[40%] bg-white p-6 rounded-lg shadow-md border-t-4 border-marca-amarillo self-start sticky top-24">
              <h2 className="text-2xl font-bold text-marca-negro mb-6">
                {productoEditandoId ? 'Editar Repuesto' : 'Cargar Nuevo Repuesto'}
              </h2>
              <form onSubmit={manejarGuardar} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase">Nombre</label>
                    <input type="text" required className="mt-1 w-full p-2 text-sm border rounded focus:ring-2 focus:ring-marca-amarillo outline-none" value={formulario.nombre} onChange={(e) => setFormulario({...formulario, nombre: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase">Categoría</label>
                    <select className="mt-1 w-full p-2 text-sm border rounded" value={formulario.categoria} onChange={(e) => setFormulario({...formulario, categoria: e.target.value})}>
                      <option>Motor</option><option>Frenos</option><option>Herramientas</option><option>Accesorios</option><option>Baterías</option><option>Suspensión</option><option>Lubricantes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">Descripción</label>
                  <textarea rows="3" className="mt-1 w-full p-2 text-sm border rounded focus:ring-2 focus:ring-marca-amarillo outline-none" value={formulario.descripcion} onChange={(e) => setFormulario({...formulario, descripcion: e.target.value})}></textarea>
                </div>

                <div className="p-3 bg-gray-50 border rounded grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase">Precio Normal ($)</label>
                    <input type="number" required className="mt-1 w-full p-2 text-sm border rounded" value={formulario.precio} onChange={(e) => setFormulario({...formulario, precio: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase">% Descuento</label>
                    <input type="number" min="0" max="99" className="mt-1 w-full p-2 text-sm border rounded" value={formulario.descuento} onChange={(e) => setFormulario({...formulario, descuento: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase">Cuotas S/Interés</label>
                    <select className="mt-1 w-full p-2 text-sm border rounded" value={formulario.cuotas} onChange={(e) => setFormulario({...formulario, cuotas: e.target.value})}>
                      <option value="1">1 pago</option><option value="3">3 Cuotas</option><option value="6">6 Cuotas</option><option value="12">12 Cuotas</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 justify-center mt-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                      <input type="checkbox" className="w-4 h-4 text-marca-amarillo" checked={formulario.envio_gratis} onChange={(e) => setFormulario({...formulario, envio_gratis: e.target.checked})} />
                      Envío Gratis
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                      <input type="checkbox" className="w-4 h-4 text-green-600" checked={formulario.hay_stock} onChange={(e) => setFormulario({...formulario, hay_stock: e.target.checked})} />
                      {formulario.hay_stock ? <span className="text-green-600">Hay Stock</span> : <span className="text-red-500">Sin Stock</span>}
                    </label>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 border rounded">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase mb-2">
                    <Upload className="w-4 h-4" /> Subir fotos (PC)
                  </label>
                  <input id="file-upload" type="file" accept="image/*" multiple className="w-full text-xs file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-marca-amarillo file:text-black cursor-pointer mb-2" onChange={(e) => setArchivosImagen(Array.from(e.target.files))} />
                  <div className="text-center text-[10px] font-bold text-gray-400 uppercase my-2">Ó pega un link</div>
                  <input type="text" placeholder="https://..." className="w-full p-2 text-sm border rounded" value={formulario.imagen_url} onChange={(e) => { setFormulario({...formulario, imagen_url: e.target.value}); setArchivosImagen([]); document.getElementById('file-upload').value = ""; }} />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={cargandoGuardar} className="flex-1 bg-marca-amarillo text-black font-black py-3 px-4 rounded hover:bg-yellow-500 transition-colors disabled:opacity-50">
                    {cargandoGuardar ? 'Guardando...' : (productoEditandoId ? 'ACTUALIZAR' : 'CREAR PRODUCTO')}
                  </button>
                  {productoEditandoId && (
                    <button type="button" onClick={cancelarEdicion} className="px-4 py-3 bg-gray-200 text-gray-700 font-bold rounded hover:bg-gray-300 transition-colors">CANCELAR</button>
                  )}
                </div>
              </form>
            </div>

            {/* Tabla de Inventario */}
            <div className="w-full lg:flex-1 bg-white p-6 rounded-lg shadow-md border-t-4 border-gray-800">
              <h2 className="text-2xl font-bold text-marca-negro mb-6 flex items-center gap-2">
                Inventario Cargado <span className="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{productos.length}</span>
              </h2>
              {cargandoLista ? (
                <div className="text-center py-10 text-gray-500">Cargando inventario...</div>
              ) : productos.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded border border-dashed">Aún no hay repuestos cargados.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                      <tr>
                        <th className="p-3 rounded-tl">Producto</th>
                        <th className="p-3">Precio/Desc.</th>
                        <th className="p-3 text-center">Stock</th>
                        <th className="p-3 text-right rounded-tr">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productos.map((prod) => (
                        <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <img src={prod.galeria && prod.galeria.length > 0 ? prod.galeria[0] : prod.imagen_url || 'https://placehold.co/100'} alt={prod.nombre} className="w-12 h-12 object-contain bg-white border rounded p-1" />
                              <div>
                                <p className="font-bold text-marca-negro line-clamp-1" title={prod.nombre}>{prod.nombre}</p>
                                <p className="text-xs text-gray-500">{prod.categoria}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="font-bold">${prod.precio.toLocaleString('es-AR')}</p>
                            {prod.descuento > 0 && <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-bold">{prod.descuento}% OFF</span>}
                          </td>
                          <td className="p-3 text-center">
                            {prod.hay_stock ? <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle className="w-3 h-3" /> SI</span> : <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold"><XCircle className="w-3 h-3" /> NO</span>}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => iniciarEdicion(prod)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Editar"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => eliminarProducto(prod.id, prod.nombre)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Borrar"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================
            PESTAÑA: GESTIÓN DE PEDIDOS
            ========================================= */}
        {pestanaActiva === 'pedidos' && (
          <div className="max-w-7xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md border-t-4 border-blue-500 animate-fade-in">
            <h2 className="text-2xl font-bold text-marca-negro mb-8 flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-500" /> Órdenes de Compra
            </h2>

            {cargandoPedidos ? (
              <div className="text-center py-20 text-gray-500 font-bold">Cargando base de datos de pedidos...</div>
            ) : listaPedidos.length === 0 ? (
              <div className="text-center py-20 text-gray-500 bg-gray-50 rounded border border-dashed border-gray-300">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                Aún no has recibido ningún pedido a través de la web.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {listaPedidos.map(pedido => {
                  const fecha = new Date(pedido.creado_en).toLocaleString('es-AR');
                  // Estilos visuales según el estado
                  let colorBorde = 'border-yellow-400';
                  if(pedido.estado === 'Confirmado') colorBorde = 'border-blue-400';
                  if(pedido.estado === 'Entregado') colorBorde = 'border-green-500';
                  if(pedido.estado === 'Cancelado') colorBorde = 'border-red-500';

                  return (
                    <div key={pedido.id} className={`border-2 rounded-lg p-5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-gray-50 ${colorBorde}`}>
                      
                      {/* Datos del Cliente y Pedido */}
                      <div className="flex-1 w-full">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Fecha: {fecha}</p>
                            <h3 className="text-lg font-black text-marca-negro">
                              {pedido.clienteInfo ? `${pedido.clienteInfo.nombre} ${pedido.clienteInfo.apellido}` : 'Cliente Sin Nombre'}
                            </h3>
                            <p className="text-sm text-gray-600 font-medium">{pedido.clienteInfo?.email || 'Email no disponible'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Total a cobrar</p>
                            <p className="text-2xl font-black text-marca-negro">${pedido.total.toLocaleString('es-AR')}</p>
                          </div>
                        </div>

                        {/* Detalle de repuestos */}
                        <div className="bg-white p-3 rounded border border-gray-200 mt-2">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Artículos solicitados:</p>
                          <p className="text-sm font-medium text-gray-700 whitespace-pre-line leading-relaxed pl-2 border-l-2 border-marca-amarillo">
                            {pedido.detalle}
                          </p>
                        </div>
                        
                        {/* Datos de contacto (Teléfono / Dirección) */}
                        {pedido.clienteInfo && (
                          <div className="mt-3 text-sm text-gray-600 flex flex-wrap gap-4">
                            {pedido.clienteInfo.telefono && <span>📞 {pedido.clienteInfo.telefono}</span>}
                            {pedido.clienteInfo.direccion && <span>📍 {pedido.clienteInfo.direccion}, {pedido.clienteInfo.ciudad}</span>}
                          </div>
                        )}
                      </div>

                      {/* Selector de Estado */}
                      <div className="w-full md:w-auto bg-white p-4 rounded border border-gray-200 shadow-sm flex flex-col items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Cambiar Estado</label>
                        <select 
                          className="p-2 font-bold border-2 border-gray-300 rounded cursor-pointer outline-none focus:border-blue-500 text-marca-negro text-center"
                          value={pedido.estado}
                          onChange={(e) => cambiarEstadoPedido(pedido.id, e.target.value)}
                        >
                          <option value="Pendiente">⏳ Pendiente</option>
                          <option value="Confirmado">📦 Confirmado / Preparando</option>
                          <option value="Entregado">✅ Entregado / Pagado</option>
                          <option value="Cancelado">❌ Cancelado</option>
                        </select>
                      </div>
                      
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}