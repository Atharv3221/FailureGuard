// components/InputForm.jsx
import { useState } from 'react';
import './InputForm.css';
import { validateForm, preparePayload, FIELD_RANGES, FIELD_HINTS } from './validation';
import { predict } from './api';

const MACHINE_TYPES = [
  {
    value: '0',
    label: 'Low (L) — Light duty, low stress',
    short: 'Low (L)',
    desc: 'Light-duty machines with low operational stress. Encoded as 0 in the model.',
    color: '0',
  },
  {
    value: '1',
    label: 'Medium (M) — Standard industrial',
    short: 'Medium (M)',
    desc: 'Standard industrial machines under moderate load. Encoded as 1 in the model.',
    color: '1',
  },
  {
    value: '2',
    label: 'High (H) — Heavy duty, high stress',
    short: 'High (H)',
    desc: 'Heavy-duty machines under high operational stress. Encoded as 2 in the model.',
    color: '2',
  },
];

const NUMERIC_FIELDS = [
  { key: 'air_temperature', label: 'Air Temperature', placeholder: 'e.g. 298.2' },
  { key: 'process_temperature', label: 'Process Temperature', placeholder: 'e.g. 308.7' },
  { key: 'rotational_speed', label: 'Rotational Speed', placeholder: 'e.g. 1408' },
  { key: 'torque', label: 'Torque', placeholder: 'e.g. 46.3' },
  { key: 'tool_wear', label: 'Tool Wear', placeholder: 'e.g. 3' },
];

const DEMO_CASES = [
  {
    id: 'normal',
    label: 'Normal Operation',
    icon: '🟢',
    tag: 'safe',
    tagLabel: 'No Failure',
    desc: 'Typical healthy machine — all sensors within nominal range.',
    values: {
      Type: '1',
      air_temperature: '298.2',
      process_temperature: '308.7',
      rotational_speed: '1408',
      torque: '46.3',
      tool_wear: '3',
    },
  },
  {
    id: 'wear',
    label: 'High Tool Wear',
    icon: '🟡',
    tag: 'warning',
    tagLabel: 'Elevated Risk',
    desc: 'Tool nearing end-of-life with elevated torque — borderline zone.',
    values: {
      Type: '1',
      air_temperature: '301.0',
      process_temperature: '311.5',
      rotational_speed: '1350',
      torque: '60.0',
      tool_wear: '180',
    },
  },
  {
    id: 'failure',
    label: 'Imminent Failure',
    icon: '🔴',
    tag: 'danger',
    tagLabel: 'Failure Likely',
    desc: 'High torque + worn tool + low speed — critical failure pattern.',
    values: {
      Type: '2',
      air_temperature: '304.5',
      process_temperature: '316.0',
      rotational_speed: '1200',
      torque: '75.0',
      tool_wear: '240',
    },
  },
  {
    id: 'overspeed',
    label: 'Overspeed Stress',
    icon: '🟠',
    tag: 'warning',
    tagLabel: 'Monitor Closely',
    desc: 'Very high RPM with temperature creep — mechanical overstress risk.',
    values: {
      Type: '2',
      air_temperature: '303.0',
      process_temperature: '314.0',
      rotational_speed: '2800',
      torque: '30.0',
      tool_wear: '120',
    },
  },
];

const defaultValues = {
  Type: '',
  air_temperature: '',
  process_temperature: '',
  rotational_speed: '',
  torque: '',
  tool_wear: '',
};

export default function InputForm({ onResult, onLoading }) {
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    setActiveDemo(null);
    if (errors[name]) {
      setErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
    }
  };

  const handleDemoLoad = (demo) => {
    setValues(demo.values);
    setErrors({});
    setActiveDemo(demo.id);
    onResult(null);
  };

  const handleReset = () => {
    setValues(defaultValues);
    setErrors({});
    setActiveDemo(null);
    onResult(null);
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    onLoading(true);
    try {
      const payload = preparePayload(values);
      const result = await predict(payload);
      onResult({ data: result, error: null });
    } catch (err) {
      onResult({ data: null, error: err.message });
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  return (
    <div className="form-card">
      <div className="form-card__header">
        <div className="form-card__label">Sensor Input</div>
        <div className="form-card__title">Machine Parameters</div>
        <div className="form-card__desc">
          Enter real-time sensor readings or load a demo case to test the model instantly.
        </div>
      </div>

      {/* Demo Cases */}
      <div className="demo-section">
        <div className="demo-section__label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Quick Demo Cases
        </div>
        <div className="demo-grid">
          {DEMO_CASES.map(demo => (
            <button
              key={demo.id}
              type="button"
              className={`demo-card demo-card--${demo.tag}${activeDemo === demo.id ? ' demo-card--active' : ''}`}
              onClick={() => handleDemoLoad(demo)}
              disabled={loading}
            >
              <div className="demo-card__top">
                <span className="demo-card__icon">{demo.icon}</span>
                <span className={`demo-card__tag demo-card__tag--${demo.tag}`}>{demo.tagLabel}</span>
              </div>
              <div className="demo-card__label">{demo.label}</div>
              <div className="demo-card__desc">{demo.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <hr className="form-divider" />

      <div className="form-grid">
        {/* Machine Type */}
        <div className="form-field form-grid--full">
          <label className="form-field__label">
            Machine Type
            <span className="form-field__unit">operational class</span>
          </label>
          <div className="form-field__input-wrap">
            <select
              name="Type"
              value={values.Type}
              onChange={handleChange}
              className={`form-field__select${errors.Type ? ' error' : ''}`}
            >
              <option value="">Select machine type…</option>
              {MACHINE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <span className="form-field__select-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
          {errors.Type && <span className="form-field__error">⚠ {errors.Type}</span>}

          <div className="type-info-row">
            {MACHINE_TYPES.map(t => (
              <div
                key={t.value}
                className={`type-info-card type-info-card--${t.color}${values.Type === t.value ? ' active' : ''}`}
                onClick={() => {
                  setValues(prev => ({ ...prev, Type: t.value }));
                  setActiveDemo(null);
                  if (errors.Type) setErrors(prev => { const n = {...prev}; delete n.Type; return n; });
                }}
              >
                <div className="type-info-card__badge">
                  <span className={`type-badge type-badge--${t.color}`}>{t.short}</span>
                  <span className="type-info-card__code">API: {t.value}</span>
                </div>
                <div className="type-info-card__desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Numeric Fields */}
        {NUMERIC_FIELDS.map(field => {
          const range = FIELD_RANGES[field.key];
          return (
            <div className="form-field" key={field.key}>
              <label className="form-field__label">
                {field.label}
                <span className="form-field__unit">{range.unit}</span>
              </label>
              <div className="form-field__input-wrap">
                <input
                  type="number"
                  name={field.key}
                  value={values[field.key]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className={`form-field__input${errors[field.key] ? ' error' : ''}`}
                  step="any"
                  min={range.min}
                  max={range.max}
                />
              </div>
              {errors[field.key]
                ? <span className="form-field__error">⚠ {errors[field.key]}</span>
                : <span className="form-field__hint">{FIELD_HINTS[field.key]}</span>
              }
            </div>
          );
        })}
      </div>

      <hr className="form-divider" />

      <div className="form-actions">
        <button type="button" className="btn-reset" onClick={handleReset} disabled={loading}>
          Reset
        </button>
        <button type="button" className="btn-predict" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <><span className="btn-predict__spinner" /> Analyzing…</>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Run Prediction
            </>
          )}
        </button>
      </div>
    </div>
  );
}
