// utils/validation.js

export const FIELD_RANGES = {
  air_temperature: { min: 250, max: 400, label: 'Air Temperature', unit: 'K' },
  process_temperature: { min: 250, max: 420, label: 'Process Temperature', unit: 'K' },
  rotational_speed: { min: 100, max: 3000, label: 'Rotational Speed', unit: 'RPM' },
  torque: { min: 0, max: 300, label: 'Torque', unit: 'Nm' },
  tool_wear: { min: 0, max: 300, label: 'Tool Wear', unit: 'min' },
};

export const FIELD_HINTS = {
  air_temperature: 'Typical range: 295–305 K',
  process_temperature: 'Typical range: 305–315 K',
  rotational_speed: 'Typical range: 1000–2500 RPM',
  torque: 'Typical range: 5–80 Nm',
  tool_wear: 'Accumulated tool use in minutes',
};

export function validateForm(values) {
  const errors = {};

  if (values.Type === '' || values.Type === null || values.Type === undefined) {
    errors.Type = 'Machine type is required';
  }

  for (const [field, range] of Object.entries(FIELD_RANGES)) {
    const val = parseFloat(values[field]);
    if (values[field] === '' || isNaN(val)) {
      errors[field] = `${range.label} is required`;
    } else if (val < range.min || val > range.max) {
      errors[field] = `Must be between ${range.min}–${range.max} ${range.unit}`;
    }
  }

  return errors;
}

export function preparePayload(values) {
  return {
    Type: parseInt(values.Type),
    air_temperature: parseFloat(values.air_temperature),
    process_temperature: parseFloat(values.process_temperature),
    rotational_speed: parseFloat(values.rotational_speed),
    torque: parseFloat(values.torque),
    tool_wear: parseFloat(values.tool_wear),
  };
}
