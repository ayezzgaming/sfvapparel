'use client';

import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

// 1. HOME
export function IoHomeOutline({ className = 'w-6 h-6', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="32"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <path d="M80 212v236a16 16 0 0016 16h96V328a16 16 0 0116-16h96a16 16 0 0116 16v136h96a16 16 0 0016-16V212" />
      <path d="M448 240L273.7 78.4a24 24 0 00-35.4 0L64 240M144 144V80a8 8 0 018-8h48a8 8 0 018 8v72" />
    </svg>
  );
}

export function IoHome({ className = 'w-6 h-6', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <path d="M416 174.74V48h-80v58.45L256 32 32 240h64v224a16 16 0 0016 16h96V336a16 16 0 0116-16h64a16 16 0 0116 16v144h96a16 16 0 0016-16V240h64z" />
    </svg>
  );
}

// 2. GRID / CATALOG
export function IoGridOutline({ className = 'w-6 h-6', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="32"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <rect x="48" y="48" width="176" height="176" rx="20" ry="20" />
      <rect x="288" y="48" width="176" height="176" rx="20" ry="20" />
      <rect x="48" y="288" width="176" height="176" rx="20" ry="20" />
      <rect x="288" y="288" width="176" height="176" rx="20" ry="20" />
    </svg>
  );
}

export function IoGrid({ className = 'w-6 h-6', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <rect x="48" y="48" width="176" height="176" rx="24" ry="24" />
      <rect x="288" y="48" width="176" height="176" rx="24" ry="24" />
      <rect x="48" y="288" width="176" height="176" rx="24" ry="24" />
      <rect x="288" y="288" width="176" height="176" rx="24" ry="24" />
    </svg>
  );
}

// 3. TIME / HISTORY (Clock)
export function IoTimeOutline({ className = 'w-6 h-6', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="32"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <path d="M256 64C150 64 64 150 64 256s86 192 192 192 192-86 192-192S362 64 256 64z" />
      <path d="M256 128v144h96" />
    </svg>
  );
}

export function IoTime({ className = 'w-6 h-6', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <path d="M256 48C141.13 48 48 141.13 48 256c0 114.69 93.32 208 208 208 114.86 0 208-93.14 208-208 0-114.69-93.31-208-208-208zm108 240h-120a16 16 0 01-16-16V144a16 16 0 0132 0v112h104a16 16 0 010 32z" />
    </svg>
  );
}

// 4. PERSON / PROFILE
export function IoPersonOutline({ className = 'w-6 h-6', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="32"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <path d="M344 144c-3.92 52.88-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z" />
      <path d="M256 304c-87 0-175.3 48-191.64 138.6C62.39 453.52 68.57 464 80 464h352c11.44 0 17.62-10.48 15.65-21.4C431.3 352 343 304 256 304z" />
    </svg>
  );
}

export function IoPerson({ className = 'w-6 h-6', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <path d="M256 256A112 112 0 10144 144a112 112 0 00112 112zm0 32c-69.42 0-208 42.88-208 128v32a16 16 0 0016 16h384a16 16 0 0016-16v-32c0-85.12-138.58-128-208-128z" />
    </svg>
  );
}
