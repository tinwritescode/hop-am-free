import type { z } from "zod";

/** "field: message; field: message", short enough for an error line an admin reads. */
export function describeIssues(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
}
