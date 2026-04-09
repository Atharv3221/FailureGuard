// components/Gauge.jsx
export default function Gauge({ probability }) {
  const pct = Math.min(Math.max(probability || 0, 0), 1);

  const statusColor =
    pct < 0.1  ? 'var(--color-safe)' :
    pct < 0.5  ? 'var(--color-warning)' :
                 'var(--color-danger)';

  const percentDisplay = (pct * 100).toFixed(pct < 0.01 ? 3 : 1);

  // Semi-circle: center (100,100), radius 70
  // Arc goes from left (30,100) to right (170,100)
  // strokeDasharray = π * r = 3.14159 * 70 ≈ 219.9
  const R = 70;
  const ARC_LEN = Math.PI * R; // ≈ 219.9

  // How much of the arc to show
  const fillLen = pct * ARC_LEN;
  const gapLen  = ARC_LEN - fillLen;

  // Needle angle: -180deg (left) to 0deg (right)
  const needleAngle = -180 + pct * 180;
  const needleRad   = (needleAngle * Math.PI) / 180;
  const needleX     = 100 + 52 * Math.cos(needleRad);
  const needleY     = 100 + 52 * Math.sin(needleRad);

  return (
    <div className="gauge-wrap">
      <svg
        viewBox="0 0 200 115"
        width="200"
        height="115"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* Track arc — grey background */}
        <path
          d="M 30 100 A 70 70 0 0 1 170 100"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Fill arc — colored, left to right */}
        <path
          d="M 30 100 A 70 70 0 0 1 170 100"
          fill="none"
          stroke={statusColor}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${fillLen} ${gapLen + 1}`}
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease' }}
        />

        {/* Tick marks at 0%, 25%, 50%, 75%, 100% */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const a   = (-180 + t * 180) * (Math.PI / 180);
          const x1  = 100 + 77 * Math.cos(a);
          const y1  = 100 + 77 * Math.sin(a);
          const x2  = 100 + 65 * Math.cos(a);
          const y2  = 100 + 65 * Math.sin(a);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="var(--color-border-strong)" strokeWidth="1.5" strokeLinecap="round" />
          );
        })}

        {/* Needle */}
        <line
          x1="100" y1="100"
          x2={needleX} y2={needleY}
          stroke={statusColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transition: 'all 1s cubic-bezier(0.4,0,0.2,1)' }}
        />

        {/* Needle center dot */}
        <circle cx="100" cy="100" r="5"
          fill={statusColor}
          style={{ transition: 'fill 0.5s ease' }}
        />

        {/* Percentage text */}
        <text
          x="100" y="90"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontSize="20"
          fontWeight="700"
          fill="var(--color-text-primary)"
        >
          {percentDisplay}%
        </text>

        {/* Label */}
        <text
          x="100" y="106"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="7.5"
          fill="var(--color-text-muted)"
          letterSpacing="0.08em"
        >
          PROBABILITY
        </text>
      </svg>

      {/* Scale labels */}
      <div className="gauge-scale">
        <span>0%</span>
        <span>37% Threshold</span>
        <span>100%</span>
      </div>
    </div>
  );
}
