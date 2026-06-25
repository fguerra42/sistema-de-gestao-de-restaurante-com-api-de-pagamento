import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(request: Request) {

    const body = await request.json();

    const { email, password } = body;

    if (!email || !password) {
        return NextResponse.json({
            success: false,
            message: "Email e Senha obrigatorios"
        }, { status: 400 })
    }
    const user = await prisma.user.findUnique({
        where: { email: email }
    })
    if (!user) {
        return NextResponse.json({
            success: false,
             message: "Utilizador não encontrado"
        }, { status: 404 })
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return NextResponse.json({
            success: false,
            message: "Senha errada"
        }, { status: 400 })
    }
    const { password: _, ...userWithoutPassword } = user
    const token = jwt.sign({
        id: user.id, email: user.email, role: user.role
    }, process.env.JWT_SECRET!,
        { expiresIn: "1d" })
    return NextResponse.json({
        success: true,
        message: "Login efetuado com sucesso",
        token,
        data: userWithoutPassword
    }, { status: 200 })

}