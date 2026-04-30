"use server";

import { withAuth } from "@/lib/middleware/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getResumeVersions() {
  return withAuth((user) =>
    db.resumeVersion.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })
  );
}

export async function saveResumeVersion(data) {
  return withAuth(async (user) => {
    const version = await db.resumeVersion.create({
      data: {
        userId: user.id,
        title: data.title,
        content: data.content,
        tag: data.tag ?? null,
      },
    });
    revalidatePath("/resume/versions");
    return version;
  });
}

export async function setActiveResumeVersion(id) {
  return withAuth(async (user) => {
    const version = await db.$transaction(async (tx) => {
      await tx.resumeVersion.updateMany({
        where: { userId: user.id },
        data: { isActive: false },
      });
      return tx.resumeVersion.update({
        where: { id, userId: user.id },
        data: { isActive: true },
      });
    });
    revalidatePath("/resume/versions");
    return version;
  });
}

export async function deleteResumeVersion(id) {
  return withAuth(async (user) => {
    await db.resumeVersion.delete({ where: { id, userId: user.id } });
    revalidatePath("/resume/versions");
  });
}
