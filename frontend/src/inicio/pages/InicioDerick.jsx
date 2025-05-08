import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function InicioDerick() {
  const navigate = useNavigate();

  const handleContinuar = () => {
    navigate('/HomeDerick');
  };

  return (
    <div className="container-fluid d-flex flex-column justify-content-center align-items-center min-vh-100">
      <div className="text-center">
        <h1 className="display-4 mb-4">Bienvenido a WARASOFT</h1>
        <h2 className="mb-5">Sistema de Colaboración</h2>
        
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

export default InicioDerick; 