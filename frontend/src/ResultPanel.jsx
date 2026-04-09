// components/ResultPanel.jsx
import './ResultPanel.css';
import Gauge from './Gauge';
import { getStatusClass, getStatusLabel, formatProbability } from './api';

function EmptyState() {
  return (
    <div className="result-panel__empty">
      <div className="result-panel__empty-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="result-panel__empty-title">Awaiting Prediction</div>
      <div className="result-panel__empty-desc">
        Fill in the sensor readings and click "Run Prediction" to see results here.
      </div>
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === 'safe') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );
  }
  if (status === 'warning') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

function ErrorCard({ message }) {
  return (
    <div className="error-card">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div>
        <div className="error-card__title">Request Failed</div>
        <div className="error-card__message">
          {message || 'Unable to connect to the prediction API. Make sure the backend is running at http://127.0.0.1:8000'}
        </div>
      </div>
    </div>
  );
}

export default function ResultPanel({ result }) {
  // result: null | { data: {...}, error: null } | { data: null, error: 'msg' }

  const hasError = result && result.error;
  const hasData = result && result.data;

  const data = hasData ? result.data : null;
  const status = data ? getStatusClass(data.failure_probability) : null;
  const statusLabel = data ? getStatusLabel(data.failure_prediction, data.failure_probability) : null;
  const probFormatted = data ? formatProbability(data.failure_probability) : null;
  const probPct = data ? (data.failure_probability * 100) : 0;

  const statusDesc = {
    safe: 'Machine is operating within normal parameters. No immediate action required.',
    warning: 'Elevated risk detected. Monitor closely and schedule inspection.',
    danger: 'High failure probability. Immediate maintenance recommended.',
  };

  return (
    <div className="result-panel">
      <div>
        <div className="result-panel__section-label">Prediction Output</div>

        {!result && <EmptyState />}
        {hasError && <ErrorCard message={result.error} />}

        {hasData && (
          <>
            {/* Status card */}
            <div className={`status-card status-card--${status}`}>
              <div className="status-card__icon-wrap">
                <StatusIcon status={status} />
              </div>
              <div className="status-card__info">
                <div className="status-card__status">{statusLabel}</div>
                <div className="status-card__desc">{statusDesc[status]}</div>
              </div>
              <div className="status-card__prediction-badge">
                {data.failure_prediction === 1 ? 'FAIL' : 'PASS'}
              </div>
            </div>
          </>
        )}
      </div>

      {hasData && (
        <>
          {/* Gauge */}
          <div>
            <div className="result-panel__section-label">Failure Probability</div>
            <Gauge probability={data.failure_probability} />
          </div>

          {/* Risk Bar */}
          <div>
            <div className="result-panel__section-label">Risk Level</div>
            <div className="risk-bar-wrap">
              <div className="risk-bar-track">
                <div
                  className={`risk-bar-fill risk-bar-fill--${status}`}
                  style={{ width: `${Math.min(probPct, 100)}%` }}
                />
              </div>
              <div className="risk-bar-labels">
                <span>0% — Safe</span>
                <span>37% — Threshold</span>
                <span>100% — Critical</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div>
            <div className="result-panel__section-label">Details</div>
            <div className="stats-row">
              <div className="stat-item">
                <div className="stat-item__label">Raw Probability</div>
                <div className="stat-item__value">{data.failure_probability.toFixed(6)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-item__label">Percentage</div>
                <div className="stat-item__value">{probFormatted}</div>
              </div>
              <div className="stat-item">
                <div className="stat-item__label">Model Decision</div>
                <div className="stat-item__value">{data.failure_prediction === 1 ? 'Failure' : 'No Failure'}</div>
              </div>
              <div className="stat-item">
                <div className="stat-item__label">Risk Band</div>
                <div className="stat-item__value" style={{ textTransform: 'capitalize' }}>{status}</div>
              </div>
            </div>
          </div>

          {/* Threshold Note */}
          <div className="threshold-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              The model uses a custom threshold of <strong>0.37</strong> (37%) to classify failures.
              Optimized for high recall — minimizing missed failures.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
