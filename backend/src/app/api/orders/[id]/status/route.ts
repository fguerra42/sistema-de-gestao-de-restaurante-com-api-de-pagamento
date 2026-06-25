import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const body = await request.json()
    const orderId = parseInt(id)
    const { status } = body
    const userHeader = request.headers.get("x-user")
    const user = JSON.parse(userHeader!)

    if (user.role !== "ADMIN") {
        return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }

    const validStatus = ["PENDING", "ACCEPTED", "PREPARING", "DELIVERING", "COMPLETED", "CANCELLED"]

    if (!validStatus.includes(status)) {
        return NextResponse.json({
            success: false,
            message: "Status inválido"
        }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    })

    if (!order) {
        return NextResponse.json({
            success: false,
            message: "Pedido não encontrado"
        }, { status: 404 })
    }

    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: status }
    })
    const io = getIO()
    io.to(`order_${orderId}`).emit("order_status", { orderId, status })

    return NextResponse.json({
        success: true,
        message: "Status atualizado com sucesso",
        data: updatedOrder
    }, { status: 200 })
}