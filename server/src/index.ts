import app from './app';
import { config } from './config/index';

const port = process.env.PORT || config.port || 5001;

// Start Express server listening on the port provided by Vercel / environment
app.listen(port, () => {
  console.log(`🚀 ARCS Attendance Server running on port ${port}`);
  console.log(`📊 Mode: ${config.useMockData ? 'Mock Provider (Realistic 4-Branch Data)' : 'Live Google Sheets API'}`);
});

export default app;
export { app };
