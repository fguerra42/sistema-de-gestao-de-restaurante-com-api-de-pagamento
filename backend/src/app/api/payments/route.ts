import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

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

    // Busca o pedido no banco
    const order = await prisma.order.findUnique({
        where: { id: orderId }
    })

    if (!order) {
        return NextResponse.json({
            success: false,
            message: "Pedido não encontrado"
        }, { status: 404 })
    }

    // Cria a sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Pedido #${order.id}`
                    },
                    unit_amount: Math.round(order.total * 100) // Stripe usa centavos
                },
                quantity: 1
            }
        ],
        mode: "payment",
        success_url: "http://localhost:3000/success",
        cancel_url: "http://localhost:3000/cancel",
        metadata: {
            orderId: order.id // Guarda o orderId para usar no webhook
        }
    })

    return NextResponse.json({
        success: true,
        url: session.url // URL para redirecionar o cliente para o Stripe
    }, { status: 200 })
}