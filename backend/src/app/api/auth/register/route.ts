import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs"
import { success } from "zod";

export async function POST(request: Request) {

    const body = await request.json();
    const senhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;


    if (!body.name || !body.email || !body.password || !body.role) {
        return NextResponse.json({
            success: false,
            message: "Campos obrigatorios"
        }, { status: 400 })
    }
    if (!senhaForte.test(body.password)) {
        return NextResponse.json(
            {
                success: false,
                message:
                    "A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, minúscula, número e caractere especial.",
            },
            { status: 400 }
        );
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