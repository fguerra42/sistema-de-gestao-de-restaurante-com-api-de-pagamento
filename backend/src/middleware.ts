import { NextResponse, NextRequest } from "next/server"
import jwt from "jsonwebtoken"

export const runtime = "nodejs"

export async function middleware(request: NextRequest) {
    // Rotas públicas
    if (request.method === "GET" && request.nextUrl.pathname.startsWith("/api/restaurants")) {
        return NextResponse.next()
    }

    if (request.nextUrl.pathname.startsWith("/api/payments/webhook")) {
        return NextResponse.next()
    }

    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
            { success: false, message: "Token não fornecido" },
            { status: 401 }
        )
    }

    const token = authHeader.replace("Bearer ", "")

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; role: string }

        const requestHeaders = new Headers(request.headers)
        requestHeaders.set("x-user", JSON.stringify(decoded))

        return NextResponse.next({
            request: { headers: requestHeaders }
        })
    } catch (error) {
        console.log("Erro JWT:", error)
        return NextResponse.json(
            { success: false, message: "Token inválido" },
            { status: 401 }
        )
    }
}

export const config = {
    matcher: [
        "/api/orders/:path*",
        "/api/restaurants/:path*",
        "/api/payments/:path*",
        "/api/users/:path*",
        "/api/upload",
    ]
}