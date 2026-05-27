import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowRight, 
  Brain, 
  Target, 
  Sparkles,
  Clock,
  CheckCircle2,
  Zap,
  ShieldCheck,
  TrendingUp,
  Cpu
} from "lucide-react";
import { motion } from "framer-motion";
import InteractiveBackground from "@/components/layout/InteractiveBackground";
import deepflowLogo from "@/assets/deepflow-logo.png";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    const shouldRemember = localStorage.getItem("deepflow_remember_me") === "true";
    if (user && shouldRemember) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white selection:bg-primary/30 overflow-x-hidden font-sans">
      <InteractiveBackground />

      {/* Navigation */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
        <nav className="bg-black/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] px-6 py-3 flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/10 rounded-xl sm:rounded-2xl">
              <img src={deepflowLogo} alt="DeepFlow Logo" className="h-5 w-5 sm:h-7 sm:h-7 object-contain" />
            </div>
            <span className="text-lg sm:text-2xl font-bold tracking-tight text-white/90">
              DeepFlow
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/login" className="hidden sm:block text-sm font-medium text-white/60 hover:text-white transition-colors">
              Connexion
            </Link>
            <Link to="/register">
              <Button size="sm" className="sm:hidden rounded-full bg-primary hover:bg-primary/90 text-white font-bold px-5 h-9">
                Commencer
              </Button>
              <Button size="lg" className="hidden sm:flex rounded-full bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                Commencer
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow">
        {/* HERO */}
        <section className="relative min-h-screen flex items-center pt-32 px-6 pb-20">
          <div className="container max-w-6xl mx-auto relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="max-w-5xl mx-auto text-center"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-10 text-primary font-semibold text-sm tracking-wide uppercase">
                <Sparkles className="h-4 w-4" />
                L'intelligence artificielle au service de votre focus
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-5xl sm:text-8xl md:text-[9rem] font-black mb-8 leading-[0.9] tracking-tighter">
                Libérez votre <br />
                <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent italic">
                  Génie
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-lg sm:text-2xl md:text-3xl text-white/40 mb-14 max-w-3xl mx-auto leading-tight px-4 sm:px-0 font-medium">
                Passez du chaos mental à la maîtrise absolue. DeepFlow orchestre votre flux de travail pour une productivité sans effort.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col items-center gap-6 sm:gap-8">
                <Link to="/register">
                  <Button 
                    size="lg" 
                    className="h-14 sm:h-16 px-8 sm:px-12 text-lg sm:text-xl font-bold rounded-full bg-primary hover:bg-primary/90 shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] transition-all duration-500 hover:scale-105 active:scale-95 w-full sm:w-auto"
                  >
                    Reprendre le contrôle
                    <ArrowRight className="ml-2 sm:ml-3 h-5 sm:h-6 w-5 sm:w-6" />
                  </Button>
                </Link>
                
                <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
                   <div className="flex items-center gap-2 text-sm font-medium">
                      <ShieldCheck className="h-5 w-5 text-primary" /> Sécurisé & Privé
                   </div>
                   <div className="flex items-center gap-2 text-sm font-medium">
                      <Cpu className="h-5 w-5 text-primary" /> IA de Pointe
                   </div>
                   <div className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="h-5 w-5 text-primary" /> +40% Productivité
                   </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section className="py-32 px-6 relative">
          <div className="container max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="bg-black/60 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-6 sm:p-12 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-purple-500/10 pointer-events-none" />

              {/* Browser Header */}
              <div className="flex items-center gap-3 mb-8 px-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/20"></div>
                  <div className="w-3 h-3 rounded-full bg-white/20"></div>
                  <div className="w-3 h-3 rounded-full bg-white/20"></div>
                </div>
                <div className="flex-1 max-w-md mx-auto bg-white/5 rounded-full h-8 flex items-center justify-center border border-white/10">
                  <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase">system.deepflow.app</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors">
                  <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Focus Score</div>
                  <div className="text-6xl font-bold text-primary mb-2">94%</div>
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <Zap className="h-4 w-4" /> Performance Optimale
                  </div>
                </div>
                
                <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="text-white/40 text-xs font-bold uppercase tracking-widest">Tâches Intelligentes</div>
                    <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { t: "Architecture Vision 2026", p: "Urgent", c: "bg-red-500/20 text-red-400" },
                      { t: "Optimisation des Flux Cognitifs", p: "IA", c: "bg-primary/20 text-primary" },
                      { t: "Deep Work Session (2h)", p: "Focus", c: "bg-purple-500/20 text-purple-400" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                        <div className="h-5 w-5 rounded-full border-2 border-white/20 group-hover:border-primary transition-colors" />
                        <span className="text-sm font-medium text-white/80">{item.t}</span>
                        <span className={`ml-auto text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${item.c}`}>
                          {item.p}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Persuasion Section */}
        <section className="py-40 px-6">
          <div className="container max-w-5xl mx-auto">
            <div className="text-center mb-32">
              <h2 className="text-5xl md:text-7xl font-bold mb-10 leading-[1] tracking-tight">
                Éliminez la <br />
                <span className="text-white/30 italic">friction cognitive.</span>
              </h2>
              <p className="text-xl text-white/60">
                Chaque minute de distraction est une opportunité perdue. Votre temps est votre ressource la plus précieuse.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-12 hover:bg-white/5 transition-all group duration-500">
                <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform border border-primary/20">
                  <Brain className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Videz votre charge mentale</h3>
                <p className="text-white/60 leading-relaxed">
                  Arrêtez de gaspiller de l'énergie à vous souvenir. Notre IA gère la complexité pour que votre cerveau reste libre pour la création.
                </p>
              </div>

              <div className="bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-12 hover:bg-white/5 transition-all group duration-500">
                <div className="h-16 w-16 rounded-3xl bg-purple-500/10 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform border border-purple-500/20">
                  <Clock className="h-7 w-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Gagnez 5h par semaine</h3>
                <p className="text-white/60 leading-relaxed">
                  En éliminant l'indécision et les frictions organisationnelles, nos utilisateurs retrouvent en moyenne une demi-journée de liberté par semaine.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Motivation CTA */}
        <section className="py-32 px-6">
          <div className="container max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-primary/40 to-purple-600/40 backdrop-blur-3xl border border-white/20 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-7xl font-bold mb-8">
                  Devenez inarrêtable.
                </h2>
                <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto font-medium">
                  Rejoignez l'élite qui a déjà choisi de transformer son chaos en avantage compétitif.
                </p>
                <Link to="/register">
                  <Button
                    size="lg"
                    className="h-20 px-16 text-2xl font-black rounded-full bg-white text-black hover:bg-white/90 shadow-2xl transition-all hover:scale-110 active:scale-95"
                  >
                    Ouvrir mon accès gratuit
                  </Button>
                </Link>
                <p className="mt-8 text-white/50 text-sm font-medium">
                  Installation en 30 secondes • Sans engagement • Gratuit pour toujours
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 px-6">
        <div className="container max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-60">
            <img src={deepflowLogo} alt="DeepFlow Logo" className="h-6 w-6 grayscale" />
            <span className="text-lg font-bold tracking-tight">DeepFlow</span>
          </div>
          <p className="text-sm text-white/40 font-medium">
            &copy; {new Date().getFullYear()} DeepFlow Engineering. Tous droits réservés.
          </p>
          <div className="flex gap-8 text-sm font-medium text-white/40">
            <Link to="/legal/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link to="/legal/terms" className="hover:text-white transition-colors">Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
