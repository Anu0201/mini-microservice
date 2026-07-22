export const createIdempotencyKey = (prefix = 'request') =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
