import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001"

export async function POST(request: Request) {
    const body = await request.json()
    const userHeader = request.headers.get("x-user")
    const user = JSON.parse(userHeader!)

    const { orderId } = body

    if (!orderId) {
        return NextResponse.json({
            success: false,
            message: "orderId obrigatório"
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

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Pedido #${order.id}`
                    },
                    unit_amount: Math.round(order.total * 100)
                },
                quantity: 1
            }
        ],
        mode: "payment",
        success_url: `${FRONTEND_URL}/success`,
        cancel_url: `${FRONTEND_URL}/cancel`,
        metadata: {
            orderId: order.id.toString()
        }
    })

    return NextResponse.json({
        success: true,
        url: session.url
    }, { status: 200 })
}
