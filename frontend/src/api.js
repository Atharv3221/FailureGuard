const BASE_URL = 'http://127.0.0.1:8000';

/**
 * Check if the backend is healthy
 */
export async function checkHealth() {
  const res = await fetch(`${BASE_URL}/`);
  if (!res.ok) throw new Error('Backend unreachable');
  return res.json();
}

/**
 * Submit sensor readings and get prediction
 * @param {Object} sensorData
 * @returns {Promise<{failure_prediction: number, failure_probability: number}>}
 */
export async function predict(sensorData) {
  const res = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sensorData),
  });

  if (!res.ok) {
    let errMsg = 'Prediction request failed';
    try {
      const err = await res.json();
      errMsg = err.detail || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }

  return res.json();
}

/**
 * Get status color class based on probability
 */
export function getStatusClass(probability) {
  if (probability === null || probability === undefined) return 'neutral';
  if (probability < 0.1) return 'safe';
  if (probability < 0.5) return 'warning';
  return 'danger';
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(prediction, probability) {
  if (prediction === 1) return 'Failure Likely';
  if (probability > 0.05) return 'Elevated Risk';
  return 'Normal Operation';
}

/**
 * Format probability as percentage string
 */
export function formatProbability(prob) {
  if (prob === null || prob === undefined) return '—';
  const pct = (prob * 100).toFixed(prob < 0.01 ? 4 : 2);
  return `${pct}%`;
}
