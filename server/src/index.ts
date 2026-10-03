import app from './app';
import { config } from './config/index';
import { syncService } from './services/sync/syncService';

// Start auto sync background job if not on serverless
if (!config.isVercel && !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.VERCEL) {
  syncService.initAutoSync();
}

if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(config.port, () => {
    console.log(`🚀 ARCS Attendance Server running on http://localhost:${config.port}`);
    console.log(`📊 Mode: ${config.useMockData ? 'Mock Provider (Realistic 4-Branch Data)' : 'Live Google Sheets API'}`);
  });
}

export default app;
export { app };
