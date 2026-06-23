import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs"

export async function POST(request: Request) {

    const body = await request.json();

    if (!body.name || !body.email || !body.password || !body.role) {
        return NextResponse.json({
            success: false,
            message: "Campos obrigatorios"
        }, { status: 400 })
    }

    const EmailExists = await prisma.user.findUnique({
        where: { email: body.email }
    })
    if (EmailExists) {
        return NextResponse.json({
            success: false,
            message: "Email já está em uso"
        }, { status: 409 })
    }
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const newUser = await prisma.user.create({
        data: {
            name: body.name,
            email: body.email,
            password: hashedPassword,
            role: body.role
        }
    })
    const { password, ...userWithoutPassword } = newUser;
    return NextResponse.json({
        success: true,
        message: "Usuário criado com sucesso",
        data: userWithoutPassword
    }, { status: 201 })
}