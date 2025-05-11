import React, { createContext, useContext, useState, useEffect } from 'react';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const [socket, setSocket] = useState(null);
    const [roomCode, setRoomCode] = useState(null);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3000');
        setSocket(ws);

        ws.onopen = () => {
            console.log('Conectado al servidor WebSocket');
            setIsConnected(true);
        };

        ws.onclose = () => {
            console.log('Desconectado del servidor WebSocket');
            setIsConnected(false);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Mensaje recibido:', data);

            if (data.type === 'message') {
                setMessages(prev => [...prev, {
                    content: data.message,
                    messageId: data.messageId
                }]);
            } else if (data.type === 'userCount') {
                setUserCount(data.count);
            }
        };

        return () => {
            ws.close();
        };
    }, []);

    const joinRoom = (code, userName, displayName) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            setRoomCode(code);
            socket.send(JSON.stringify({
                type: 'joinRoom',
                roomCode: code,
                userName: userName,
                displayName: displayName
            }));
        }
    };

    const sendMessage = (message, messageId) => {
        if (socket && socket.readyState === WebSocket.OPEN && roomCode) {
            socket.send(JSON.stringify({
                type: 'sendMessage',
                roomCode: roomCode,
                message: message,
                messageId: messageId
            }));
        }
    };

    const leaveRoom = () => {
        if (socket && socket.readyState === WebSocket.OPEN && roomCode) {
            socket.send(JSON.stringify({
                type: 'leaveRoom',
                roomCode: roomCode
            }));
            setRoomCode(null);
            setMessages([]);
        }
    };

    return (
        <ChatContext.Provider value={{
            messages,
            sendMessage,
            joinRoom,
            leaveRoom,
            isConnected,
            userCount
        }}>
            {children}
        </ChatContext.Provider>
    );
}; 