import React from 'react';

export type HandPose = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type HandState = 'idle' | 'breathing' | 'shaking' | 'reveal' | 'victory' | 'defeat';

interface RiggedHandProps {
  pose: HandPose;
  state: HandState;
  facing: 'up' | 'down'; // 'up' for player (bottom), 'down' for opponent (top, rotated)
  colorTheme: 'cyan' | 'pink';
}

interface JointRotations {
  mcp: number; // Knuckle
  pip: number; // Middle joint
  dip: number; // Tip
}

// Configuration for each finger's joints in all 7 poses (0-6)
// Rotations are in degrees. 0 = straight/extended. Positive curls inwards.
type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';

const POSE_ROTATIONS: Record<HandPose, Record<FingerName, JointRotations>> = {
  // 0: Fist (All folded)
  0: {
    thumb: { mcp: 60, pip: 65, dip: 45 },
    index: { mcp: 110, pip: 110, dip: 90 },
    middle: { mcp: 110, pip: 115, dip: 90 },
    ring: { mcp: 110, pip: 115, dip: 90 },
    pinky: { mcp: 110, pip: 110, dip: 90 },
  },
  // 1: Index finger up (others folded)
  1: {
    thumb: { mcp: 60, pip: 65, dip: 45 },
    index: { mcp: 0, pip: 0, dip: 0 },
    middle: { mcp: 110, pip: 115, dip: 90 },
    ring: { mcp: 110, pip: 115, dip: 90 },
    pinky: { mcp: 110, pip: 110, dip: 90 },
  },
  // 2: Index & Middle up (others folded)
  2: {
    thumb: { mcp: 60, pip: 65, dip: 45 },
    index: { mcp: -10, pip: 0, dip: 0 }, // V spread index
    middle: { mcp: 10, pip: 0, dip: 0 }, // V spread middle
    ring: { mcp: 110, pip: 115, dip: 90 },
    pinky: { mcp: 110, pip: 110, dip: 90 },
  },
  // 3: Index, Middle, Ring up (others folded)
  3: {
    thumb: { mcp: 60, pip: 65, dip: 45 },
    index: { mcp: -12, pip: 0, dip: 0 },
    middle: { mcp: 0, pip: 0, dip: 0 },
    ring: { mcp: 12, pip: 0, dip: 0 },
    pinky: { mcp: 110, pip: 110, dip: 90 },
  },
  // 4: Four fingers up (thumb folded)
  4: {
    thumb: { mcp: 60, pip: 65, dip: 45 },
    index: { mcp: -15, pip: 0, dip: 0 },
    middle: { mcp: -5, pip: 0, dip: 0 },
    ring: { mcp: 5, pip: 0, dip: 0 },
    pinky: { mcp: 15, pip: 0, dip: 0 },
  },
  // 5: Open Palm (All extended)
  5: {
    thumb: { mcp: -25, pip: -10, dip: -5 },
    index: { mcp: -15, pip: 0, dip: 0 },
    middle: { mcp: 0, pip: 0, dip: 0 },
    ring: { mcp: 10, pip: 0, dip: 0 },
    pinky: { mcp: 20, pip: 0, dip: 0 },
  },
  // 6: Thumbs-up (Thumb extended, others folded)
  6: {
    thumb: { mcp: -30, pip: -15, dip: -10 },
    index: { mcp: 110, pip: 110, dip: 90 },
    middle: { mcp: 110, pip: 115, dip: 90 },
    ring: { mcp: 110, pip: 115, dip: 90 },
    pinky: { mcp: 110, pip: 110, dip: 90 },
  },
};

