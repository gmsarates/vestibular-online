import { clsx, type ClassValue } from "clsx"
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreen();

    window.addEventListener('resize', checkScreen);

    return () => {
      window.removeEventListener('resize', checkScreen);
    };
  }, []);

  return isMobile;
}