import { z } from 'zod';

/**
 * Server-only environment configuration.
 *
 * Do not import this module from Client Components. The `server-only` package
 * is not installed in this project; enforcement relies on architecture rules
 * and code review (see docs/development/environment-variables.md).
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

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

function parseServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!result.success) {
    const invalidVariables = formatInvalidVariableNames(result.error);
    throw new Error(
      `Invalid server environment configuration${invalidVariables ? `: ${invalidVariables}` : ''}`
    );
  }

  return result.data;
}

export const serverEnv: Readonly<ServerEnv> = Object.freeze(parseServerEnv());
