import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-destructive/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-muted/20 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Floating elements */}
      <motion.div
        className="absolute top-20 left-20 w-4 h-4 rounded-full bg-primary/30"
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-40 right-32 w-3 h-3 rounded-full bg-destructive/30"
        animate={{ y: [0, 15, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-32 left-40 w-5 h-5 rounded-full bg-info/30"
        animate={{ y: [0, -15, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />

      <div className="relative z-10 text-center p-6 max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* 404 Number with glow effect */}
          <div className="relative mb-6">
            <motion.h1 
              className="text-[150px] md:text-[200px] font-bold font-heading leading-none gradient-text"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              404
            </motion.h1>
            <div className="absolute inset-0 text-[150px] md:text-[200px] font-bold font-heading leading-none text-primary/20 blur-xl -z-10">
              404
            </div>
          </div>

          {/* Icon */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, rotate: -10 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50">
                <Compass className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive/80 flex items-center justify-center">
                <span className="text-destructive-foreground text-xs font-bold">!</span>
              </div>
            </div>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">
              Page introuvable
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Oops ! La page que vous recherchez semble avoir pris des vacances. 
              Elle n'existe pas ou a été déplacée.
            </p>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button 
              asChild
              size="lg"
              className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity glow-effect text-primary-foreground font-medium"
            >
              <Link to="/dashboard">
                <Home className="mr-2 h-5 w-5" />
                Tableau de bord
              </Link>
            </Button>
            <Button 
              asChild
              size="lg"
              variant="outline"
              className="border-border/50 hover:bg-muted/50"
            >
              <Link to="/">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Page d'accueil
              </Link>
            </Button>
          </motion.div>

          {/* Path info */}
          <motion.div
            className="mt-8 p-4 rounded-xl bg-muted/30 border border-border/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Search className="w-4 h-4" />
              <span>Page demandée :</span>
              <code className="px-2 py-1 rounded bg-background/50 text-destructive font-mono text-xs">
                {location.pathname}
              </code>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
