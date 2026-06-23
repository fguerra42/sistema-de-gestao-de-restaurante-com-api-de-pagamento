import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users — listar todos os utilizadores (apenas ADMIN)
export async function GET(request: Request) {
  const userHeader = request.headers.get("x-user");

  // Header ausente ou inválido
  if (!userHeader) {
    return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  }

  let user: any;
  try {
    user = JSON.parse(userHeader);
  } catch {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Sem permissão" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      photo: true,
      createdAt: true,
      _count: {
        select: { orders: true, reviews: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, users }, { status: 200 });
}