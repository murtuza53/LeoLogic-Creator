"use client";

import Script from 'next/script';

export default function BottomAdBanner() {
  return (
    <div className="container mx-auto px-4 md:px-6 my-8 flex justify-center">
      {/* Replace with your bottom banner ad script */}
      <Script async data-cfasync="false" src="//pl27805151.revenuecpmgate.com/94ae52161e71e5c557f12c90150ad810/invoke.js" />
      <div id="container-94ae52161e71e5c557f12c90150ad810"></div>
    </div>
  );
}
