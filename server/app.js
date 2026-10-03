const app = require('./dist/app.js').default || require('./dist/app.js');
const port = process.env.PORT || 5001;

app.listen(port, () => {
  console.log(`🚀 ARCS Attendance Server running on port ${port}`);
});

module.exports = app;
