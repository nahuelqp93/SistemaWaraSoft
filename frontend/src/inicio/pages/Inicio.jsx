import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Inicio.css';

function Inicio() {
  const [equipoInfo, setEquipoInfo] = useState({
    nombre: '',
    integrantes: []
  });

  useEffect(() => {
    fetch('http://localhost:3000/api/equipo')
      .then(res => res.json())
      .then(data => setEquipoInfo(data))
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div className="container-fluid d-flex flex-column justify-content-center align-items-center min-vh-100">
      <div className="text-center">
        <h1 className="display-4 mb-4">EQUIPO Y NOMBRE DE </h1>
        <h2 className="mb-5">{equipoInfo.nombre}</h2>
        
        <h3 className="text-danger mb-4">INTEGRANTES</h3>
        <ul className="list-unstyled">
          {equipoInfo.integrantes.map((integrante, index) => (
            <li key={index} className="mb-2 fs-5">{integrante}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Inicio; 