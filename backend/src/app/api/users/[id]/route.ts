import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/users/:id — bloquear ou desbloquear usuário
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userHeader = request.headers.get("x-user");
  const user = JSON.parse(userHeader!);

  if (user.role !== "ADMIN") {
    return NextResponse.json({ message: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const targetId = parseInt(id);

  if (isNaN(targetId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const body = await request.json();

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { blocked: body.blocked },
    select: { id: true, name: true, email: true, blocked: true },
  });

  return NextResponse.json({
    success: true,
    message: updated.blocked ? "Usuário bloqueado" : "Usuário desbloqueado",
    data: updated,
  });
}

// DELETE /api/users/:id — remover usuário
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userHeader = request.headers.get("x-user");
  const user = JSON.parse(userHeader!);

  if (user.role !== "ADMIN") {
    return NextResponse.json({ message: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const targetId = parseInt(id);

  if (isNaN(targetId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  if (targetId === user.id) {
    return NextResponse.json(
      { message: "Não é possível remover a própria conta" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id: targetId } });

  return NextResponse.json({
    success: true,
    message: "Usuário removido com sucesso",
  });
}