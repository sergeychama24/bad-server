import { rateLimit } from 'express-rate-limit'

export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Слишком много запросов',
})
