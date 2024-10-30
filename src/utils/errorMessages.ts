export const ERROR_MESSAGES = {
    VALIDATION: {
      FAILED: 'Validation failed',
      INVALID_REQUEST: 'Invalid request data',
    },
    AUTH: {
      UNAUTHORIZED: 'Unauthorized access',
      INVALID_TOKEN: 'Invalid token',
      TOKEN_EXPIRED: 'Token expired',
    },
    VM: {
      NOT_FOUND: 'VM not found',
      CREATION_FAILED: 'Failed to create VM',
      UPDATE_FAILED: 'Failed to update VM',
      DELETE_FAILED: 'Failed to delete VM',
    },
  } as const;