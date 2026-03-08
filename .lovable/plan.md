
# Plan : Credits Admin, Logo, Fond Auth, Parametres, Legal

## 1. Credits Admin - Fonctionnel pour credits IA ET jeu

**Probleme actuel :** La fonction `handleGiveCredits` dans `Admin.tsx` (ligne 315-347) modifie uniquement les credits **de jeu** dans `player_profiles.credits`, mais pas les **credits IA** dans la table `ai_credits`. L'admin n'a aucun moyen de gerer les credits IA des utilisateurs.

**Solution :**
- Modifier le dialog de credits admin pour offrir **2 onglets** : "Credits Jeu" et "Credits IA"
- Ajouter une fonction `handleGiveAICredits` qui insere/met a jour la table `ai_credits`
- La fonction existante `handleGiveCredits` reste pour les credits de jeu
- Afficher dans le profil utilisateur les 2 types de credits (jeu + IA)

**Fichier :** `src/pages/Admin.tsx`

---

## 2. Changement du logo

**Situation actuelle :** Le logo utilise `src/assets/deepflow-logo.jpg` dans la Sidebar et le MobileHeader. Les pages Login/Register/ForgotPassword utilisent des icones Lucide (`Zap`, `Sparkles`) au lieu du vrai logo.

**Solution :**
- Copier l'image du "D" brush (image-5.png) vers `src/assets/deepflow-logo.png`
- Remplacer la reference dans `Sidebar.tsx` et `MobileHeader.tsx`
- Le logo a un fond blanc, donc pour le theme sombre : ajouter `rounded-xl` avec un fond transparent et une ombre pour bien integrer
- Mettre a jour les pages Login, Register et ForgotPassword pour utiliser le nouveau logo au lieu des icones Lucide
- Ajouter un filtre CSS `dark:invert` sur le logo pour qu'il s'adapte au theme sombre (le "D" noir passe en blanc)

**Fichiers :** `src/components/layout/Sidebar.tsx`, `src/components/layout/MobileHeader.tsx`, `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/ForgotPassword.tsx`

---

## 3. Image de fond pour les pages de connexion/inscription

**Situation actuelle :** Les pages Login, Register, ForgotPassword ont un fond abstrait avec des gradients et un motif de grille. Aucune image de fond.

