import React from "react";

export interface NexusLogoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export function NexusLogoIcon({
  size = 20,
  className,
  style,
  ...props
}: NexusLogoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      {...props}
    >
      <defs>
        <linearGradient id="nexusIconBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>

        <linearGradient id="nexusIconBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a855f7" stop-opacity="0.85" />
          <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0.3" />
        </linearGradient>

        <linearGradient id="nexusLeftPillarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c084fc" />
          <stop offset="100%" stop-color="#7e22ce" />
        </linearGradient>

        <linearGradient id="nexusDiagonalCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f472b6" />
          <stop offset="35%" stop-color="#a855f7" />
          <stop offset="70%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>

        <linearGradient id="nexusRightPillarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
      </defs>

      {/* Squircle base */}
      <rect
        x="4"
        y="4"
        width="120"
        height="120"
        rx="28"
        fill="url(#nexusIconBgGrad)"
        stroke="url(#nexusIconBorderGrad)"
        strokeWidth="2.5"
      />

      {/* Top Specular Reflection */}
      <path
        d="M 16 28 C 30 14, 98 14, 112 28"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* 'N' Nexus Form */}
      <g>
        <path d="M 32 34 L 46 34 L 46 94 L 32 94 Z" rx="3" fill="url(#nexusLeftPillarGrad)" />
        <path d="M 82 34 L 96 34 L 96 94 L 82 94 Z" rx="3" fill="url(#nexusRightPillarGrad)" />
        <path d="M 32 34 L 48 34 L 96 90 L 80 90 Z" fill="url(#nexusDiagonalCoreGrad)" opacity="0.95" />
        <path
          d="M 64 56 Q 64 62, 70 62 Q 64 62, 64 68 Q 64 62, 58 62 Q 64 62, 64 56 Z"
          fill="#ffffff"
        />
      </g>
    </svg>
  );
}

