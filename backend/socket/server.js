const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 3000 });

// Estructura para almacenar las salas y sus usuarios
const rooms = new Map();

server.on("connection", (socket) => {
    console.log("Cliente conectado");
    let currentRoom = null;
    let currentUser = null;
    let displayName = null;

    socket.on("message", (message) => {
        const parsedMessage = JSON.parse(message);
        console.log("Mensaje recibido del cliente:", parsedMessage);
        
        switch (parsedMessage.type) {
            case "joinRoom":
                // Si el usuario ya estaba en una sala, removerlo primero
                if (currentRoom && rooms.has(currentRoom)) {
                    rooms.get(currentRoom).delete(socket);
                    if (rooms.get(currentRoom).size === 0) {
                        rooms.delete(currentRoom);
                    }
                }

                currentRoom = parsedMessage.roomCode;
                currentUser = parsedMessage.userName;
                displayName = parsedMessage.displayName || parsedMessage.userName.split('_')[0];
                
                // Crear la sala si no existe
                if (!rooms.has(currentRoom)) {
                    rooms.set(currentRoom, new Map());
                }
                
                // Agregar usuario a la sala
                rooms.get(currentRoom).set(socket, { userName: currentUser, displayName });
                console.log(`Usuario ${displayName} agregado a la sala ${currentRoom}`);
                
                // Notificar a todos en la sala
                const joinMessage = {
                    type: 'message',
                    roomCode: currentRoom,
                    message: `${displayName} ha ingresado a la sala.`
                };

                // Enviar mensaje de ingreso y actualizar contador
                rooms.get(currentRoom).forEach((userData, client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        // Enviar mensaje de ingreso
                        client.send(JSON.stringify(joinMessage));
                        
                        // Enviar actualización de contador
                        const userCountMessage = {
                            type: 'userCount',
                            roomCode: currentRoom,
                            count: rooms.get(currentRoom).size
                        };
                        client.send(JSON.stringify(userCountMessage));
                    }
                });
                break;

            case "sendMessage":
                if (currentRoom && currentUser) {
                    // Verificar que el mensaje sea para la sala actual
                    if (parsedMessage.roomCode === currentRoom) {
                        const senderDisplayName = parsedMessage.displayName || parsedMessage.userName.split('_')[0];
                        const now = new Date();
                        const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                        
                        const messageToSend = {
                            type: 'message',
                            roomCode: currentRoom,
                            message: `${senderDisplayName} [${time}]: ${parsedMessage.message}`
                        };
                        
                        // Enviar mensaje y actualizar contador
                        rooms.get(currentRoom).forEach((userData, client) => {
                            if (client.readyState === WebSocket.OPEN) {
                                // Enviar mensaje
                                client.send(JSON.stringify(messageToSend));
                                
                                // Enviar actualización de contador
                                const userCountMessage = {
                                    type: 'userCount',
                                    roomCode: currentRoom,
                                    count: rooms.get(currentRoom).size
                                };
                                client.send(JSON.stringify(userCountMessage));
                            }
                        });
                    }
                }
                break;

            case "leaveRoom":
                if (currentRoom && currentUser) {
                    // Verificar que el usuario esté abandonando la sala correcta
                    if (parsedMessage.roomCode === currentRoom) {
                        const leaverDisplayName = parsedMessage.displayName || parsedMessage.userName.split('_')[0];
                        const leaveMessage = {
                            type: 'message',
                            roomCode: currentRoom,
                            message: `${leaverDisplayName} ha abandonado la sala.`
                        };
                        
                        // Remover usuario de la sala
                        rooms.get(currentRoom).delete(socket);
                        
                        // Enviar mensaje de salida y actualizar contador
                        rooms.get(currentRoom).forEach((userData, client) => {
                            if (client.readyState === WebSocket.OPEN) {
                                // Enviar mensaje de salida
                                client.send(JSON.stringify(leaveMessage));
                                
                                // Enviar actualización de contador
                                const userCountMessage = {
                                    type: 'userCount',
                                    roomCode: currentRoom,
                                    count: rooms.get(currentRoom).size
                                };
                                client.send(JSON.stringify(userCountMessage));
                            }
                        });
                        
                        // Si la sala está vacía, eliminarla
                        if (rooms.get(currentRoom).size === 0) {
                            rooms.delete(currentRoom);
                        }
                        currentRoom = null;
                        currentUser = null;
                        displayName = null;
                    }
                }
                break;

            default:
                console.log("Tipo de mensaje desconocido:", parsedMessage);
        }
    });

    socket.on("close", () => {
        if (currentRoom && currentUser) {
            const disconnectMessage = {
                type: 'message',
                roomCode: currentRoom,
                message: `${displayName} ha abandonado la sala.`
            };
            
            // Remover usuario de la sala
            rooms.get(currentRoom).delete(socket);
            
            // Enviar mensaje de desconexión y actualizar contador
            rooms.get(currentRoom).forEach((userData, client) => {
                if (client.readyState === WebSocket.OPEN) {
                    // Enviar mensaje de desconexión
                    client.send(JSON.stringify(disconnectMessage));
                    
                    // Enviar actualización de contador
                    const userCountMessage = {
                        type: 'userCount',
                        roomCode: currentRoom,
                        count: rooms.get(currentRoom).size
                    };
                    client.send(JSON.stringify(userCountMessage));
                }
            });
            
            // Si la sala está vacía, eliminarla
            if (rooms.get(currentRoom).size === 0) {
                rooms.delete(currentRoom);
            }
        }
        console.log("Cliente desconectado");
    });
});

// Función para enviar mensajes a todos los usuarios en una sala específica
const broadcastToRoom = (roomCode, message, excludeSocket = null) => {
    const room = rooms.get(roomCode);
    if (room) {
        room.forEach((socket) => {
            if (socket !== excludeSocket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'message',
                    roomCode,
                    message
                }));
            }
        });
        // Enviar actualización de cantidad de usuarios
        const userCount = room.size;
        room.forEach((socket) => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'userCount',
                    roomCode,
                    count: userCount
                }));
            }
        });
    }
};

console.log("Servidor WebSocket corriendo en ws://localhost:3000");