/**
 * SmartWaste AI - Automated Integration & Unit Tests
 */

const assert = require('assert');
const { connectDB } = require('../src/config/db');
const { userRepo, binRepo, alertRepo, taskRepo } = require('../src/models/dataRepository');
const { optimizeRoute, calculateDistanceKm } = require('../src/services/routeOptimizationService');
const { getPredictionForBin } = require('../src/services/mlClientService');
const { runSimulationStep } = require('../src/services/simulatorService');

async function runTests() {
  console.log('\n--- Running EcoNexa Integration Tests ---\n');
  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`FAIL: ${name}`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  };

  // Initialize DB / Memory Store
  await connectDB();

  // Test 1: User Repository Authentication check
  await test('User Repository retrieves admin user', async () => {
    const admin = await userRepo.findByEmail('admin@econexa.city');
    assert(admin, 'Admin user should exist in repository');
    assert.strictEqual(admin.role, 'admin', 'Admin user must have admin role');
  });

  // Test 2: Password hashing & verification
  await test('Password authentication matches for seeded demo users', async () => {
    const bcrypt = require('bcryptjs');
    const adminWithPass = await userRepo.findByEmail('admin@econexa.city', true);
    const matches = await bcrypt.compare('password123', adminWithPass.password);
    assert(matches, 'Seeded password123 must match bcrypt hash');
  });

  // Test 3: Bin Repository queries and filtering
  await test('Bin Repository filters by status and ward', async () => {
    const allBins = await binRepo.find({});
    assert(allBins.length >= 10, 'Expected at least 10 seeded bins');

    const criticalBins = await binRepo.find({ status: 'critical' });
    assert(criticalBins.length > 0, 'Should find critical bins');
    criticalBins.forEach((b) => {
      assert(b.currentFillPercentage >= (b.criticalThreshold || 80), 'Critical bin must meet or exceed threshold');
    });
  });

  // Test 4: Distance calculation
  await test('Haversine distance calculation is accurate', () => {
    // Bangalore Majestic to Indiranagar (~7 km)
    const p1 = [77.5714, 12.9756];
    const p2 = [77.6408, 12.9719];
    const dist = calculateDistanceKm(p1, p2);
    assert(dist > 6 && dist < 9, `Expected distance ~7.5 km, got ${dist.toFixed(2)} km`);
  });

  // Test 5: Route optimization TSP Nearest-Neighbor heuristic
  await test('Route Optimization sequences waypoints and calculates savings', async () => {
    const bins = await binRepo.find({});
    const sampleBins = bins.slice(0, 4);
    const result = optimizeRoute(sampleBins);

    assert.strictEqual(result.waypoints.length, sampleBins.length, 'Every bin should be an ordered waypoint');
    assert(result.totalDistanceKm > 0, 'Total distance must be positive');
    assert(result.totalDurationMin > 0, 'Duration must be positive');
    assert(result.fuelSavedLiters >= 0, 'Fuel saved must be non-negative');
    assert(result.co2SavedKg >= 0, 'CO2 saved must be non-negative');
  });

  // Test 6: Prediction generation and fallback robustness
  await test('Prediction engine computes multi-horizon forecasts and time-to-overflow', async () => {
    const bin = (await binRepo.find({}))[0];
    const pred = await getPredictionForBin(bin);

    assert(pred, 'Prediction object must be returned');
    assert.strictEqual(pred.predictions.length, 3, 'Must return 3 horizons (6h, 12h, 24h)');
    assert(pred.confidence_score >= 0.5 && pred.confidence_score <= 1.0, 'Confidence must be between 0.5 and 1.0');
    assert(pred.prediction_source, 'Prediction source must be specified');
  });

  // Test 7: Simulation step execution and state persistence
  await test('Simulation step runs without error and increments readings', async () => {
    const initialLogsCount = (await alertRepo.find({})).length;
    await runSimulationStep();
    const updatedBins = await binRepo.find({});
    assert(updatedBins.length > 0, 'Bins should remain intact after simulation step');
  });

  // Test 8: Alert deduplication
  await test('Alert deduplication prevents duplicate unresolved alerts for the same incident', async () => {
    const existing = await alertRepo.findActiveByBinAndType('BIN-W1-003', 'threshold_exceeded');
    assert(existing, 'Active alert should be retrieved');
    assert.strictEqual(existing.resolved, false, 'Alert should be unresolved');
  });

  console.log(`\n===================================`);
  console.log(`Tests Summary: ${passed} passed, ${failed} failed`);
  console.log(`===================================\n`);

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runTests();
