import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function Inicio() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  const handleContinuar = () => {
    if (userName.trim()) {
      localStorage.setItem('userName', userName);
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