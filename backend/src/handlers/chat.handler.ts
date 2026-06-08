import type { NextFunction, Request, Response } from 'express';
import { chatRequestSchema, chatResponseSchema } from '../schemas/chat.schema.ts';
import { answerQuestion } from '../services/chat.service.ts';
import { validateRequest, validateResponse } from '../utils/validation.utils.ts';

export async function postChatHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const request = validateRequest(chatRequestSchema, req.body, 'INVALID_CHAT_REQUEST');
    const response = await answerQuestion(request);
    res.json(validateResponse(chatResponseSchema, response, 'INVALID_CHAT_RESPONSE'));
  } catch (err) {
    next(err);
  }
}
