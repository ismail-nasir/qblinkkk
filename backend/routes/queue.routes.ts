
import { Router } from 'express';
import { QueueController } from '../controllers/queue.controller';
import { authenticate, asyncHandler } from '../middleware';

export const queueRouter = Router();

// Public
queueRouter.post('/join', asyncHandler(QueueController.joinQueue));
queueRouter.post('/:id/leave', asyncHandler(QueueController.leaveQueue));
queueRouter.post('/:id/alert', asyncHandler(QueueController.handleAlert)); // For customer "I'm Coming"

// Protected
queueRouter.get('/', authenticate, asyncHandler(QueueController.getUserQueues));
queueRouter.post('/', authenticate, asyncHandler(QueueController.createQueue));
queueRouter.delete('/:id', authenticate, asyncHandler(QueueController.deleteQueue));
queueRouter.put('/:id', authenticate, asyncHandler(QueueController.updateQueue));

queueRouter.get('/:id/data', asyncHandler(QueueController.getQueueData)); // Can be public for display
queueRouter.get('/:id/info', asyncHandler(QueueController.getQueueInfo));

queueRouter.post('/:id/call', authenticate, asyncHandler(QueueController.callNext));
queueRouter.post('/:id/call-number', authenticate, asyncHandler(QueueController.callByNumber));
queueRouter.post('/:id/recall', authenticate, asyncHandler(QueueController.recall));
queueRouter.post('/:id/take-back', authenticate, asyncHandler(QueueController.takeBack));
queueRouter.post('/:id/clear', authenticate, asyncHandler(QueueController.clearQueue));
queueRouter.post('/:id/reorder', authenticate, asyncHandler(QueueController.reorder));
