"use server";

import { withAuth } from "@/lib/middleware/auth";
import { CoverLetterService } from "@/lib/services/cover-letter-service";

export async function generateCoverLetter(data) {
  return withAuth((user) => CoverLetterService.generate(user, data));
}

export async function getCoverLetters() {
  return withAuth((user) => CoverLetterService.getAll(user.id));
}

export async function getCoverLetterById(id) {
  return withAuth((user) => CoverLetterService.getById(id, user.id));
}

export async function deleteCoverLetter(id) {
  return withAuth((user) => CoverLetterService.delete(id, user.id));
}
