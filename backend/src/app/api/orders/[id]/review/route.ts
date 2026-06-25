import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/generated/prisma";


export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const orderId = parseInt(id)
    const body = await request.json()
    const { rating, comment } = body
     const userHeader = request.headers.get("x-user")
    const user = JSON.parse(userHeader!)

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    })

    if (!order) {
        return NextResponse.json({
            success: false,
            message: "Ordem nao encontrada"
        }, { status: 404 })
    }

    if (rating < 1 || rating > 5) {
        return NextResponse.json({
            success: false,
            message: "Rating invalido"
        }, { status: 400 })
    }
    if (order.status !== "COMPLETED") {
        return NextResponse.json({
            success: false,
            message: "So pedidos completados"
        }, {status: 400})
    }
    const review = await prisma.review.create({
        data: {
            rating,
            comment,
            orderId,
            userId: user.id
        }
    })
    return NextResponse.json({
        success: true,
        message: "Avaliacao feita com sucesso",
        data: review
    }, { status: 201 })
}