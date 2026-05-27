
import React, { useEffect } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

export const InteractiveBackground: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const dx = useSpring(mouseX, springConfig);
  const dy = useSpring(mouseY, springConfig);

  // Create transformed motion values for parallax effect
  const x1 = useTransform(dx, (v) => v * 30);
  const y1 = useTransform(dy, (v) => v * 30);

  const x2 = useTransform(dx, (v) => v * -20);
  const y2 = useTransform(dy, (v) => v * -20);

  const x3 = useTransform(dx, (v) => v * 15);
  const y3 = useTransform(dy, (v) => v * 15);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates to range [-1, 1]
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-background pointer-events-none">
      {/* Deep dark base */}
      <div className="absolute inset-0 bg-[#0a0a0c]" />

      {/* Interactive Glows */}
      <motion.div
        style={{ x: x1, y: y1 }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]"
      />

      <motion.div
        style={{ x: x2, y: y2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[150px]"
      />

      <motion.div
        style={{ x: x3, y: y3 }}
        className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-600/5 blur-[100px]"
      />

      {/* Floating particles or subtle noise if needed, but keeping it clean for now */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  );
};
