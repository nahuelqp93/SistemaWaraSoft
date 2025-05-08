import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const HomeDerick = () => {
    const [showForm, setShowForm] = useState(false);
    const [code, setCode] = useState('');
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Usuario#Anonimo';

    const handleUnirChat = () => {
        setShowForm(!showForm);
    };

    const handleCodigos = (e) => {
        setCode(e.target.value);
    };

    const handleEnviar = (e) => {
        e.preventDefault();
        alert(`Código ingresado: ${code}`);
    };

    const handleCrearSala = () => {
        const roomCode = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        localStorage.setItem('roomCode', roomCode); 
        navigate('/Chat'); 
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <div className="text-center">
                <h1 className="mb-4">INTERCOM</h1>
                <h3 className="mb-4">Bienvenido {userName}</h3>
                <div className="d-flex flex-column gap-3">
                    <button className="btn btn-primary btn-lg" onClick={handleCrearSala}>
                        CREAR SALA
                    </button>
                    <button className="btn btn-primary btn-lg" onClick={handleUnirChat}>
                        UNIRME A UNA SALA
                    </button>
                </div>
                {showForm && (
                    <form className="mt-4" onSubmit={handleEnviar}>
                        <div className="form-group">
                            <label htmlFor="roomCode">Ingrese el código: </label>
                            <input
                                type="text"
                                id="roomCode"
                                className="form-control"
                                maxLength="4"
                                value={code}
                                onChange={handleCodigos}
                                placeholder="Código de 4 dígitos"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg mt-3">
                            UNIRME
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default HomeDerick;