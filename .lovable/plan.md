

# Plan: Refonte Apple Liquid Glass de la page Intelligence IA

## Constat actuel
La page `AIAssistant.tsx` (339 lignes) fonctionne mais manque de polish : header dense, chat container basique, empty state peu inspirant, toolbar encombrée avec des switches peu lisibles, pas de quick actions pour guider l'utilisateur.

## Changements prévus

### 1. Header repensé
- Icône IA dans un cercle glassmorphique animé (gradient subtil tournant)
- Credits badge plus élégant avec micro-animation pulse
- Premium badge intégré plus discrètement

### 2. Tabs Apple segmented control
- Remplacer le `TabsList` actuel par un vrai segmented control iOS : `bg-secondary/50 p-1 rounded-2xl`, triggers avec `rounded-xl` et transition spring sur l'indicateur actif
- 3 onglets : 💬 Chat · 📊 Analyse · 🧠 Profil IA

### 3. Chat — refonte complète

**Empty state inspirant** :
- Grande icône Bot dans un cercle glassmorphique avec gradient animé
- 3 suggestion chips cliquables en dessous ("Analyse ma semaine", "Que faire maintenant ?", "Crée-moi un plan") qui pré-remplissent l'input
- Texte d'accueil plus court et percutant

**Toolbar simplifiée** :
- Remplacer les 2 switches par 3 mode pills cliquables (Discussion / Analyse / Création) dans une barre compacte `rounded-full`
- Le mode actif a un fond `bg-primary text-primary-foreground`
- Bouton effacer en icône seule à droite

**Bulles de message améliorées** :
- User : `bg-primary rounded-2xl rounded-br-md` (coin bas-droit carré, style iMessage)
- Assistant : `bg-card/80 backdrop-blur-sm border-border/30 rounded-2xl rounded-bl-md`
- Avatar assistant : cercle avec gradient primary, icône Bot
- Timestamps plus discrets, apparaissent au hover uniquement

**Input bar** :
- Style Apple Messages : `bg-secondary/50 border-0 rounded-2xl` avec bouton Send intégré dans le champ (pas séparé)
- Compteur de crédits en micro-badge discret sous l'input

**Loading state** :
- Typing indicator avec 3 dots animés dans une bulle glassmorphique (déjà fait, affiner le style)

### 4. Quick Actions (nouveau)
- Barre de 4 boutons rapides au-dessus de l'input quand la conversation est vide :
  - "📊 Analyse ma semaine"
  - "🎯 Que faire maintenant ?"
  - "✨ Crée un plan"
  - "💡 Conseils personnalisés"
- Chaque bouton est une pill `bg-card/80 backdrop-blur-sm border-border/30 rounded-full` avec hover scale

## Fichier modifié

| Fichier | Action |
|---------|--------|
| `src/pages/AIAssistant.tsx` | Réécriture UI complète — même logique, nouveau design |

La logique métier (sendMessage, getUserData, modes, localStorage) reste identique. Seul le rendu JSX change.

