import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Home = () => {
    const [showForm, setShowForm] = useState(false);
    const [code, setCode] = useState('');
    const [userName, setUserName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const storedUserName = localStorage.getItem('userName');
        if (!storedUserName) {
            navigate('/Inicio');
            return;
        }
        setUserName(storedUserName);
        
        // Asegurarnos de que exista un ID de sesión
        if (!sessionStorage.getItem('sessionId')) {
            const sessionId = Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('sessionId', sessionId);
            console.log('Nuevo ID de sesión generado:', sessionId);
        }
    }, [navigate]);

    const handleUnirChat = () => {
        setShowForm(!showForm);
    };

    const handleCodigos = (e) => {
        setCode(e.target.value);
    };

    const handleEnviar = (e) => {
        e.preventDefault();
        if (code.length === 4) {
            // Limpiar el flag de abandono de sala para permitir unirse de nuevo
            sessionStorage.removeItem(`left_${code}`);
            
            localStorage.setItem('roomCode', code);
            navigate('/Chat');
        } else {
            alert('Por favor, ingresa un código válido de 4 dígitos');
        }
    };

    const handleCrearSala = () => {
        const roomCode = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        
        // Limpiar el flag de abandono de sala para permitir unirse de nuevo
        sessionStorage.removeItem(`left_${roomCode}`);
        
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

export default Home;

