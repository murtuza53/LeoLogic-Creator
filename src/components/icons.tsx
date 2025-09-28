
import type { SVGProps } from 'react';
import Image from 'next/image';

export const Logo = (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
  <Image
    src="/logo.png"
    alt="Leo Creator Logo"
    width={24}
    height={24}
    {...props}
  />
);
