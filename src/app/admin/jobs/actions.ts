"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentUser } from "@/db/auth";
import { cancelJob, enqueueImports, QueueName, retryFailedInBatch, retryJobs } from "@/jobs/boss";
import { MAX_BATCH, parseUrlList } from "@/lib/jobs";

const JobRef = z.object({ queue: QueueName, id: z.uuid() });

async function adminJob(form: FormData) {
  const user = await currentUser();
  const ref = JobRef.safeParse({ queue: form.get("queue"), id: form.get("id") });
  return user?.isAdmin && ref.success ? ref.data : null;
}

export async function retryJobAction(form: FormData) {
  const ref = await adminJob(form);
  if (!ref) return;
  await retryJobs({ queue: ref.queue, ids: [ref.id] });
  revalidatePath("/admin/jobs");
}

export async function cancelJobAction(form: FormData) {
  const ref = await adminJob(form);
  if (!ref) return;
  await cancelJob(ref);
  revalidatePath("/admin/jobs");
}

export async function retryBatchAction(form: FormData) {
  const user = await currentUser();
  const batchId = z.uuid().safeParse(form.get("batchId"));
  if (!user?.isAdmin || !batchId.success) return;
  await retryFailedInBatch(batchId.data);
  revalidatePath("/admin/jobs");
}

export async function importBatchAction(form: FormData) {
  const user = await currentUser();
  if (!user?.isAdmin) return;
  const { urls, invalid } = parseUrlList(String(form.get("urls") ?? ""));
  if (!urls.length || urls.length > MAX_BATCH) redirect(`/admin/jobs?note=${urls.length ? "too-many" : "empty"}`);
  const { jobs } = await enqueueImports({ urls, user: { ...user, isAdmin: true } });
  const skipped = jobs.filter((j) => j.id === null).length;
  redirect(`/admin/jobs?queued=${jobs.length - skipped}&skipped=${skipped}&invalid=${invalid.length}`);
}
