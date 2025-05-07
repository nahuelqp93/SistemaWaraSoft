import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const HomeDerick = () => {
    const [showForm, setShowForm] = useState(false);
    const [code, setCode] = useState('');

    const handleJoinRoom = () => {
        setShowForm(!showForm);
    };

    const handleCodeChange = (e) => {
        setCode(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(`Código ingresado: ${code}`);
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <div className="text-center">
                <h1 className="mb-4">INTERCOM</h1>
                <h3 className="mb-4">Bienvenido...</h3>
                <div className="d-flex flex-column gap-3">
                    <button className="btn btn-primary btn-lg" onClick={() => alert('Crear sala')}>
                        CREAR SALA
                    </button>
                    <button className="btn btn-primary btn-lg" onClick={handleJoinRoom}>
                        UNIRME A UNA SALA
                    </button>
                </div>
                {showForm && (
                    <form className="mt-4" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="roomCode">Ingrese el código: </label>
                            <input
                                type="text"
                                id="roomCode"
                                className="form-control"
                                maxLength="4"
                                value={code}
                                onChange={handleCodeChange}
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