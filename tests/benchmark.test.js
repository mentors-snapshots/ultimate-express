const { describe, it } = require('node:test');
const assert = require('node:assert');
const { calculatePerformanceChange, generateReport } = require('../scripts/compare-benchmark');

describe('Benchmark System Tests', () => {
  it('should correctly calculate performance changes', () => {
    const baseline = {
      results: [{
        name: 'test1',
        hz: 100
      }]
    };
    
    const current = {
      results: [{
        name: 'test1',
        hz: 90
      }]
    };

    const changes = calculatePerformanceChange(baseline, current);
    assert.equal(changes['test1'].percentChange, -10);
    assert.equal(changes['test1'].baseline, 100);
    assert.equal(changes['test1'].current, 90);
  });

  it('should detect performance regressions correctly', () => {
    const changes = {
      'test1': {
        percentChange: -6,
        baseline: 100,
        current: 94
      }
    };

    const report = generateReport(changes);
    assert.match(report.summary, /Performance regression detected/);
  });

  it('should handle missing baseline tests', () => {
    const baseline = {
      results: [{
        name: 'test1',
        hz: 100
      }]
    };
    
    const current = {
      results: [{
        name: 'test1',
        hz: 90
      }, {
        name: 'test2',
        hz: 80
      }]
    };

    const changes = calculatePerformanceChange(baseline, current);
    assert.equal(Object.keys(changes).length, 1);
  });
}); 