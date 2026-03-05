import { motion } from "framer-motion";

interface PagePenguinEmptyProps {
  image: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export const PagePenguinEmpty = ({ image, title, description, children }: PagePenguinEmptyProps) => (
  <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
    <motion.img
      src={image}
      alt={title}
      className="h-32 w-32 md:h-40 md:w-40 object-contain mb-4 drop-shadow-lg"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, type: "spring" }}
    />
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>
    {children}
  </div>
);
