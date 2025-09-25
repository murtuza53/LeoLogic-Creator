
import type { SVGProps } from 'react';

export const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a10 10 0 0 0-3.16 19.5A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
    <path d="M15.5 8.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" />
    <path d="M12 13h.01" />
    <path d="M12 16h.01" />
    <path d="M15 13h.01" />
    <path d="M15 16h.01" />
    <path d="M9 13h.01" />
    <path d="M9 16h.01" />
    <path d="M4.5 10.5c-1.5 0-2.2.5-2.5 1.5" />
    <path d="M19.5 10.5c1.5 0 2.2.5 2.5 1.5" />
    <path d="M2.5 16a2.5 2.5 0 0 0 2 2.5" />
    <path d="M21.5 16a2.5 2.5 0 0 1-2 2.5" />
  </svg>
);
