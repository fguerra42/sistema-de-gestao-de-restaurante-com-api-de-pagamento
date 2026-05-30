import { createServer, IncomingMessage, ServerResponse } from "http"
import { Server, Socket } from "socket.io"
import next from "next"
import { setIO } from "./src/lib/socket"

const dev: boolean = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handler = app.getRequestHandler()

interface ClientToServerEvents {
    join_order: (orderId: number | string) => void
}

interface ServerToClientEvents {
    order_status: (data: { orderId: number | string; status: string }) => void
}

interface InterServerEvents {}
interface SocketData {}

app.prepare().then(() => {
    const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
        handler(req, res)
    })

    const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

    io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
        console.log(`Cliente conectado: ${socket.id}`)

        socket.on("join_order", (orderId) => {
            const roomName = `order_${orderId}`
            socket.join(roomName)
            console.log(`Cliente ${socket.id} entrou na sala: ${roomName}`)
        })

        socket.on("disconnect", () => {
            console.log(`Cliente desconectado: ${socket.id}`)
        })
    })

    setIO(io)

    const PORT = 3000
    httpServer.listen(PORT, () => {
        console.log(`> Servidor Next.js + Socket.IO pronto em http://localhost:${PORT}`)
    })
})