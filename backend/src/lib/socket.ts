import { Server } from "socket.io"

declare global {
    var _io: Server | undefined
}

export function getIO(): Server {
    if (!global._io) {
        throw new Error("Socket.io não inicializado")
    }
    return global._io
}

export function setIO(server: Server) {
    global._io = server
}