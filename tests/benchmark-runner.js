const Benchmark = require('benchmark');
const express = require('../src/index.js');
const fetch = require('node:fetch');

const suite = new Benchmark.Suite;
let server;

// Setup express app with test routes
const app = express();
app.set("etag", false);
app.set("declarative responses", false);

// Simple route (from benchmark/ultimate-express.js)
app.get('/', (req, res) => res.send('Hello world'));

// Route with params (from tests/tests/req/req-fresh.js)
app.get('/test/:id', (req, res) => {
  res.set('ETag', '"123"');
  res.send('test');
});

// Route with middleware (from tests/tests/middlewares/compression.js)
const compression = require('compression');
app.use(compression({ threshold: 1 }));
app.get('/compressed', (req, res) => {
  res.send('Hello World'.repeat(100));
});

// JSON response (from tests/tests/settings/json-replacer.js)
app.get('/json', (req, res) => {
  res.json({ test: { test: 1 } });
});

// Start server before benchmarks
server = app.listen(3000);

// Add real system benchmarks
suite
.add('Route handling - simple GET', {
  defer: true,
  fn: function(deferred) {
    fetch('http://localhost:3000/')
      .then(() => deferred.resolve())
      .catch(() => deferred.reject());
  }
})
.add('Route handling - with params', {
  defer: true,
  fn: function(deferred) {
    fetch('http://localhost:3000/test/123')
      .then(() => deferred.resolve())
      .catch(() => deferred.reject());
  }
})
.add('Route handling - with compression', {
  defer: true,
  fn: function(deferred) {
    fetch('http://localhost:3000/compressed', {
      headers: {
        'Accept-Encoding': 'gzip'
      }
    })
      .then(() => deferred.resolve())
      .catch(() => deferred.reject());
  }
})
.add('Route handling - JSON response', {
  defer: true,
  fn: function(deferred) {
    fetch('http://localhost:3000/json')
      .then(() => deferred.resolve())
      .catch(() => deferred.reject());
  }
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  const results = {
    timestamp: new Date().toISOString(),
    results: this.map(benchmark => ({
      name: benchmark.name,
      hz: benchmark.hz,
      stats: benchmark.stats
    }))
  };
  
  require('fs').writeFileSync(
    'benchmark-results.json',
    JSON.stringify(results, null, 2)
  );
  
  // Cleanup: close server after benchmarks
  server.close();
})
.run({ 'async': true }); 