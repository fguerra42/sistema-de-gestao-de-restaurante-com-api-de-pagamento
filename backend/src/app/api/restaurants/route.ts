import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"

export async function POST(request: Request){
    const body = await request.json();
    const userHeader = request.headers.get("x-user")
    const user = JSON.parse(userHeader!)

    if (user.role !== "ADMIN") {
        return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }

    if (!body.name || !body.address){
        return NextResponse.json({
         success: false,
         message: "Campos obrigatorios"
        }, {status: 400})
    }

    const restaurants = await prisma.restaurant.create({
        data: {
            name: body.name,
            address: body.address,
            image: body.image,
            ownerId: user.id,
        }

    })
    return NextResponse.json({
        success: true,
        message: "Restaurante criado com sucesso",
        data: restaurants
    }, {status: 201})
}

export async function GET() {

    const restaurants = await prisma.restaurant.findMany(
        {include: {products: true}}
    )
    return NextResponse.json({
        success: true,
        restaurants,  
    }, {status: 200})
    
}