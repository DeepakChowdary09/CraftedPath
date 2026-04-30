"use server";

import { withAuth } from "@/lib/middleware/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBookmarks() {
  return withAuth((user) =>
    db.bookmark.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })
  );
}

export async function addBookmark(data) {
  return withAuth(async (user) => {
    const bookmark = await db.bookmark.create({
      data: {
        userId: user.id,
        jobTitle: data.jobTitle,
        company: data.company,
        jobUrl: data.jobUrl ?? null,
      },
    });
    revalidatePath("/dashboard/bookmarks");
    return bookmark;
  });
}

export async function removeBookmark(id) {
  return withAuth(async (user) => {
    await db.bookmark.delete({ where: { id, userId: user.id } });
    revalidatePath("/dashboard/bookmarks");
  });
}
