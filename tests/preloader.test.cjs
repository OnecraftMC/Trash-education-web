const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createAssetLoadGate } = require('../assets/js/preloader.js');

function createHarness(total, options = {}) {
    const progress = [];
    const outcomes = [];
    const gate = createAssetLoadGate(total, {
        ...options,
        onProgress: (state) => progress.push(state),
        onReady: () => outcomes.push('ready'),
        onProblem: (state) => outcomes.push(state)
    });

    return {
        gate,
        progress,
        outcomes
    };
}

test('opens only after every startup asset succeeds', () => {
    const harness = createHarness(2);

    harness.gate.settle(0, true);
    assert.deepEqual(harness.outcomes, []);
    assert.deepEqual(harness.progress.at(-1), { completed: 1, total: 2, failed: 0 });

    harness.gate.settle(1, true);
    assert.deepEqual(harness.outcomes, ['ready']);
});

test('reports failed assets without automatically opening the page', () => {
    const harness = createHarness(2);

    harness.gate.settle(0, false);
    harness.gate.settle(1, true);

    assert.deepEqual(harness.outcomes, [{
        completed: 2,
        total: 2,
        failed: 1
    }]);
});

test('keeps waiting for pending assets instead of timing out', async () => {
    const harness = createHarness(2, { timeoutMs: 0 });

    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual(harness.outcomes, []);

    harness.gate.settle(0, true);
    assert.deepEqual(harness.outcomes, []);
    harness.gate.settle(1, true);
    assert.deepEqual(harness.outcomes, ['ready']);
});

test('ignores duplicate settlement for the same asset', () => {
    const harness = createHarness(2);

    harness.gate.settle(0, true);
    harness.gate.settle(0, false);
    harness.gate.settle(1, true);

    assert.deepEqual(harness.outcomes, ['ready']);
    assert.equal(harness.progress.length, 2);
});

test('installs the startup error listener before loading stylesheets', () => {
    const html = readFileSync(require.resolve('../index.html'), 'utf8');

    assert.ok(
        html.indexOf('<script src="assets/js/preloader.js">') < html.indexOf('<link rel="stylesheet" href="assets/css/main.css">'),
        'the preloader must observe stylesheet load failures'
    );
});
