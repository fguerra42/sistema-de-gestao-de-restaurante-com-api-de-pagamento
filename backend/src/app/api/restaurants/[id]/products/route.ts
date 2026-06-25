import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await request.json();
    const userHeader = request.headers.get("x-user")
    const user = JSON.parse(userHeader!)

    const RestaurantId = parseInt(id);

    if (!body.name || !body.price) {
        return NextResponse.json({
            success: false,
            message: "Campos obrigatorio"
        }, { status: 400 })
    }

    const products = await prisma.product.create({
        data: {
            name: body.name,
            description: body.description,
            price: body.price,
            image: body.image,
            restaurantId: RestaurantId
        }
    })
    return NextResponse.json({
        success: true,
        message: "Produto registrado",
        products
    }, { status: 201 })
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const restaurantId = parseInt(id);
    const products = await prisma.product.findMany({
        where: { restaurantId: restaurantId }
    })
    return NextResponse.json({
        success: true,
        products
    }, { status: 200 })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const userHeader = request.headers.get("x-user")
    const user = JSON.parse(userHeader!)

    if (user.role !== "ADMIN") {
        return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }

    const { productId } = await request.json()

    // Apaga os OrderItems que referenciam este produto
    await prisma.orderItem.deleteMany({
        where: { productId: Number(productId) }
    })

    // Apaga o produto
    await prisma.product.delete({
        where: { id: Number(productId) }
    })

    return NextResponse.json({ success: true, message: "Produto removido" })
}