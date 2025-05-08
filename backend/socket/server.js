const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 3000 });
const clients = new Map();
server.on("connection", (socket) => {
    console.log("Cliente conectado");
    socket.on("message", (message) => {
        const parsedMessage = JSON.parse(message);
        switch (parsedMessage.type) {
            case "joinRoom":
                clients.set(socket, parsedMessage.userName);
                broadcast(
                    `${parsedMessage.userName} ha ingresado a la sala.`,
                    socket
                );
                break;

            case "sendMessage":
                broadcast(
                    `${parsedMessage.userName}: ${parsedMessage.message}`,
                    socket
                );
                break;

            case "leaveRoom":
                const userName = clients.get(socket);
                broadcast(`${userName} ha abandonado la sala.`, socket);
                clients.delete(socket);
                break;

            default:
                console.log("Tipo de mensaje desconocido:", parsedMessage);
        }
    });
    socket.on("close", () => {
        const userName = clients.get(socket);
        if (userName) {
            broadcast(`${userName} ha abandonado la sala.`, socket);
            clients.delete(socket);
        }
        console.log("Cliente desconectado");
    });
});
const broadcast = (message, sender) => {
    server.clients.forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "notification", message }));
        }
    });
};

console.log("Servidor WebSocket corriendo en ws://localhost:3000");