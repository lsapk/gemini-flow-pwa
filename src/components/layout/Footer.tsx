import { Link } from "react-router-dom";
import { Mail, Github, Twitter } from "lucide-react";
import deepflowLogo from "@/assets/deepflow-logo.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={deepflowLogo} alt="DeepFlow" className="h-8 w-8 rounded-lg object-contain bg-white/90 dark:bg-white/10 dark:invert p-0.5" />
              <span className="font-heading font-bold text-xl">DeepFlow</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Productivité augmentée par l'intelligence artificielle. Atteignez vos objectifs avec des outils intelligents.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Produit</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/register" className="text-muted-foreground hover:text-primary transition-colors">Commencer gratuitement</Link></li>
              <li><Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">Connexion</Link></li>
              <li><span className="text-muted-foreground/50 cursor-not-allowed">Tarifs (bientôt)</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Légal</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/legal/privacy" className="text-muted-foreground hover:text-primary transition-colors">Politique de confidentialité</Link></li>
              <li><Link to="/legal/terms" className="text-muted-foreground hover:text-primary transition-colors">Conditions d'utilisation</Link></li>
              <li><Link to="/legal/cookies" className="text-muted-foreground hover:text-primary transition-colors">Politique des cookies</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="mailto:deepflow.ia@gmail.com" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />deepflow.ia@gmail.com
                </a>
              </li>
              <li>
                <a href="https://github.com/deepflow" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Github className="w-4 h-4" />GitHub
                </a>
              </li>
              <li>
                <a href="https://twitter.com/deepflow" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Twitter className="w-4 h-4" />Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© {currentYear} DeepFlow. Tous droits réservés.</p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>🇫🇷 Made in France</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>Tous les systèmes opérationnels</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
