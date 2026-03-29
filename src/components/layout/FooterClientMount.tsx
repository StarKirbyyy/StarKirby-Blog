"use client";

import { useEffect, useState } from "react";
import { Footer } from "./Footer";

export function FooterClientMount() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return <Footer />;
}
