import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; productId: string }> }) {
    const { id, productId } = await params
    const body = await request.json()
    const userHeader = request.headers.get("x-user")
    const user = JSON.parse(userHeader!)

    if (user.role !== "ADMIN") {
        return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }

    const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) }
    })

    if (!product || product.restaurantId !== parseInt(id)) {
        return NextResponse.json({
            success: false,
            message: "Produto não encontrado"
        }, { status: 404 })
    }

    const updated = await prisma.product.update({
        where: { id: parseInt(productId) },
        data: {
            name: body.name !== undefined ? body.name : undefined,
            description: body.description !== undefined ? body.description : undefined,
            price: body.price !== undefined ? body.price : undefined,
            image: body.image !== undefined ? body.image : undefined,
            available: body.available !== undefined ? body.available : undefined
        }
    })

    return NextResponse.json({
        success: true,
        message: "Produto atualizado com sucesso",
        data: updated
    }, { status: 200 })
}
