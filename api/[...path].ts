export default async function handler(req: any, res: any) {
  try {
    const { default: app } = await import('../server/src/app');
    return app(req, res);
  } catch (error: any) {
    console.error('Serverless Error during import:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Serverless Function Load Error',
        message: error?.message || String(error),
        stack: error?.stack,
        nodeVersion: process.version,
        env: {
          VERCEL: process.env.VERCEL,
          NODE_ENV: process.env.NODE_ENV,
        },
      });
    }
  }
}
