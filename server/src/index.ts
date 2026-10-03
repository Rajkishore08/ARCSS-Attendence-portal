import app from './app';
import { config } from './config/index';
import { syncService } from './services/sync/syncService';

const port = process.env.PORT || config.port || 5001;

// Start Express server listening immediately to satisfy Vercel health check
app.listen(port, () => {
  console.log(`🚀 ARCS Attendance Server running on port ${port}`);
  console.log(`📊 Live Google Sheets Mode Active`);

  // Run live sync asynchronously in the background so cold start is instantaneous
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

export default app;
export { app };
