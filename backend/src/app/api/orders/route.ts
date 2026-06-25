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

    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
    })

    if (!restaurant) {
        return NextResponse.json({
            success: false,
            message: "Restaurante não encontrado"
        }, { status: 404 })
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

        if (product.restaurantId !== restaurantId) {
            return NextResponse.json({
                success: false,
                message: `Produto "${product.name}" não pertence a este restaurante`
            }, { status: 400 })
        }

        if (!product.available) {
            return NextResponse.json({
                success: false,
                message: `Produto "${product.name}" não está disponível`
            }, { status: 400 })
        }

        if (item.quantity < 1) {
            return NextResponse.json({
                success: false,
                message: "Quantidade inválida para o produto " + product.name
            }, { status: 400 })
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
        include: {
            items: {
                include: {
                    product: {
                        select: { id: true, name: true, image: true }
                    }
                }
            }
        }
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
        include: {
            items: {
                include: {
                    product: {
                        select: { id: true, name: true, image: true }
                    }
                }
            },
            restaurant: true,
            review: {
                select: { id: true, rating: true, comment: true }
            }
        },
        orderBy: { createdAt: "desc" }
    })
    return NextResponse.json({ success: true, data: orders }, { status: 200 })
}
