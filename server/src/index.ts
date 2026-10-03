import app from './app';
import { config } from './config/index';

const port = process.env.PORT || config.port || 5001;

// If started as standalone server
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(port, () => {
    console.log(`🚀 ARCS Attendance Server running on port ${port}`);
    console.log(`📊 Mode: ${config.useMockData ? 'Mock Provider (Realistic 4-Branch Data)' : 'Live Google Sheets API'}`);
  });
}

// Ensure CommonJS module.exports is the express app function directly
module.exports = app;
module.exports.default = app;
module.exports.app = app;

export default app;
