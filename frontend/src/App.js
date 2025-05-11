import { useEffect } from 'react';
import Inicio from './inicio/pages/Inicio.jsx';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Home from './inicio/pages/Home.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import Chat from './inicio/pages/Chat.jsx';

// Componente para verificar y preservar el estado en caso de navegación manual
const RootRedirect = () => {
  const navigate = useNavigate();
  const roomCode = localStorage.getItem('roomCode');
  const userName = localStorage.getItem('userName');
  
  useEffect(() => {
    navigate('/Inicio', { replace: true });
  }, [navigate]);
  
  return null;
};

// Componente para proteger rutas que requieren autenticación
const ProtectedRoute = ({ children }) => {
  const userName = localStorage.getItem('userName');
  
  if (!userName) {
    // No autenticado, redirigir a inicio
    return <Navigate to="/Inicio" replace />;
  }
  
  return children;
};

// Componente para proteger la ruta de Chat que requiere userName y roomCode
const ProtectedChatRoute = ({ children }) => {
  const userName = localStorage.getItem('userName');
  const roomCode = localStorage.getItem('roomCode');
  
  if (!userName) {
    // No autenticado, redirigir a inicio
    return <Navigate to="/Inicio" replace />;
  }
  
  if (!roomCode) {
    // Autenticado pero sin sala, redirigir a Home
    return <Navigate to="/Home" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raíz que maneja redirecciones según el estado */}
        <Route path="/" element={<RootRedirect />} />
        
        <Route path="/Inicio" element={<Inicio/>} />
        <Route path="/Home" element={
          <ProtectedRoute>
            <Home/>
          </ProtectedRoute>
        } />
        <Route path="/Chat" element={
          <ProtectedChatRoute>
            <Chat/>
          </ProtectedChatRoute>
        } />
        {/* Ruta para manejar cualquier otra URL no válida */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
