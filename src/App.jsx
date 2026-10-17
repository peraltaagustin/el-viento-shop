import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Admin from './Admin';
import Tienda from './Tienda';
import ProductoDetalle from './ProductoDetalle';
import Catalogo from './Catalogo';
import MiCuenta from './MiCuenta';

export default function App() {
  // Colocá acá el número de tu local (Ej: 5492971234567)
  const numeroLocal = "5493541336420"; 

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Tienda />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/producto/:id" element={<ProductoDetalle numeroWhatsApp={numeroLocal} />} />
        <Route path="/cuenta" element={<MiCuenta />} />
      </Routes>
    </BrowserRouter>
  );
}