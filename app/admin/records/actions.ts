"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { deleteRecordById } from "@/lib/db/queries";

export async function deleteRecordAsAdminAction(
  formData: FormData
): Promise<void> {
  await requireAdmin("/admin/records");
  const recordId = String(formData.get("recordId") ?? "").trim();
  if (!recordId) {
    return;
  }
  await deleteRecordById(recordId);
  revalidatePath("/admin/records");
  revalidatePath("/records");
  revalidatePath("/me");
  updateTag("records");
}
