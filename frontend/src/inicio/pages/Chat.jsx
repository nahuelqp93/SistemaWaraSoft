import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState(0);
    const [userList, setUserList] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName');
    const roomCode = localStorage.getItem('roomCode'); 
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);
    const hasLeftRoom = useRef(false);
    const typingTimeoutRef = useRef(null);
    const activityTimeoutRef = useRef(null);
    const [sessionId] = useState(() => {
        let id = sessionStorage.getItem('sessionId');
        if (!id) {
            id = Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('sessionId', id);
        }
        console.log('ID de sesión:', id);
        return id;
    });

    // Verificar la validez del roomCode
    useEffect(() => {
        // Si no hay código de sala o es inválido, redirigir a Home
        if (!roomCode || roomCode.length !== 4) {
            console.error('Código de sala inválido:', roomCode);
            navigate('/Home');
            return;
        }
    }, [roomCode, navigate]);

    // Comprobación inmediata de autenticación antes de cualquier renderizado
    useEffect(() => {
        if (!userName || !roomCode) {
            console.log('Sin credenciales de autenticación. Redirigiendo...');
            localStorage.removeItem('userName');
            localStorage.removeItem('roomCode');
            navigate('/Inicio');
            return;
        }
    }, [userName, roomCode, navigate]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    useEffect(() => {
        const handlePopState = (event) => {
            if (sessionStorage.getItem(`left_${roomCode}`) === 'true') {
                window.history.pushState(null, '', '/Home');
                navigate('/Home');
            }
        };

        window.addEventListener('popstate', handlePopState);
        window.history.pushState(null, '', window.location.href);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [navigate, roomCode]);

    useEffect(() => {
        if (!userName) {
            localStorage.removeItem('userName');
            localStorage.removeItem('roomCode');
            navigate('/Inicio');
            return;
        }

        if (!roomCode) {
            navigate('/Home');
            return;
        }
        
        const leftRoomFlag = sessionStorage.getItem(`left_${roomCode}`);
        if (leftRoomFlag === 'true') {
            console.log('Usuario intentó volver a una sala que abandonó. Redirigiendo...');
            navigate('/Home');
            return;
        }

        const ws = new WebSocket('ws://localhost:3002');
        setSocket(ws);

        ws.onopen = () => {
            console.log('Conectado al servidor WebSocket');
            setIsConnected(true);
            const joinMessage = { 
                type: 'joinRoom', 
                userName: `${userName}_${sessionId}`,
                displayName: userName,
                roomCode 
            };
            console.log('Enviando mensaje de unión a sala:', joinMessage);
            ws.send(JSON.stringify(joinMessage));
        };

        ws.onmessage = (event) => {
            console.log('MENSAJE RECIBIDO:', event.data);
            try {
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case 'userList':
                        setConnectedUsers(data.count);
                        setUserList(data.users);
                        break;
                        
                    case 'typingStatus':
                        handleTypingStatus(data);
                        break;
                        
                    case 'messageHistory':
                        handleMessageHistory(data);
                        break;
                        
                    case 'message':
                        if (data.roomCode === roomCode) {
                            console.log('MENSAJE DE CHAT RECIBIDO:', data);
                            
                            // Agregar el mensaje a la lista de mensajes
                            if (data.message && typeof data.message === 'string') {
                                console.log('Agregando mensaje simple:', data.message);
                                setMessages(prevMessages => [...prevMessages, data.message]);
                            }
                            else {
                                // Es un mensaje completo
                                const formattedMessage = `${data.sender} [${new Date(data.timestamp).toLocaleTimeString('es-ES', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}]: ${data.message}`;
                                
                                console.log('Agregando mensaje formateado:', formattedMessage);
                                setMessages(prevMessages => [...prevMessages, formattedMessage]);
                            }
                            
                            // Scroll al fondo después de agregar el mensaje
                            setTimeout(scrollToBottom, 50);
                        }
                        break;
                        
                    default:
                        console.log('Tipo de mensaje no manejado:', data.type);
                        break;
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
                if (!hasLeftRoom.current) {
                    const leaveMessage = { 
                        type: 'leaveRoom', 
                        userName: `${userName}_${sessionId}`,
                        displayName: userName,
                        roomCode 
                    };
                    console.log('Enviando mensaje de salida (automático):', leaveMessage);
                    ws.send(JSON.stringify(leaveMessage));
                }
            }
            ws.close();
        };
    }, [userName, roomCode, navigate, sessionId]);

    useEffect(() => {
        const handleUserActivity = () => {
            if (!socket || socket.readyState !== WebSocket.OPEN) return;
            
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
            
            const currentUser = userList.find(user => user.name === userName);
            if (!currentUser || currentUser.status === "desconectado") return;
            
            if (currentUser.status === "inactivo") {
                const statusMessage = {
                    type: 'updateStatus',
                    userName: `${userName}_${sessionId}`,
                    displayName: userName,
                    roomCode,
                    status: "activo"
                };
                socket.send(JSON.stringify(statusMessage));
            }
            
            activityTimeoutRef.current = setTimeout(() => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    const statusMessage = {
                        type: 'updateStatus',
                        userName: `${userName}_${sessionId}`,
                        displayName: userName,
                        roomCode,
                        status: "inactivo"
                    };
                    socket.send(JSON.stringify(statusMessage));
                }
                activityTimeoutRef.current = null;
            }, 120000);
        };
        
        window.addEventListener('mousemove', handleUserActivity);
        window.addEventListener('keydown', handleUserActivity);
        window.addEventListener('click', handleUserActivity);
        window.addEventListener('scroll', handleUserActivity);
        
        handleUserActivity();
        
        return () => {
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
            window.removeEventListener('mousemove', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
            window.removeEventListener('click', handleUserActivity);
            window.removeEventListener('scroll', handleUserActivity);
        };
    }, [socket, userName, sessionId, roomCode, userList]);

    const handleTypingStatus = (data) => {
        // Ignorar eventos del propio usuario
        if (data.userName === userName) return;
        
        console.log('Evento de typing recibido:', data);
        
        if (data.isTyping) {
            setTypingUsers(prev => {
                // Si el usuario no está ya en la lista, agregarlo
                if (!prev.includes(data.userName)) {
                    console.log(`${data.userName} está escribiendo...`);
                    return [...prev, data.userName];
                }
                return prev;
            });
        } else {
            setTypingUsers(prev => {
                console.log(`${data.userName} dejó de escribir`);
                // Remover al usuario de la lista de usuarios escribiendo
                return prev.filter(user => user !== data.userName);
            });
        }
    };

    const handleMessageChange = (e) => {
        const newMessage = e.target.value;
        setMessage(newMessage);
        
        if (!isConnected || !socket || socket.readyState !== WebSocket.OPEN) return;
        
        // Enviar evento de typing solo cuando hay contenido y no se ha enviado recientemente
        if (newMessage.trim()) {
            // Si no hay temporizador activo, enviar inmediatamente el evento "está escribiendo"
            if (!typingTimeoutRef.current) {
                const typingMessage = {
                    type: 'typing',
                    userName: `${userName}_${sessionId}`,
                    displayName: userName,
                    roomCode
                };
                socket.send(JSON.stringify(typingMessage));
            }
            
            // Reiniciar el temporizador cada vez que el usuario escribe
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Configurar un nuevo temporizador para indicar que ha dejado de escribir
            typingTimeoutRef.current = setTimeout(() => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    const stopTypingMessage = {
                        type: 'stopTyping',
                        userName: `${userName}_${sessionId}`,
                        displayName: userName,
                        roomCode
                    };
                    socket.send(JSON.stringify(stopTypingMessage));
                }
                typingTimeoutRef.current = null;
            }, 1000); // Reducir a 1 segundo para mayor precisión
        } else {
            // Si el mensaje está vacío, enviar stopTyping inmediatamente
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
                
                const stopTypingMessage = {
                    type: 'stopTyping',
                    userName: `${userName}_${sessionId}`,
                    displayName: userName,
                    roomCode
                };
                socket.send(JSON.stringify(stopTypingMessage));
            }
        }
    };

    const handleSendMessage = () => {
        if (!isConnected) {
            alert('No hay conexión con el servidor. Por favor, intenta recargar la página.');
            return;
        }
        
        if (message.trim() && socket && socket.readyState === WebSocket.OPEN) {
            const messageToSend = {
                type: 'sendMessage',
                userName: `${userName}_${sessionId}`,
                displayName: userName,
                message: message.trim(),
                roomCode
            };
            console.log('Enviando mensaje al servidor:', messageToSend);
            socket.send(JSON.stringify(messageToSend));
            setMessage('');
            
            messageInputRef.current?.focus();
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
                userName: `${userName}_${sessionId}`,
                displayName: userName,
                roomCode
            };
            console.log('Enviando mensaje de salida (explícito):', leaveMessage);
            socket.send(JSON.stringify(leaveMessage));
            socket.close();
            
            hasLeftRoom.current = true;
            sessionStorage.setItem(`left_${roomCode}`, 'true');
        }
        navigate('/Home');
    };

    useEffect(() => {
        console.log('Estado actual de mensajes:', messages);
    }, [messages]);

    const formatMessage = (msg, index) => {
        // Detectar si es una notificación del sistema o un mensaje de chat
        const isNotification = typeof msg === 'string' && (!msg.includes(':') || msg.includes('ha ingresado a la sala') || msg.includes('ha abandonado la sala'));
        
        if (isNotification) {
            return (
                <div 
                    key={index}
                    className="text-center my-2"
                    style={{
                        fontSize: '12px',
                        color: '#6c757d',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(0,0,0,0.03)',
                        borderRadius: '8px',
                        display: 'inline-block',
                        margin: '0 auto'
                    }}
                >
                    {msg}
                </div>
            );
        }
        
        // Para mensajes de chat, extraer el remitente y contenido
        let senderName = '';
        let messageContent = '';
        let messageTime = '';
        
        try {
            // Extraer información del mensaje con formato "sender [time]: content"
            const senderPart = msg.split('[')[0]?.trim() || '';
            senderName = senderPart;
            
            const parts = msg.match(/\[(.*?)\]:\s*(.*)/);
            if (parts && parts.length >= 3) {
                messageTime = parts[1];
                messageContent = parts[2];
            } else {
                // Fallback si el formato no coincide
                messageContent = msg;
            }
        } catch (error) {
            console.error('Error al analizar mensaje:', error);
            messageContent = msg;
        }
        
        const isOwnMessage = senderName === userName;
        
        const messageStyle = {
            marginBottom: '12px',
            padding: '12px 16px',
            borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isOwnMessage ? '#DCF8C6' : '#ffffff',
            color: '#303030',
            textAlign: 'left',
            maxWidth: '80%',
            wordBreak: 'break-word',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            fontSize: '15px',
            border: isOwnMessage ? 'none' : '1px solid #e0e0e0',
            marginLeft: isOwnMessage ? 'auto' : '0',
            marginRight: isOwnMessage ? '0' : 'auto',
            position: 'relative'
        };
        
        return (
            <div key={index} style={messageStyle}>
                {!isOwnMessage && senderName && (
                    <div style={{
                        fontWeight: 'bold',
                        marginBottom: '4px',
                        fontSize: '14px',
                        color: '#128C7E' // Color WhatsApp
                    }}>
                        {senderName}
                    </div>
                )}
                <div>{messageContent}</div>
                {messageTime && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        marginTop: '4px',
                        gap: '4px'
                    }}>
                        <div style={{
                            fontSize: '11px',
                            color: isOwnMessage ? 'rgba(0,0,0,0.5)' : '#6c757d'
                        }}>
                            {messageTime}
                        </div>
                        {isOwnMessage && (
                            <span style={{
                                color: '#4ade80', // Color verde para indicar éxito
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }} title="Mensaje enviado correctamente">
                                •
                            </span>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const getUserStatusColor = (status) => {
        switch (status) {
            case 'activo': return '#28a745';
            case 'inactivo': return '#ffc107';
            case 'desconectado': return '#dc3545';
            default: return '#6c757d';
        }
    };

    const getUserStatusText = (status) => {
        switch (status) {
            case 'activo': return 'Activo';
            case 'inactivo': return 'Inactivo';
            case 'desconectado': return 'Desconectado';
            default: return status;
        }
    };

    // Función para manejar el historial de mensajes recibido del servidor
    const handleMessageHistory = (data) => {
        if (!data.messages || !Array.isArray(data.messages) || data.roomCode !== roomCode) {
            console.log('Historial de mensajes inválido o para otra sala');
            return;
        }
        
        console.log(`Recibiendo historial de ${data.messages.length} mensajes para la sala ${roomCode}`);
        
        // Actualizamos la lista de mensajes
        const messagesArray = [];
        
        data.messages.forEach(msg => {
            if (msg.type === 'notification') {
                // Para mensajes de notificación (entradas, salidas)
                messagesArray.push(msg.content);
            } 
            else if (msg.type === 'chat') {
                try {
                    // Para mensajes de chat
                    let formattedMsg;
                    if (msg.formattedContent) {
                        formattedMsg = msg.formattedContent;
                    } else if (msg.content) {
                        // Si no hay formattedContent pero sí hay content, usar el content directamente
                        const timestamp = new Date(msg.timestamp).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        });
                        formattedMsg = `${msg.sender} [${timestamp}]: ${msg.content}`;
                    }
                    
                    if (formattedMsg) {
                        messagesArray.push(formattedMsg);
                    }
                } catch (error) {
                    console.error('Error procesando mensaje de historial:', error, msg);
                }
            }
        });
        
        console.log("Mensajes procesados del historial:", messagesArray);
        
        // Establecer los mensajes en el historial
        if (messagesArray.length > 0) {
            setMessages(messagesArray);
            
            // Scroll al fondo después de cargar el historial
            setTimeout(scrollToBottom, 100);
        }
    };

    return (
        <div className="bg-light" style={{
            minHeight: '100vh',     
            padding: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            overflowY: 'auto',
            gap: '20px'
        }}>
            <div style={{ 
                width: 'min(80vw, 600px)',
                padding: '30px',
                border: '1px solid #ccc',
                borderRadius: '12px',
                backgroundColor: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                margin: '20px auto'
            }}>
                <h1 className="text-center mb-4" style={{ 
                fontSize: '2rem',
                marginBottom: '1rem',
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
                
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <p className="mb-0 text-muted">
                            <span style={{fontWeight: 'bold'}}>Sala:</span> {roomCode}
                        </p>
                        <p className="mb-0 text-muted">
                            <span style={{fontWeight: 'bold'}}>Usuario:</span> {userName}
                        </p>
                    </div>
                    
                <button
                    onClick={handleSalirChat}
                        className="btn btn-danger"
                    style={{
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            padding: '8px 16px'
                        }}
                    >
                        SALIR
                </button>
                </div>
                
                {!isConnected && (
                    <div className="alert alert-warning text-center mb-3" style={{
                        borderRadius: '8px',
                        padding: '10px',
                        fontSize: '14px'
                    }}>
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        No hay conexión con el servidor. Por favor, intenta recargar la página.
                    </div>
                )}
                
                <div style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '16px',
                    height: '400px',
                    overflowY: 'auto',
                    marginBottom: '20px',
                    backgroundColor: '#f9f9f9',
                    backgroundImage: 'linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                }}>
                     {messages.length === 0 ? (
                        <div className="text-center my-auto" style={{ 
                            color: '#6c757d',
                            fontSize: '16px',
                            fontStyle: 'italic'
                        }}>
                            No hay mensajes aún. ¡Sé el primero en escribir!
                        </div>
                    ) : (
                        <div className="d-flex flex-column">
                            {messages.map((msg, index) => formatMessage(msg, index))}
                        </div>
                    )}
                    
                    {typingUsers.length > 0 && (
                        <div 
                            style={{
                                padding: '8px 16px',
                                fontSize: '14px',
                                color: '#007bff',
                                fontStyle: 'italic',
                                backgroundColor: 'rgba(0,123,255,0.05)',
                                borderRadius: '8px',
                                border: '1px solid rgba(0,123,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                position: 'sticky',
                                bottom: '0',
                                marginTop: '8px',
                                zIndex: '2'
                            }}
                        >
                            <div className="typing-indicator" style={{
                                display: 'flex',
                                gap: '3px',
                                alignItems: 'center'
                            }}>
                                <span className="dot" style={{
                                    width: '6px',
                                    height: '6px',
                                    backgroundColor: '#007bff',
                                    borderRadius: '50%',
                                    animation: 'typing 1s infinite ease-in-out',
                                    animationDelay: '0.1s'
                                }}></span>
                                <span className="dot" style={{
                                    width: '6px',
                                    height: '6px',
                                    backgroundColor: '#007bff',
                                    borderRadius: '50%',
                                    animation: 'typing 1s infinite ease-in-out',
                                    animationDelay: '0.2s'
                                }}></span>
                                <span className="dot" style={{
                                    width: '6px',
                                    height: '6px',
                                    backgroundColor: '#007bff',
                                    borderRadius: '50%',
                                    animation: 'typing 1s infinite ease-in-out',
                                    animationDelay: '0.3s'
                                }}></span>
                            </div>
                            {typingUsers.length === 1 
                                ? <span><strong>{typingUsers[0]}</strong> está escribiendo...</span> 
                                : <span><strong>{typingUsers.length}</strong> personas están escribiendo...</span>}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <div className="input-group">
                    <input
                        type="text"
                        value={message}
                        onChange={handleMessageChange}
                        ref={messageInputRef}
                        placeholder="Escribe un mensaje..."
                        className="form-control"
                        style={{
                            borderRadius: '8px 0 0 8px',
                            padding: '12px',
                            fontSize: '15px',
                            border: '1px solid #ced4da'
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
                        className={`btn ${isConnected ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                            borderRadius: '0 8px 8px 0',
                            padding: '12px 24px',
                            fontWeight: 'bold'
                        }}
                    >
                        Enviar
                    </button>
                </div>
            </div>

            <div style={{
                width: '280px',
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #ccc',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                margin: '20px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            }}>
                <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#333',
                    borderBottom: '1px solid #eee',
                    paddingBottom: '10px',
                    marginBottom: '5px',
                    textAlign: 'center'
                }}>
                    Otros Usuarios <span className="badge bg-primary">{userList.filter(user => user.name !== userName).length}</span>
                </h3>
                
                <div style={{
                    overflowY: 'auto',
                    maxHeight: '400px',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    padding: '10px',
                    backgroundColor: '#f9f9f9'
                }}>
                    <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0
                    }}>
                        {userList.length > 0 ? (
                            <>
                                {/* Mostrar usuarios activos primero */}
                                {userList.filter(user => user.name !== userName && user.connected && user.status === "activo").length > 0 && (
                                    <li key="activeHeader" style={{
                                        padding: '5px 10px',
                                        fontSize: '12px',
                                        color: '#28a745',
                                        background: '#f0f0f0',
                                        borderRadius: '4px',
                                        marginTop: '4px',
                                        marginBottom: '8px',
                                        fontWeight: 'bold'
                                    }}>
                                        Activos
                                    </li>
                                )}
                                
                                {userList.filter(user => user.name !== userName && user.connected && user.status === "activo").map((user, index) => (
                                    <li 
                                        key={`active-${index}`} 
                                        style={{
                                            padding: '10px',
                                            borderBottom: '1px solid #eee',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            backgroundColor: 'white',
                                            borderRadius: '6px',
                                            marginBottom: '4px'
                                        }}
                                    >
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: getUserStatusColor(user.status),
                                            flexShrink: 0
                                        }}></div>
                                        <div style={{
                                            flex: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            <div style={{
                                                fontWeight: 'normal',
                                                color: '#212529',
                                                fontSize: '15px'
                                            }}>
                                                {user.name}
                                                {user.typing && (
                                                    <span style={{
                                                        marginLeft: '6px',
                                                        fontSize: '11px',
                                                        color: '#6c757d',
                                                        fontStyle: 'italic'
                                                    }}>
                                                        escribiendo...
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#6c757d'
                                            }}>
                                                {getUserStatusText(user.status)}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                
                                {/* Mostrar usuarios inactivos */}
                                {userList.filter(user => user.name !== userName && user.connected && user.status === "inactivo").length > 0 && (
                                    <li key="inactiveHeader" style={{
                                        padding: '5px 10px',
                                        fontSize: '12px',
                                        color: '#ffc107',
                                        background: '#f0f0f0',
                                        borderRadius: '4px',
                                        marginTop: '8px',
                                        marginBottom: '8px',
                                        fontWeight: 'bold'
                                    }}>
                                        Inactivos
                                    </li>
                                )}
                                
                                {userList.filter(user => user.name !== userName && user.connected && user.status === "inactivo").map((user, index) => (
                                    <li 
                                        key={`inactive-${index}`} 
                                        style={{
                                            padding: '10px',
                                            borderBottom: '1px solid #eee',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            backgroundColor: 'white',
                                            borderRadius: '6px',
                                            marginBottom: '4px'
                                        }}
                                    >
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: getUserStatusColor(user.status),
                                            flexShrink: 0
                                        }}></div>
                                        <div style={{
                                            flex: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            <div style={{
                                                fontWeight: 'normal',
                                                color: '#212529',
                                                fontSize: '15px'
                                            }}>
                                                {user.name}
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#6c757d'
                                            }}>
                                                {getUserStatusText(user.status)}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                
                                {/* Mostrar usuarios desconectados */}
                                {userList.filter(user => user.name !== userName && (!user.connected || user.status === "desconectado")).length > 0 && (
                                    <li key="disconnectedHeader" style={{
                                        padding: '5px 10px',
                                        fontSize: '12px',
                                        color: '#dc3545',
                                        background: '#f0f0f0',
                                        borderRadius: '4px',
                                        marginTop: '8px',
                                        marginBottom: '8px',
                                        fontWeight: 'bold'
                                    }}>
                                        Desconectados
                                    </li>
                                )}
                                
                                {userList.filter(user => user.name !== userName && (!user.connected || user.status === "desconectado")).map((user, index) => (
                                    <li 
                                        key={`disconnected-${index}`} 
                                        style={{
                                            padding: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            opacity: 0.7,
                                            borderLeft: '2px solid #ddd',
                                            marginLeft: '3px'
                                        }}
                                    >
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: '#dc3545',
                                            flexShrink: 0
                                        }}></div>
                                        <div style={{
                                            flex: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            <div style={{
                                                color: '#666',
                                                fontSize: '14px'
                                            }}>
                                                {user.name}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </>
                        ) : (
                            <li style={{
                                textAlign: 'center',
                                color: '#6c757d',
                                fontSize: '14px',
                                padding: '20px 0'
                            }}>
                                Cargando usuarios...
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Chat;