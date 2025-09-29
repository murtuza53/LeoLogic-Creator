"use client";

import { useEffect } from 'react';

const GoogleAds = () => {
  useEffect(() => {
    try {
      const script = document.createElement('script');
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4404974079606262";
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);

      // This is for auto-ads
      // (window.adsbygoogle = window.adsbygoogle || []).push({});
      
      return () => {
        // Optional: Cleanup script on component unmount
        document.head.removeChild(script);
      };
    } catch (error) {
      console.error("Failed to load Google Ads script", error);
    }
  }, []);

  return null;
};

export default GoogleAds;
