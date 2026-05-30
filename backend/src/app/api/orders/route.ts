import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
    const body = await request.json()
    const userHeader = request.headers.get("x-user")
    const user = JSON.parse(userHeader!)

    if (user.role !== "CLIENT") {
        return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }
    const { restaurantId, deliveryAddress, items } = body

    if (!restaurantId || !deliveryAddress || !items || items.length === 0) {
        return NextResponse.json({
            success: false,
            message: "Campos obrigatorios"
        }, { status: 400 })
    }

    const productsFound: any[] = []
    let total = 0

    for (const item of items) {
        const product = await prisma.product.findUnique({
            where: { id: item.productId }
        })

        if (!product) {
            return NextResponse.json({
                success: false,
                message: `Produto ${item.productId} não encontrado`
            }, { status: 404 })
        }

        productsFound.push(product)
        total += product.price * item.quantity
    }

    const order = await prisma.order.create({
        data: {
            restaurantId,
            deliveryAddress,
            userId: user.id,
            total,
            items: {
                create: items.map((item: any) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: productsFound.find(p => p.id === item.productId).price
                }))
            }
        },
        include: { items: true }
    })

    return NextResponse.json({
        success: true,
        message: "Pedido criado com sucesso",
        data: order
    }, { status: 201 })
}

export async function GET(request: Request) {
    const userHeader = request.headers.get("x-user")
    const user = JSON.parse(userHeader!)

     const where = user.role === "ADMIN" ? {} : { userId: user.id }
    const orders = await prisma.order.findMany({
        where,
        include: { items: true, restaurant: true }
    })
    return NextResponse.json({ success: true, data: orders }, { status: 200 })

}