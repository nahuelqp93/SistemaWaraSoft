import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const InicioDerick = () => {
    const randomUser = `USUARIO #${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`;
    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <div className="text-center">
                <h1 className="mb-4">INTERCOM</h1>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder={randomUser}
                        aria-label="Usuario"
                    />
                </div>
                <button className="btn btn-primary btn-lg">INICIAR</button>
            </div>
        </div>
    );
};

export default InicioDerick;