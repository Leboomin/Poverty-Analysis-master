import { Router } from 'express';
import { env } from '../config/env.ts';
import { postChatHandler } from '../handlers/chat.handler.ts';
import { createRateLimitMiddleware } from '../middleware/rate-limit.middleware.ts';

const router = Router();

router.use(
  createRateLimitMiddleware({
    windowMs: env.chatRateLimitWindowMs,
    maxRequests: env.chatRateLimitMaxRequests,
    code: 'CHAT_RATE_LIMITED',
    message: 'Too many chat requests. Please wait a moment and try again.',
  }),
);
router.post('/', postChatHandler);

export default router;
