import app from './app';
import { config } from './config/index';
import { syncService } from './services/sync/syncService';

const port = process.env.PORT || config.port || 5001;

if (require.main === module || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 ARCS Attendance Server running on port ${port}`);
    console.log(`📊 Live Google Sheets Mode Active`);

    setImmediate(async () => {
      try {
        console.log('📡 Starting background live sync with Google Sheets for all 4 branches...');
        await syncService.syncAll();
        console.log('✅ Live sync with Google Sheets completed successfully.');
      } catch (err: any) {
        console.error('Live sync error:', err.message);
      }
    });
  });
}

export default app;
export { app };
