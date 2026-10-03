const app = require('./dist/app.js').default || require('./dist/app.js');
const port = process.env.PORT || 5001;

if (require.main === module || process.env.PORT) {
  app.listen(port, () => {
    console.log(`🚀 ARCS Attendance Server listening on port ${port}`);
  });
}

module.exports = app;
