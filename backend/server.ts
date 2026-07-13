import { createServer, IncomingMessage, ServerResponse } from "http"
import { Server, Socket } from "socket.io"
import next from "next"
import { setIO } from "./src/lib/socket"

const dev: boolean = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handler = app.getRequestHandler()

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3007"
const ALLOWED_ORIGINS = [FRONTEND_URL, "http://localhost:3007", "http://10.0.0.10:3007"]

app.prepare().then(() => {
    const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
        const origin = req.headers.origin || ""
        if (ALLOWED_ORIGINS.includes(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin)
        }
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
        res.setHeader("Access-Control-Allow-Credentials", "true")

        if (req.method === "OPTIONS") {
            res.writeHead(200)
            res.end()
            return
        }

        handler(req, res)
    })

    const io = new Server(httpServer, {
        cors: {
            origin: ALLOWED_ORIGINS,
            methods: ["GET", "POST"],
            credentials: true
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

httpServer.listen(PORT, () => {
    console.log(`> Servidor Next.js + Socket.IO pronto em http://localhost:${PORT}`)
    console.log(`> Origens permitidas: ${ALLOWED_ORIGINS.join(", ")}`)
})
})
