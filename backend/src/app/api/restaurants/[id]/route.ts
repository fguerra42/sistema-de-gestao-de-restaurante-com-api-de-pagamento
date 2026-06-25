import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const body = await request.json()
    const userHeader = request.headers.get("x-user")
    const user = JSON.parse(userHeader!)

    if (user.role !== "ADMIN") {
        return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }

    const restaurantId = parseInt(id)

    const existing = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
    })

    if (!existing) {
        return NextResponse.json({
            success: false,
            message: "Restaurante não encontrado"
        }, { status: 404 })
    }

    const updated = await prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
            name: body.name !== undefined ? body.name : undefined,
            address: body.address !== undefined ? body.address : undefined,
            image: body.image !== undefined ? body.image : undefined
        }
    })

    return NextResponse.json({
        success: true,
        message: "Restaurante atualizado com sucesso",
        data: updated
    }, { status: 200 })
}
