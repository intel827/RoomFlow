import express from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import reservationRoutes from './routes/reservations';
import { errorHandler, AppError } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/reservations', reservationRoutes);

// Zod validation error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof ZodError) {
    const message = err.errors.map(e => e.message).join(', ');
    next(new AppError(400, 'VALIDATION_ERROR', message));
    return;
  }
  next(err);
});

// Global error handler
app.use(errorHandler);

export default app;
