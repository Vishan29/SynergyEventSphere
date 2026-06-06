import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { parseApiError } from '@/api/client';

// Surfaces a backend error as a toast plus per-field RHF errors when the
// API returned a `violations[]` payload (Bean Validation failure).
export function handleApiError<TFieldValues extends FieldValues>(
  err: unknown,
  options?: {
    setError?: UseFormSetError<TFieldValues>;
    fallback?: string;
    silent?: boolean;
  },
) {
  const parsed = parseApiError(err);
  const message = parsed.message || options?.fallback || 'Something went wrong';

  if (options?.setError && parsed.violations.length > 0) {
    for (const v of parsed.violations) {
      options.setError(v.field as Path<TFieldValues>, {
        type: 'server',
        message: v.message,
      });
    }
  }

  if (!options?.silent) {
    toast.error(message);
  }

  return parsed;
}
