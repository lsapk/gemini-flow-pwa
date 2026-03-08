import { useState } from "react";
import { motion } from "framer-motion";

interface SpriteAnimationProps {
  src: string;
  frameWidth: number;
  frameHeight: number;
  totalFrames: number;
  fps?: number;
  direction?: 'horizontal' | 'vertical';
  autoPlay?: boolean;
  playOnHover?: boolean;
  className?: string;
  alt?: string;
}

export const SpriteAnimation = ({
  src,
  frameWidth,
  frameHeight,
  totalFrames,
  fps = 12,
  direction = 'horizontal',
  autoPlay = true,
  playOnHover = false,
  className = "",
  alt = "Animation"
}: SpriteAnimationProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const animationDuration = totalFrames / fps;
  const totalSize = direction === 'horizontal' 
    ? frameWidth * totalFrames 
    : frameHeight * totalFrames;

  const shouldAnimate = autoPlay || (playOnHover && isHovered);

  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: frameWidth,
        height: frameHeight,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={playOnHover ? { scale: 1.05 } : undefined}
    >
      <div
        className="absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: direction === 'horizontal' 
            ? `${totalSize}px ${frameHeight}px`
            : `${frameWidth}px ${totalSize}px`,
          animation: shouldAnimate 
            ? `sprite-${direction} ${animationDuration}s steps(${totalFrames}) infinite`
            : 'none',
          backgroundPosition: '0 0',
        }}
        role="img"
        aria-label={alt}
      />
    </motion.div>
  );
};

// Preset animations for common penguin sprites
export const PenguinWalkSprite = ({ className = "" }: { className?: string }) => (
  <SpriteAnimation
    src="/src/assets/penguin-sprites.png"
    frameWidth={100}
    frameHeight={100}
    totalFrames={8}
    fps={10}
    className={className}
    alt="Penguin walking"
  />
);

export const PenguinWaveSprite = ({ className = "" }: { className?: string }) => (
  <SpriteAnimation
    src="/src/assets/penguin-wave-sprites.png"
    frameWidth={100}
    frameHeight={100}
    totalFrames={8}
    fps={8}
    playOnHover
    autoPlay={false}
    className={className}
    alt="Penguin waving"
  />
);
