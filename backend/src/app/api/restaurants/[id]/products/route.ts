import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, {params}: {params: {id: string}}) {
 
    const {id} = await params;
    const body = await request.json();
    const userHeader = request.headers.get("x-user")
    const user = JSON.parse(userHeader!)

    const RestaurantId = parseInt(id);

    if (!body.name || !body.price)
    {
        return NextResponse.json({
            success: false,
            message: "Campos obrigatorio"
        }, {status: 400})
    }

    const products = await prisma.product.create({
        data: {
            name: body.name,
            description: body.description,
            price: body.price,
            restaurantId: RestaurantId
        }
    })
    return NextResponse.json({
        success: true,
        message: "Produto registrado",
        products
    }, {status: 201})
}

export async function GET(request: Request, {params}: {params: {id: string}}){

    const {id} = await params;
    const restaurantId = parseInt(id);
 const products = await prisma.product.findMany({
    where: {restaurantId: restaurantId}
 })
 return NextResponse.json({
    success: true,
    products
 }, {status: 200})
}