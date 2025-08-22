import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { SiteAdapterName } from '@shopping-copilot/shared';

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1)
});

// Rami Levy credentials schema
const ramiLevyCredentialsSchema = z.object({
  authorization: z.string(),
  ecomtoken: z.string(),
  cookie: z.string(),
  userId: z.string()
});

// Shufersal credentials schema
const shufersalCredentialsSchema = z.object({
  csrftoken: z.string(),
  cookie: z.string()
});

const streamRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
  adapterName: z.enum([SiteAdapterName.ramiLevy, SiteAdapterName.shufersal]).optional(),
  credentials: z.union([ramiLevyCredentialsSchema, shufersalCredentialsSchema]).optional()
});

export const validateStreamRequest = (req: Request, res: Response, next: NextFunction): void => {
  try {
    streamRequestSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid request format',
        details: error.errors
      });
      return;
    }
    res.status(400).json({ error: 'Invalid request' });
  }
};