import type { HandleServerError } from '@sveltejs/kit';

export { handle } from "./auth"

export const handleError: HandleServerError = ({ error, event }) => {
  // Log the error for server-side tracking
  console.error('Error during request', event, error);

  // Ensure the error has a message and stack trace
  const errorMessage = error instanceof Error ? error.message : 'Internal server error';
  const errorDetails = error instanceof Error ? error.stack : 'No additional details provided';

  return {
    message: errorMessage,
    status: (error as { status?: number }).status || 500,
    details: errorDetails
  };
};
