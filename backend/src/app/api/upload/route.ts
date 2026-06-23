import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/upload — faz upload de imagem e retorna a URL pública
export async function POST(request: Request) {
  const userHeader = request.headers.get("x-user");

  if (!userHeader) {
    return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { success: false, message: "Nenhum arquivo enviado" },
      { status: 400 }
    );
  }

  // Validar tipo de arquivo
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { success: false, message: "Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou GIF." },
      { status: 400 }
    );
  }

  // Validar tamanho (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { success: false, message: "Arquivo muito grande. Máximo: 5MB." },
      { status: 400 }
    );
  }

  // Gerar nome único para evitar colisões
  const ext = file.name.split(".").pop();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  // Criar pasta se não existir
  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, uniqueName);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const publicUrl = `/uploads/${uniqueName}`;

  return NextResponse.json(
    { success: true, url: publicUrl },
    { status: 201 }
  );
}