**Solution :**
- Copier l'image de l'oeil bleu (1770368575206~2_1.jpg) vers `public/images/auth-bg.jpg` (dans public car c'est utilise en CSS)
- Ajouter l'image en arriere-plan sur les pages Login, Register, ForgotPassword et ResetPassword
- L'image sera affichee en `cover` avec un overlay sombre semi-transparent pour la lisibilite
- Le formulaire restera au centre avec l'effet glassmorphism par-dessus

**Fichiers :** `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/ForgotPassword.tsx`, `src/pages/ResetPassword.tsx`

---

## 4. Photo de profil et preferences qui fonctionnent

### Photo de profil zoomee
**Probleme :** L'avatar dans `ProfileEditForm.tsx` utilise `<AvatarImage>` qui applique `object-cover` par defaut dans Radix. La photo apparat zoomee car le composant `Avatar` fait 96x96px (`h-24 w-24`) et force un recadrage.

**Solution :**
- Ajouter `className="object-cover"` sur `AvatarImage` pour s'assurer du bon cadrage
- Verifier que le composant Avatar de Radix n'a pas de styles conflictuels
- Dans le profil Settings (ligne 234), la photo de l'utilisateur est un simple cercle avec l'initiale -- il faut aussi y afficher la photo si elle existe

### Theme sombre/clair pour les 2 designs
**Probleme actuel :** Le `ThemeProvider` utilise `next-themes` (dans `App.tsx` ligne 68) mais le Settings utilise le `useTheme` de `@/components/theme-provider` local (ligne 13). Ces deux providers sont differents -- l'un vient de `next-themes`, l'autre du composant local. Il y a conflit.

**Solution :** 
- L'import dans `App.tsx` utilise `import { ThemeProvider } from "next-themes"` 
- L'import dans Settings utilise `import { useTheme } from "@/components/theme-provider"` qui est un provider **different** jamais rendu dans l'arbre
- Corriger Settings pour utiliser `useTheme` de `next-themes` directement
- Le composant local `theme-provider.tsx` est redondant -- on le garde mais on s'assure que Settings utilise le bon provider

### Notifications et Ne pas deranger
**Probleme :** Les switches changent le state local mais l'utilisateur doit cliquer "Sauvegarder les preferences" separement. 

**Solution :** Faire un auto-save quand un switch change (debounce de 500ms), avec confirmation toast immediate.

**Fichiers :** `src/components/settings/ProfileEditForm.tsx`, `src/pages/Settings.tsx`

---

## 5. Section legale dans les Parametres

**Situation actuelle :** Les pages legales existent (`/legal/privacy`, `/legal/terms`, `/legal/cookies`) mais ne sont pas accessibles depuis les Parametres. Le Footer existe mais il n'est pas visible dans l'app connectee. L'email de contact est `contact@deepflow.app` au lieu de `deepflow.ia@gmail.com`.

**Solution :**
- Ajouter un **4eme onglet** dans Settings : "A propos" avec une icone `Info`
- Contenu de ce tab :
  - **Mentions legales** : editeur, hebergeur, email de contact
  - **Liens rapides** : Privacy, Terms, Cookies (vers les pages existantes)
  - **FAQ** basique (5-6 questions/reponses les plus courantes dans un Accordion)
  - **Nous contacter** : afficher deepflow.ia@gmail.com avec un bouton copier/mailto
  - **Version de l'app** (badge)
- Mettre a jour le Footer avec `deepflow.ia@gmail.com`
- Mettre a jour les pages legales (Privacy, Terms, Cookies) avec la bonne adresse email

**Fichiers :** `src/pages/Settings.tsx`, `src/components/layout/Footer.tsx`, `src/pages/legal/Privacy.tsx`, `src/pages/legal/Terms.tsx`, `src/pages/legal/Cookies.tsx`

---

## Details Techniques

### Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `src/pages/Admin.tsx` | Ajouter gestion credits IA (table `ai_credits`) + tabs dans le dialog |
| `src/assets/deepflow-logo.png` | **NOUVEAU** - Copie de image-5.png |
| `public/images/auth-bg.jpg` | **NOUVEAU** - Copie de l'image oeil bleu |
| `src/components/layout/Sidebar.tsx` | Nouveau logo avec gestion theme |
| `src/components/layout/MobileHeader.tsx` | Nouveau logo avec gestion theme |
| `src/pages/Login.tsx` | Nouveau logo + image de fond |
| `src/pages/Register.tsx` | Nouveau logo + image de fond |
| `src/pages/ForgotPassword.tsx` | Nouveau logo + image de fond |
| `src/pages/ResetPassword.tsx` | Image de fond |
| `src/components/settings/ProfileEditForm.tsx` | Fix photo zoomee |
| `src/pages/Settings.tsx` | Fix theme provider, auto-save preferences, nouvel onglet "A propos" avec FAQ/Legal/Contact |
| `src/components/layout/Footer.tsx` | Email mis a jour |
| `src/pages/legal/Privacy.tsx` | Email mis a jour |
| `src/pages/legal/Terms.tsx` | Email mis a jour |
| `src/pages/legal/Cookies.tsx` | Email mis a jour |

### Ordre d'implementation

| Etape | Modification | Impact |
|-------|-------------|--------|
| 1 | Copier les 2 images (logo + fond) | Prerequis pour tout le reste |
| 2 | Mettre a jour le logo (Sidebar, MobileHeader, pages auth) | Branding |
| 3 | Ajouter image de fond aux pages auth | Visuel |
| 4 | Fix credits admin (IA + jeu) | Fonctionnel |
| 5 | Fix theme provider dans Settings | Fonctionnel |
| 6 | Fix photo profil + auto-save preferences | UX |
| 7 | Ajouter onglet "A propos" + mettre a jour emails | Legal |

### Credits Admin - Detail technique

Dans le dialog de credits (`Admin.tsx` lignes 843-879), ajouter un systeme a 2 types :

```typescript
// Nouveau state
const [creditType, setCreditType] = useState<'game' | 'ai'>('game');

// Nouvelle fonction pour credits IA
const handleGiveAICredits = async () => {
  if (!creditsUser || creditsAmount === 0) return;
  
  const { data: existing } = await supabase
    .from("ai_credits")
    .select("credits")
    .eq("user_id", creditsUser.id)
    .maybeSingle();
  
  const newCredits = Math.max(0, (existing?.credits || 0) + creditsAmount);
  
  if (existing) {
    await supabase.from("ai_credits")
      .update({ credits: newCredits })
      .eq("user_id", creditsUser.id);
  } else {
    await supabase.from("ai_credits")
      .insert({ user_id: creditsUser.id, credits: newCredits });
  }
  
  await logAction("modify_ai_credits", ...);
};
```

### Fix Theme - Detail technique

Le probleme est que `App.tsx` utilise `import { ThemeProvider } from "next-themes"` mais `Settings.tsx` importe `useTheme` depuis `@/components/theme-provider` qui est un provider local jamais monte dans l'arbre de composants.

**Solution :** Changer l'import dans Settings.tsx :
```typescript
// Avant
import { useTheme } from "@/components/theme-provider";
// Apres
import { useTheme } from "next-themes";
```

### FAQ - Contenu

Questions prevues pour la FAQ :
1. Comment fonctionne DeepFlow ?
2. Qu'est-ce que les credits IA ?
3. Comment gagner des credits de jeu ?
4. Mes donnees sont-elles securisees ?
5. Comment contacter le support ?
6. Puis-je utiliser DeepFlow hors ligne ?
