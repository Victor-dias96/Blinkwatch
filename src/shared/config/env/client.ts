import { z } from 'zod';

/**
 * Browser-safe environment configuration.
 *
 * Only variables prefixed with NEXT_PUBLIC_ may appear here. Reference each
 * variable explicitly via `process.env.NEXT_PUBLIC_*` — never parse the full
 * `process.env` object on the client.
 *
 * Public values are embedded at build time and are not secret.
 */
const clientEnvSchema = z.object({
  // Add NEXT_PUBLIC_* keys here when a real public variable is required.
  // Example:
  // NEXT_PUBLIC_EXAMPLE: z.string().min(1),
});

type ClientEnv = z.infer<typeof clientEnvSchema>;

function formatInvalidVariableNames(error: z.ZodError): string {
  const names = new Set<string>();

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string') {
      names.add(key);
    }
  }

  return [...names].join(', ');
}

function parseClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    // Map each public variable explicitly, for example:
    // NEXT_PUBLIC_EXAMPLE: process.env.NEXT_PUBLIC_EXAMPLE,
  });

  if (!result.success) {
    const invalidVariables = formatInvalidVariableNames(result.error);
    throw new Error(
      `Invalid client environment configuration${invalidVariables ? `: ${invalidVariables}` : ''}`
    );
  }

  return result.data;
}

export const clientEnv: Readonly<ClientEnv> = Object.freeze(parseClientEnv());
