import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const payments = await prisma.payment.findMany({
        include: {
            order: {
                include: {
                    user: true,
                    restaurant: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({
        success: true,
        data: payments
    }, { status: 200 })
}