
import type { SVGProps } from 'react';
import Image from 'next/image';

export const Logo = (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
  <Image
    src="/logo.png?v=2"
    alt="Leo Creator Logo"
    unoptimized={true}
    width={40}
    height={40}
    {...props}
  />
);
