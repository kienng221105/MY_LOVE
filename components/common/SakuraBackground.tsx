'use client';

import { useEffect, useState } from 'react';

interface PetalItem {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

export function SakuraBackground() {
  const [petals, setPetals] = useState<PetalItem[]>([]);

  useEffect(() => {
    const items: PetalItem[] = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 12 + 8,
      duration: Math.random() * 6 + 6,
      delay: Math.random() * 5,
    }));
    setPetals(items);
  }, []);

  return (
    <div className="sakura-container">
      {petals.map((p) => (
        <div
          key={p.id}
          className="petal"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.4}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
