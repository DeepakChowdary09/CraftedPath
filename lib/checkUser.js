import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    const email = user.emailAddresses?.[0]?.emailAddress;
    if (!email) throw new Error("No email address found for user");

    const dbUser = await db.user.upsert({
      where: { clerkUserId: user.id },
      update: { name, imageUrl: user.imageUrl },
      create: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email,
      },
    });

    return dbUser;
  } catch (error) {
    console.error("checkUser error:", error.message);
    throw error;
  }
};
