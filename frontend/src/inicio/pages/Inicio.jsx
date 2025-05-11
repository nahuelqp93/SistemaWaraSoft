import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function Inicio() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  // Limpiar cualquier dato de sesión anterior al llegar a esta página
  useEffect(() => {
    // Limpiar localStorage y sessionStorage para asegurar un inicio de sesión limpio
    localStorage.removeItem('userName');
    localStorage.removeItem('roomCode');
    
    // Limpiar banderas de salas previas
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('left_')) {
        sessionStorage.removeItem(key);
      }
    });
  }, []);

  const handleContinuar = () => {
    if (userName.trim()) {
      // Guardar nombre de usuario
      localStorage.setItem('userName', userName);
      
      // Generar un nuevo ID de sesión
      const sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('sessionId', sessionId);
      console.log('Nuevo ID de sesión generado:', sessionId);
      
      navigate('/Home');
    } else {
      alert('Por favor, ingresa un nombre de usuario');
    }
  };

  return (
    <div className="container-fluid d-flex flex-column justify-content-center align-items-center min-vh-100">
      <div className="text-center">
        <h1 className="mb-5">INTERCOM</h1>

        <div className="mb-4">
          <input
            type="text"
            className="form-control text-center"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Ingrese su nombre de usuario"
            style={{ maxWidth: '300px' }}
          />
        </div>

        <button 
          className="btn btn-primary btn-lg"
          onClick={handleContinuar}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

export default Inicio;