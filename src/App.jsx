import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Admin from './Admin';
import Tienda from './Tienda';
import ProductoDetalle from './ProductoDetalle';
import Catalogo from './Catalogo';
import MiCuenta from './MiCuenta';
import Ayuda from './Ayuda';

export default function App() {
  // Colocá acá el número de tu local (Ej: 5492971234567)
  const numeroLocal = "5492974377349"; 

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Tienda />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/producto/:id" element={<ProductoDetalle numeroWhatsApp={numeroLocal} />} />
        <Route path="/cuenta" element={<MiCuenta />} />
       <Route path="/ayuda" element={<Ayuda />} />
      </Routes>
    </BrowserRouter>
  );
}