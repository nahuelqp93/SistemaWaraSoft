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
                    marginBottom: 'clamp(1rem, 2vw, 1.5rem)'
                }}>INTERCOM</h1>
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
                <div
                    style={{
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: 'clamp(8px, 2vw, 12px)',
                        height: 'clamp(300px, 60vh, 600px)',
                        overflowY: 'auto',
                        marginBottom: 'clamp(16px, 3vw, 24px)',
                        backgroundColor: '#fff',
                        fontSize: 'clamp(14px, 2vw, 16px)'
                    }}
                >
                    {messages.length === 0 ? (
                        <div className="text-center text-muted" style={{ 
                            fontSize: 'clamp(14px, 2vw, 18px)',
                            padding: 'clamp(16px, 3vw, 24px)'
                        }}>
                            No hay mensajes aún. ¡Sé el primero en escribir!
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const senderName = msg.split('[')[0]?.trim() || '';
                            const isOwnMessage = senderName === userName;
                            const isNotification = !msg.includes(':');
                            
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
                                    style={{
                                        marginBottom: 'clamp(8px, 2vw, 12px)',
                                        padding: 'clamp(8px, 2vw, 12px)',
                                        background: isNotification ? '#e9ecef' : (isOwnMessage ? '#007bff' : '#f1f1f1'),
                                        color: isOwnMessage ? 'white' : 'black',
                                        borderRadius: '6px',
                                        textAlign: isOwnMessage ? 'right' : 'left',
                                        marginLeft: isOwnMessage ? 'auto' : '0',
                                        marginRight: isOwnMessage ? '0' : 'auto',
                                        maxWidth: 'min(85%, 600px)',
                                        wordBreak: 'break-word',
                                        fontStyle: isNotification ? 'italic' : 'normal',
                                        fontSize: 'clamp(14px, 2vw, 16px)'
                                    }}
                                >
                                    {formattedMessage}
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