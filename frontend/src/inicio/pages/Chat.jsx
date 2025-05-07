import React, { useState } from 'react';

const Chat = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    const handleSendMessage = () => {
        if (message.trim()) {
            setMessages([...messages, message]);
            setMessage('');
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <div style={{ width: '400px', padding: '16px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h1 className="text-center mb-4">INTERCOM</h1>
                <p className="text-center text-muted mb-4" style={{ fontSize: '20px' }}>
                    Código de sala: 
                </p>
                <div
                    style={{
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '8px',
                        height: '200px',
                        overflowY: 'auto',
                        marginBottom: '16px',
                    }}
                >
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            style={{
                                marginBottom: '8px',
                                padding: '8px',
                                background: '#f1f1f1',
                                borderRadius: '4px',
                            }}
                        >
                            {msg}
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            marginRight: '8px',
                        }}
                    />
                    <button
                        onClick={handleSendMessage}
                        style={{
                            backgroundColor: 'blue',
                            color: 'white',
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Enviar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;