import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getIO } from "@/lib/socket"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const userHeader = request.headers.get("x-user")
    const user = JSON.parse(userHeader!)

    const orderId = parseInt(id)

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    })

    if (!order) {
        return NextResponse.json({
            success: false,
            message: "Pedido não encontrado"
        }, { status: 404 })
    }

    if (user.role !== "ADMIN" && order.userId !== user.id) {
        return NextResponse.json({
            success: false,
            message: "Sem permissão para cancelar este pedido"
        }, { status: 403 })
    }

    const cancelable = ["PENDING", "ACCEPTED"]
    if (!cancelable.includes(order.status)) {
        return NextResponse.json({
            success: false,
            message: "Este pedido já não pode ser cancelado"
        }, { status: 400 })
    }

    const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" }
    })

    const io = getIO()
    io.to(`order_${orderId}`).emit("order_status", { orderId, status: "CANCELLED" })

    return NextResponse.json({
        success: true,
        message: "Pedido cancelado com sucesso",
        data: updated
    }, { status: 200 })
}
