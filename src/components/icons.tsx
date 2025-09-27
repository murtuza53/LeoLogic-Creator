
import type { SVGProps } from 'react';
import Image from 'next/image';

export const Logo = (props: SVGProps<SVGSVGElement>) => (
  <Image
    src="/logo.png"
    alt="Leo Creator Logo"
    width={24}
    height={24}
    className={props.className}
  />
);
