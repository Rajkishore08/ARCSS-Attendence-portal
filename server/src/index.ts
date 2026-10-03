import app from './app';
import { config } from './config/index';
import { syncService } from './services/sync/syncService';

const port = process.env.PORT || config.port || 5001;

const server = app.listen(port, () => {
  console.log(`🚀 ARCS Attendance Server running on port ${port}`);
  console.log(`📊 Mode: ${config.useMockData ? 'Mock Provider (Realistic 4-Branch Data)' : 'Live Google Sheets API'}`);
});

export default app;
export { app, server };