export const RiggedHand: React.FC<RiggedHandProps> = ({
  pose,
  state,
  facing,
  colorTheme,
}) => {
  const activeRotations = POSE_ROTATIONS[pose];

  // Helper to build inline styles for joint rotations
  const getJointStyle = (finger: FingerName, joint: keyof JointRotations) => {
    let rotation = activeRotations[finger][joint];

    // Mirror thumb and pinky rotation directions if facing/left-right hand symmetries require it
    // But since this is a 2D rig, rotating in 2D is simple.
    // Let's add slight state modifications
    if (state === 'victory' && joint === 'mcp') {
      // Add a slight wave wobble if in victory state
      // This is handled by CSS keyframe on the container, but we can also nudge here if needed
    }

    return {
      transform: `rotate(${rotation}deg)`,
    } as React.CSSProperties;
  };

  // Determine active CSS animation classes
  let stateClasses = '';
  if (state === 'shaking') {
    stateClasses = 'animate-hand-shake';
  } else if (state === 'breathing' || state === 'idle') {
    stateClasses = 'animate-hand-breath';
  } else if (state === 'victory') {
    stateClasses = 'animate-[bounce_1s_infinite]';
  } else if (state === 'defeat') {
    stateClasses = 'transition-all duration-1000 translate-y-16 opacity-40';
  }

  // Determine colors based on theme
  const strokeColor = colorTheme === 'cyan' ? '#00f0ff' : '#ff007f';
  const glowId = `glow-${colorTheme}`;
  const gradientId = `grad-${colorTheme}`;

  return (
    <div
      className={`w-full max-w-[200px] aspect-[2/3] flex items-center justify-center transition-transform duration-500 ${
        facing === 'down' ? 'rotate-180' : ''
      }`}
    >
      <svg
        viewBox="0 0 200 320"
        className={`w-full h-full hand-svg ${stateClasses}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Holographic Glowing Filters */}
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-pink" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Sleek Neon Gradients */}
          <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0, 240, 255, 0.4)" />
            <stop offset="100%" stopColor="rgba(37, 99, 235, 0.15)" />
          </linearGradient>
          <linearGradient id="grad-pink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 0, 127, 0.4)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.15)" />
          </linearGradient>
        </defs>

        <g filter={`url(#${glowId})`}>
          {/* Wrist Base connection */}
          <path
            d="M 70 320 L 70 290 Q 70 270, 75 260 L 125 260 Q 130 270, 130 290 L 130 320 Z"
            fill={`url(#${gradientId})`}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Palm Model */}
          <path
            d="M 75 260 C 50 250, 40 220, 48 180 C 60 170, 140 170, 152 180 C 160 220, 150 250, 125 260 Z"
            fill={`url(#${gradientId})`}
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Palm details (aesthetic hand lines) */}
          <path
            d="M 68 205 Q 90 225, 115 210 M 80 235 Q 105 240, 128 220"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />

          {/* Rigged Fingers */}
          
          {/* THUMB: starts at (50, 230), base rotation outwards */}
          <g transform="translate(48, 225) rotate(-35)" className="joint">
            <g style={getJointStyle('thumb', 'mcp')} className="joint">
              {/* Phalanx 1 */}
              <rect x="-8" y="-30" width="16" height="30" rx="8" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2.5" />
              
              <g transform="translate(0, -30)" style={getJointStyle('thumb', 'pip')} className="joint">
                {/* Phalanx 2 */}
                <rect x="-7" y="-22" width="14" height="22" rx="7" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2.5" />
                
                <g transform="translate(0, -22)" style={getJointStyle('thumb', 'dip')} className="joint">
                  {/* Phalanx 3 / Tip */}
                  <rect x="-6" y="-18" width="12" height="18" rx="6" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2.5" />
                  {/* Thumbnail */}
                  <rect x="-3" y="-14" width="6" height="8" rx="1.5" fill={strokeColor} opacity="0.3" />
                </g>
              </g>
            </g>
          </g>

          {/* INDEX FINGER: starts at (65, 175) */}
          <g transform="translate(68, 174)" className="joint">
            <g style={getJointStyle('index', 'mcp')} className="joint">
              {/* Phalanx 1 */}
              <rect x="-8" y="-38" width="16" height="38" rx="8" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2.5" />
              
              <g transform="translate(0, -38)" style={getJointStyle('index', 'pip')} className="joint">
                {/* Phalanx 2 */}
                <rect x="-7" y="-28" width="14" height="28" rx="7" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2.5" />
                
                <g transform="translate(0, -28)" style={getJointStyle('index', 'dip')} className="joint">
                  {/* Phalanx 3 / Tip */}
                  <rect x="-6" y="-20" width="12" height="20" rx="6" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2.5" />
                  {/* Thumbnail */}
                  <rect x="-3" y="-15" width="6" height="9" rx="1.5" fill={strokeColor} opacity="0.3" />
                </g>
              </g>
            </g>
          </g>

          {/* MIDDLE FINGER: starts at (98, 170) */}
          <g transform="translate(98, 170)" className="joint">
            <g style={getJointStyle('middle', 'mcp')} className="joint">
              {/* Phalanx 1 */}
              <rect x="-8.5" y="-42" width="17" height="42" rx="8.5" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2.5" />
              
              <g transform="translate(0, -42)" style={getJointStyle('middle', 'pip')} className="joint">
                {/* Phalanx 2 */}
                <rect x="-7.5" y="-32" width="15" height="32" rx="7.5" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2.5" />
                
                <g transform="translate(0, -32)" style={getJointStyle('middle', 'dip')} className="joint">
                  {/* Phalanx 3 / Tip */}
                  <rect x="-6.5" y="-22" width="13" height="22" rx="6.5" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2.5" />
                  {/* Thumbnail */}
                  <rect x="-3.5" y="-17" width="7" height="10" rx="1.5" fill={strokeColor} opacity="0.3" />
                </g>
              </g>
            </g>
          </g>

          {/* RING FINGER: starts at (128, 175) */}
          <g transform="translate(128, 174)" className="joint">
            <g style={getJointStyle('ring', 'mcp')} className="joint">
              {/* Phalanx 1 */}
              <rect x="-8" y="-38" width="16" height="38" rx="8" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2.5" />
              
              <g transform="translate(0, -38)" style={getJointStyle('ring', 'pip')} className="joint">
                {/* Phalanx 2 */}
                <rect x="-7" y="-28" width="14" height="28" rx="7" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2.5" />
                
                <g transform="translate(0, -28)" style={getJointStyle('ring', 'dip')} className="joint">
                  {/* Phalanx 3 / Tip */}
                  <rect x="-6" y="-20" width="12" height="20" rx="6" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2.5" />
                  {/* Thumbnail */}
                  <rect x="-3" y="-15" width="6" height="9" rx="1.5" fill={strokeColor} opacity="0.3" />
                </g>
              </g>
            </g>
          </g>

          {/* PINKY FINGER: starts at (152, 185) */}
          <g transform="translate(152, 185)" className="joint">
            <g style={getJointStyle('pinky', 'mcp')} className="joint">
              {/* Phalanx 1 */}
              <rect x="-7.5" y="-30" width="15" height="30" rx="7.5" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2.5" />
              
              <g transform="translate(0, -30)" style={getJointStyle('pinky', 'pip')} className="joint">
                {/* Phalanx 2 */}
                <rect x="-6.5" y="-22" width="13" height="22" rx="6.5" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2.5" />
                
                <g transform="translate(0, -22)" style={getJointStyle('pinky', 'dip')} className="joint">
                  {/* Phalanx 3 / Tip */}
                  <rect x="-5.5" y="-16" width="11" height="16" rx="5.5" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2.5" />
                  {/* Thumbnail */}
                  <rect x="-2.5" y="-12" width="5" height="7" rx="1.5" fill={strokeColor} opacity="0.3" />
                </g>
              </g>
            </g>
          </g>

        </g>
      </svg>
    </div>
  );
};
