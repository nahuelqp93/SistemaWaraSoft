import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Usuario#Anonimo';
    const roomCode = localStorage.getItem('roomCode') || '0000'; 
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3000');
        setSocket(ws);

        ws.onopen = () => {
            console.log('Conectado al servidor WebSocket');
            ws.send(JSON.stringify({ type: 'joinRoom', userName }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages((prevMessages) => [...prevMessages, data.message]);
        };

        ws.onclose = (event) => {
            console.log('Desconectado del servidor WebSocket', event.reason);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'leaveRoom', userName }));
            }
            ws.close();
        };
    }, [userName]);

    const handleSendMessage = () => {
        if (message.trim() && socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'sendMessage', userName, message }));
            setMessage('');
        }
    };

    const handleSalirChat = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'leaveRoom', userName }));
            socket.close();
        }
        navigate('/HomeDerick');
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <div style={{ width: '400px', padding: '16px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h1 className="text-center mb-4">INTERCOM</h1>
                <p className="text-center text-muted mb-4" style={{ fontSize: '20px' }}>
                    Código de sala: {roomCode}
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
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
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
                <button
                    onClick={handleSalirChat}
                    style={{
                        backgroundColor: 'red',
                        color: 'white',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        width: '100%',
                    }}
                >
                    ABANDONAR CHAT
                </button>
            </div>
        </div>
    );
};

export default Chat;