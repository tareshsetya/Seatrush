import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // Default hold duration: 10 minutes (600 seconds) as per SeatRush spec
  holdDurationSeconds: parseInt(process.env.HOLD_DURATION_SECONDS || '600', 10),
};
