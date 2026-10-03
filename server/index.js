const app = require('./dist/app.js').default || require('./dist/app.js');

if (!process.env.VERCEL && require.main === module) {
  const port = process.env.PORT || 5001;
  app.listen(port, () => {
    console.log(`🚀 ARCS Attendance Server listening on port ${port}`);
  });
}

module.exports = app;
