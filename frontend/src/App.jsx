// App.jsx
import { useState } from 'react';
import './App.css';
import Header from './Header';
import InputForm from './InputForm';
import ResultPanel from './ResultPanel';

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="app">
      <Header />

      <main className="app__main">
        {/* Hero */}
        <div className="app__hero">
          <div className="app__hero-tag">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
            XGBoost · AI4I 2020 Dataset
          </div>
          <h1 className="app__hero-title">
            Predict Machine<br />
            <span>Failures in Real‑Time</span>
          </h1>
          <p className="app__hero-desc">
            Enter sensor readings from your industrial machine to get an instant AI-powered
            failure risk assessment. Built on the AI4I 2020 predictive maintenance dataset.
          </p>
        </div>

        {/* Info strip */}
        <div className="info-strip">
          {[
            'XGBoost Model',
            'Response ~10–50 ms',
            'High Recall Optimized',
            '37% Decision Threshold',
          ].map(item => (
            <div className="info-strip__item" key={item}>
              <span className="info-strip__item-dot" />
              {item}
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="app__columns">
          {/* Left — scrollable form */}
          <InputForm
            onResult={setResult}
            onLoading={setLoading}
          />

          {/* Right — sticky result panel */}
          <div className="app__result-col">
            <ResultPanel
              result={result}
              loading={loading}
            />
          </div>
        </div>
      </main>

      <footer className="app__footer">
        FailureGuard · Built with React + Vite ·{' '}
        <a href="https://www.kaggle.com/datasets/stephanmatzka/predictive-maintenance-dataset-ai4i-2020" target="_blank" rel="noopener noreferrer">
          AI4I 2020 Dataset
        </a>
      </footer>
    </div>
  );
}
