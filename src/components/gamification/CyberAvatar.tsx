import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Shield } from "lucide-react";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";

const AVATAR_TYPES = {
  cyber_knight: { icon: "🤖", name: "Cyber Knight", color: "from-blue-500 to-cyan-500" },
  neon_hacker: { icon: "👾", name: "Neon Hacker", color: "from-pink-500 to-purple-500" },
  quantum_warrior: { icon: "⚛️", name: "Quantum Warrior", color: "from-green-500 to-teal-500" },
};

const HELMET_OPTIONS = ["default", "visor", "hood", "crown"];
const ARMOR_OPTIONS = ["default", "heavy", "stealth", "energy"];
const GLOW_COLORS = ["#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export const CyberAvatar = () => {
  const { profile, updateAvatar } = usePlayerProfile();
  const [isCustomizing, setIsCustomizing] = useState(false);

  if (!profile) return null;

  const avatar = AVATAR_TYPES[profile.avatar_type as keyof typeof AVATAR_TYPES] || AVATAR_TYPES.cyber_knight;

  return (
    <Card className="glass-morphism p-6 relative overflow-hidden group">
      {/* Animated background */}
      <div 
        className="absolute inset-0 opacity-20 animate-pulse"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${profile.avatar_customization.glow_color}, transparent 70%)`
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-heading gradient-text mb-1">
              {avatar.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              Niveau {profile.level}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="border-primary/30"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Personnaliser
          </Button>
        </div>

        {/* Avatar Display */}
        <div className="flex justify-center mb-6">
          <div 
            className="relative w-32 h-32 rounded-full flex items-center justify-center text-6xl transition-all duration-300 hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${profile.avatar_customization.glow_color}40, ${profile.avatar_customization.glow_color}10)`,
              boxShadow: `0 0 40px ${profile.avatar_customization.glow_color}60`,
            }}
          >
            <div className="animate-float">
              {avatar.icon}
            </div>
            
            {/* Animated ring */}
            <div 
              className="absolute inset-0 rounded-full border-2 animate-spin"
              style={{ 
                borderColor: `${profile.avatar_customization.glow_color}40`,
                borderTopColor: profile.avatar_customization.glow_color,
                animationDuration: "3s"
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-background/40 backdrop-blur">
            <div className="text-sm text-muted-foreground">XP</div>
            <div className="font-heading text-primary">{profile.experience_points}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/40 backdrop-blur">
            <div className="text-sm text-muted-foreground">Quêtes</div>
            <div className="font-heading text-success">{profile.total_quests_completed}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/40 backdrop-blur">
            <div className="text-sm text-muted-foreground">Crédits</div>
            <div className="font-heading text-info">{profile.credits}</div>
          </div>
        </div>

        {/* Customization Panel */}
        {isCustomizing && (
          <div className="space-y-4 mt-4 pt-4 border-t border-border/50 animate-fade-in">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Casque</label>
              <div className="flex gap-2">
                {HELMET_OPTIONS.map((helmet) => (
                  <Button
                    key={helmet}
                    variant={profile.avatar_customization.helmet === helmet ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateAvatar({ helmet })}
                    className="text-xs"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {helmet}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Armure</label>
              <div className="flex gap-2">
                {ARMOR_OPTIONS.map((armor) => (
                  <Button
                    key={armor}
                    variant={profile.avatar_customization.armor === armor ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateAvatar({ armor })}
                    className="text-xs"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    {armor}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Couleur Néon</label>
              <div className="flex gap-2">
                {GLOW_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateAvatar({ glow_color: color })}
                    className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: profile.avatar_customization.glow_color === color ? "#fff" : "transparent",
                      boxShadow: profile.avatar_customization.glow_color === color ? `0 0 20px ${color}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};