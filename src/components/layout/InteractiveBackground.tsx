
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

const InteractiveBackground: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const dx = useSpring(mouseX, springConfig);
  const dy = useSpring(mouseY, springConfig);


  const x1 = useTransform(dx, (v) => v * 60);
  const y1 = useTransform(dy, (v) => v * 60);

  const x2 = useTransform(dx, (v) => v * -40);
  const y2 = useTransform(dy, (v) => v * -40);

  const x3 = useTransform(dx, (v) => v * 30);
  const y3 = useTransform(dy, (v) => v * 30);

  const floatAnimation = {
    x: [0, 30, -20, 0],
    y: [0, -40, 20, 0],
    scale: [1, 1.1, 0.95, 1],
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: "linear"
    }
  };

  const floatAnimationReverse = {
    x: [0, -30, 20, 0],
    y: [0, 40, -20, 0],
    scale: [1, 0.95, 1.1, 1],
    transition: {
      duration: 25,
      repeat: Infinity,
      ease: "linear"
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {

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

      {/* Interactive Glows - Increased opacity and size */}
      <motion.div
        style={{ x: x1, y: y1 }}
        animate={floatAnimation}
        className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] rounded-full bg-blue-600/15 blur-[140px]"
      />

      <motion.div
        style={{ x: x2, y: y2 }}
        animate={floatAnimationReverse}
        className="absolute bottom-[-15%] right-[-15%] w-[70%] h-[70%] rounded-full bg-purple-600/15 blur-[160px]"
      />

      <motion.div
        style={{ x: x3, y: y3 }}
        animate={floatAnimation}
        className="absolute top-[15%] right-[5%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[120px]"
      />

      {/* Floating particles or subtle noise if needed, but keeping it clean for now */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  );
};

export default InteractiveBackground;
