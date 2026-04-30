"use server";

import { withAuth } from "@/lib/middleware/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getNotes() {
  return withAuth((user) =>
    db.note.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })
  );
}

export async function createNote(data) {
  return withAuth(async (user) => {
    const note = await db.note.create({
      data: {
        userId: user.id,
        title: data.title,
        content: data.content,
      },
    });
    revalidatePath("/dashboard/notes");
    return note;
  });
}

export async function updateNote(id, data) {
  return withAuth(async (user) => {
    const note = await db.note.update({
      where: { id, userId: user.id },
      data: { title: data.title, content: data.content },
    });
    revalidatePath("/dashboard/notes");
    return note;
  });
}

export async function deleteNote(id) {
  return withAuth(async (user) => {
    await db.note.delete({ where: { id, userId: user.id } });
    revalidatePath("/dashboard/notes");
  });
}
