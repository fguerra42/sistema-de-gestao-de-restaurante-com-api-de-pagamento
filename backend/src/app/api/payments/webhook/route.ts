import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
    const body = await request.text() // body raw para verificar assinatura
    const signature = request.headers.get("stripe-signature")!

    let event

    try {
        // Verifica se o webhook veio realmente do Stripe
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: "Webhook inválido"
        }, { status: 400 })
    }

    // Quando o pagamento for concluído
    if (event.type === "checkout.session.completed") {
        const session = event.data.object

        const orderId = parseInt(session.metadata?.orderId as string)

        // Atualiza o pedido para ACCEPTED
        await prisma.order.update({
            where: { id: orderId },
            data: { status: "ACCEPTED" }
        })

        // Cria o registo de pagamento
        await prisma.payment.create({
            data: {
                orderId,
                amount: (session.amount_total ?? 0) / 100,
                status: "PAID",
                method: "stripe",
                externalId: session.id
            }
        })
    }

    return NextResponse.json({ received: true }, { status: 200 })
}