/**
 * SmartWaste AI - Route Optimization Service
 * Implements Nearest Neighbor TSP heuristic for municipal collection routing.
 * Calculates distance, travel time, and operational fuel/CO2 savings.
 */

// Haversine formula for distance in kilometers between two GPS points [lng, lat]
const calculateDistanceKm = (coord1, coord2) => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Optimizes a list of bins into an ordered collection route using Nearest Neighbor heuristic.
 * Depot coordinates default to the central municipal depot if not specified.
 */
const optimizeRoute = (bins, startDepot = [77.5946, 12.9716]) => {
  if (!bins || bins.length === 0) {
    return {
      orderedBins: [],
      waypoints: [],
      totalDistanceKm: 0,
      totalDurationMin: 0,
      baselineDistanceKm: 0,
      distanceSavedKm: 0,
      fuelSavedLiters: 0,
      co2SavedKg: 0,
      costSavedInr: 0,
      algorithm: 'Nearest-Neighbor Heuristic (TSP)',
    };
  }

  // Calculate unoptimized baseline distance (arbitrary sequential order)
  let baselineDistance = 0;
  let currentCoord = startDepot;
  bins.forEach((b) => {
    const coords = b.location?.coordinates || [77.5946, 12.9716];
    baselineDistance += calculateDistanceKm(currentCoord, coords);
    currentCoord = coords;
  });
  // Return to depot
  baselineDistance += calculateDistanceKm(currentCoord, startDepot);

  // Optimized route using Nearest Neighbor
  const unvisited = [...bins];
  const orderedBins = [];
  const waypoints = [];
  let currentPos = startDepot;
  let optimizedDistance = 0;
  let stepOrder = 1;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const bCoords = unvisited[i].location?.coordinates || [77.5946, 12.9716];
      const dist = calculateDistanceKm(currentPos, bCoords);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    const nextBin = unvisited.splice(nearestIndex, 1)[0];
    const nextCoords = nextBin.location?.coordinates || [77.5946, 12.9716];

    optimizedDistance += minDistance;
    orderedBins.push(nextBin);
    waypoints.push({
      binId: nextBin.binId,
      label: nextBin.label,
      coordinates: nextCoords,
      fillPercentage: nextBin.currentFillPercentage,
      order: stepOrder++,
      distanceFromPrevKm: Math.round(minDistance * 100) / 100,
    });

    currentPos = nextCoords;
  }

  // Return to depot from last bin
  const returnDist = calculateDistanceKm(currentPos, startDepot);
  optimizedDistance += returnDist;

  // Duration model: 25 km/h average municipal truck speed in traffic + 6 mins per bin collection stop
  const travelTimeMinutes = (optimizedDistance / 25) * 60;
  const collectionStopMinutes = bins.length * 6;
  const totalDurationMin = Math.round(travelTimeMinutes + collectionStopMinutes);

  // Sustainability & Financial savings metrics
  // Assumptions: Heavy vehicle consumes 0.35 L diesel per km; Diesel price ~90 INR/L; 2.68 kg CO2 per liter diesel
  const distanceSaved = Math.max(0, baselineDistance - optimizedDistance);
  const fuelSavedLiters = Math.round(distanceSaved * 0.35 * 10) / 10;
  const co2SavedKg = Math.round(fuelSavedLiters * 2.68 * 10) / 10;
  const costSavedInr = Math.round(fuelSavedLiters * 90);

  return {
    orderedBins,
    waypoints,
    totalDistanceKm: Math.round(optimizedDistance * 10) / 10,
    totalDurationMin,
    baselineDistanceKm: Math.round(baselineDistance * 10) / 10,
    distanceSavedKm: Math.round(distanceSaved * 10) / 10,
    fuelSavedLiters,
    co2SavedKg,
    costSavedInr,
    depot: startDepot,
    algorithm: 'Nearest-Neighbor Heuristic (TSP)',
  };
};

module.exports = {
  calculateDistanceKm,
  optimizeRoute,
};
