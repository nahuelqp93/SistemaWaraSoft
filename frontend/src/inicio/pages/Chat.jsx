import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState(0);
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName');
    const roomCode = localStorage.getItem('roomCode') || '0000'; 
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);
    const [tabId] = useState(() => {
        const id = Math.random().toString(36).substring(2, 15);
        console.log('Nuevo ID de pestaña generado:', id);
        return id;
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!userName) {
            navigate('/Inicio');
            return;
        }

        const ws = new WebSocket('ws://localhost:3000');
        setSocket(ws);

        ws.onopen = () => {
            console.log('Conectado al servidor WebSocket');
            setIsConnected(true);
            const joinMessage = { 
                type: 'joinRoom', 
                userName: `${userName}_${tabId}`,
                displayName: userName,
                roomCode 
            };
            console.log('Enviando mensaje de unión a sala:', joinMessage);
            ws.send(JSON.stringify(joinMessage));
        };

        ws.onmessage = (event) => {
            console.log('Mensaje recibido del servidor:', event.data);
            try {
                const data = JSON.parse(event.data);
                console.log('Mensaje parseado:', data);
                
                if (data.type === 'userCount') {
                    setConnectedUsers(data.count);
                } else if (data.roomCode === roomCode) {
                    console.log('Agregando mensaje a la sala:', data.message);
                    setMessages(prevMessages => {
                        const newMessages = [...prevMessages, data.message];
                        console.log('Nuevo estado de mensajes:', newMessages);
                        return newMessages;
                    });
                } else {
                    console.log('Mensaje ignorado - código de sala no coincide');
                }
            } catch (error) {
                console.error('Error al procesar mensaje:', error);
            }
        };

        ws.onclose = (event) => {
            console.log('Desconectado del servidor WebSocket', event.reason);
            setIsConnected(false);
        };

        ws.onerror = (error) => {
            console.error('Error en la conexión WebSocket:', error);
            setIsConnected(false);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                const leaveMessage = { 
                    type: 'leaveRoom', 
                    userName: `${userName}_${tabId}`,
                    displayName: userName,
                    roomCode 
                };
                console.log('Enviando mensaje de salida:', leaveMessage);
                ws.send(JSON.stringify(leaveMessage));
            }
            ws.close();
        };
    }, [userName, roomCode, navigate, tabId]);

    const handleSendMessage = () => {
        if (!isConnected) {
            alert('No hay conexión con el servidor. Por favor, intenta recargar la página.');
            return;
        }
        
        if (message.trim() && socket && socket.readyState === WebSocket.OPEN) {
            const messageToSend = {
                type: 'sendMessage',
                userName: `${userName}_${tabId}`,
                displayName: userName,
                message: message.trim(),
                roomCode
            };
            console.log('Enviando mensaje al servidor:', messageToSend);
            socket.send(JSON.stringify(messageToSend));
            setMessage('');
        } else {
            console.log('No se pudo enviar el mensaje:', {
                isConnected,
                hasSocket: !!socket,
                socketState: socket?.readyState,
                message: message.trim()
            });
        }
    };

    const handleSalirChat = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            const leaveMessage = {
                type: 'leaveRoom',
                userName: `${userName}_${tabId}`,
                displayName: userName,
                roomCode
            };
            console.log('Enviando mensaje de salida:', leaveMessage);
            socket.send(JSON.stringify(leaveMessage));
            socket.close();
        }
        navigate('/Home');
    };

    useEffect(() => {
        console.log('Estado actual de mensajes:', messages);
    }, [messages]);

    return (
        <div className="bg-light" style={{
            height: 'calc(100vh - 20px)',     
            paddingTop: '10px',
            paddingBottom: '10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            overflowY: 'auto',
            gap: '20px'
        }}>
            <div style={{ 
                width: 'min(80vw, 600px)',
                padding: 'clamp(30px, 5vh, 50px)',
                border: '1px solid #ccc',
                borderRadius: '8px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                margin: 'clamp(100px, 15vh, 150px) auto'
            }}>
                <h1 className="text-center mb-4" style={{ 
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                 marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
                background: 'linear-gradient(45deg, #3a7bd5, #00d2ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800,
                fontFamily: '"Poppins", sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
                }}>💬 INTERCOM</h1>
                <p className="text-center text-muted mb-2" style={{ 
                    fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                    marginBottom: 'clamp(0.5rem, 1vw, 1rem)'
                }}>
                    Sala: {roomCode}
                </p>
                <p className="text-center text-muted mb-2" style={{ 
                    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                    marginBottom: 'clamp(0.5rem, 1vw, 1rem)'
                }}>
                    Usuario: {userName}
                </p>
                <button
                    onClick={handleSalirChat}
                    style={{
                        backgroundColor: 'red',
                        color: 'white',
                        padding: 'clamp(8px, 2vw, 12px) clamp(16px, 3vw, 24px)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        width: '100%',
                        marginBottom: 'clamp(16px, 3vw, 24px)',
                        fontSize: 'clamp(14px, 2vw, 16px)',
                        fontWeight: 'bold'
                    }}
                >
                    ABANDONAR CHAT
                </button>
                {!isConnected && (
                    <div className="alert alert-warning text-center mb-3" style={{
                        fontSize: 'clamp(14px, 2vw, 16px)',
                        padding: 'clamp(8px, 2vw, 12px)'
                    }}>
                        No hay conexión con el servidor. Por favor, intenta recargar la página.
                    </div>
                )}
                <div style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '16px',
                    height: 'clamp(300px, 60vh, 600px)',
                    overflowY: 'auto',
                    marginBottom: '24px',
                    backgroundColor: '#f9f9f9',
                    backgroundImage: 'linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                    }}
                >
                     {messages.length === 0 ? (
                        <div className="text-center" style={{ 
                            padding: '40px',
                            color: '#6c757d',
                            fontSize: '18px',
                            fontStyle: 'italic'
                        }}>
                            No hay mensajes aún. ¡Sé el primero en escribir!
                        </div>
                    ) : (
                         messages.map((msg, index) => {
                        const senderName = msg.split('[')[0]?.trim() || '';
                        const isOwnMessage = senderName === userName;
                        const isNotification = !msg.includes(':');
                            const messageStyle = {
                            marginBottom: '12px',
                            padding: '12px 16px',
                            borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: isOwnMessage ? '#007bff' : '#ffffff',
                            color: isOwnMessage ? 'white' : '#333',
                            textAlign: isOwnMessage ? 'right' : 'left',
                            maxWidth: '80%',
                            wordBreak: 'break-word',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            fontSize: '15px',
                            border: isOwnMessage ? 'none' : '1px solid #e0e0e0'
            };
                            let formattedMessage = msg;
                            if (!isNotification && msg.includes('[') && msg.includes(']:')) {
                                try {
                                    const parts = msg.split('[');
                                    const name = parts[0];
                                    const timeAndMessage = parts[1];
                                    const [time, message] = timeAndMessage.split(']: ');
                                    
                                    formattedMessage = (
                                        <>
                                            {name}
                                            <span style={{ 
                                                fontSize: 'clamp(12px, 1.8vw, 14px)',
                                                opacity: 0.8,
                                                marginLeft: '4px',
                                                marginRight: '4px'
                                            }}>
                                                [{time}]
                                            </span>
                                            : {message}
                                        </>
                                    );
                                } catch (error) {
                                    console.error('Error al formatear mensaje:', error);
                                    formattedMessage = msg;
                                }
                            }
                            
                            return (
                                        <div
                                            key={index}
                                            style={messageStyle}
                                        >
                                            {!isNotification && (
                                                <div style={{
                                                    fontWeight: 'bold',
                                                    marginBottom: '4px',
                                                    fontSize: '14px',
                                                    color: isOwnMessage ? 'rgba(255,255,255,0.9)' : '#007bff'
                                                }}>
                                                    {senderName}
                                                </div>
                                            )}
                                            {msg.split(']: ')[1] || msg}
                                            {!isNotification && (
                                                <div style={{
                                                    fontSize: '12px',
                                                    opacity: 0.7,
                                                    marginTop: '4px',
                                                    textAlign: isOwnMessage ? 'right' : 'left'
                                                }}>
                                                    {msg.match(/\[(.*?)\]/)?.[1] || ''}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'clamp(8px, 2vw, 12px)',
                    marginBottom: 'clamp(16px, 3vw, 24px)'
                }}>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        style={{
                            flex: 1,
                            padding: 'clamp(8px, 2vw, 12px)',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            fontSize: 'clamp(14px, 2vw, 16px)'
                        }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleSendMessage();
                            }
                        }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!isConnected}
                        style={{
                            backgroundColor: isConnected ? 'blue' : '#cccccc',
                            color: 'white',
                            padding: 'clamp(8px, 2vw, 12px) clamp(16px, 3vw, 24px)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isConnected ? 'pointer' : 'not-allowed',
                            fontSize: 'clamp(14px, 2vw, 16px)',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Enviar
                    </button>
                </div>
            </div>

            <div style={{
                width: '200px',
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #ccc',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                margin: 'clamp(100px, 15vh, 150px) 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '15px'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#007bff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '40px'
                }}>
                    👤
                </div>
                <div style={{
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#495057'
                }}>
                    CANTIDAD DE USUARIOS:
                </div>
                <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#007bff'
                }}>
                    {connectedUsers}
                </div>
            </div>
        </div>
    );
};

export default Chat;