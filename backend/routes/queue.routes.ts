
import { Router } from 'express';
import { QueueController } from '../controllers/queue.controller';
import { authenticate, asyncHandler, validate } from '../middleware';
import { z } from 'zod';

export const queueRouter = Router();

// Schemas
const CreateQueueSchema = z.object({
    name: z.string().min(2),
    estimatedWaitTime: z.number().min(1).optional()
});

const JoinQueueSchema = z.object({
    queueId: z.string().uuid(),
    name: z.string().min(1)
});

// Routes
queueRouter.get('/', authenticate, asyncHandler(QueueController.getUserQueues));

queueRouter.post('/', 
    authenticate, 
    validate(CreateQueueSchema), 
    asyncHandler(QueueController.createQueue)
);

// Public route (no auth required for customer)
queueRouter.post('/join', 
    validate(JoinQueueSchema), 
    asyncHandler(QueueController.joinQueue)
);

queueRouter.post('/:id/call', authenticate, asyncHandler(QueueController.callNext));
queueRouter.post('/:id/recall', authenticate, asyncHandler(QueueController.recall));
queueRouter.get('/:id/metrics', authenticate, asyncHandler(QueueController.getMetrics));
