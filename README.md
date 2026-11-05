# Deepflow

PWA de travail personnel et étudiant : tâches, objectifs, habitudes, journal, concentration, semestre universitaire, Google Calendar / Tasks et assistant IA à crédits vérifiés par le serveur.

Cette refonte part du dépôt **lsapk/gemini-flow-pwa**, commit `147390a`, sur la branche `codex/deepflow-modernization`. La copie de travail se trouve dans `.worktrees/deepflow-current` de l’ancien dossier local, qui a été conservé. Exécuter les commandes ci-dessous **dans cette nouvelle copie**.

## Démarrer

Node.js 24 et npm sont nécessaires. Sous PowerShell, utiliser `npm.cmd` si la stratégie d’exécution bloque `npm.ps1`.

```powershell
cd C:\Users\user\gemini-flow-pwa\.worktrees\deepflow-current
npm.cmd ci
# Créer .env.local à partir de .env.example, puis renseigner le projet souhaité.
npm.cmd run dev
```

L’application démarre sur `http://127.0.0.1:8080`. `/preview` présente une interface avec des **données d’exemple explicitement signalées**, sans accès à un compte. Les autres espaces nécessitent une session Supabase.

Variables publiques : `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` (ou `VITE_SUPABASE_ANON_KEY` pour une ancienne clé publique). Vite publie toutes les variables `VITE_` : ne jamais y placer un secret Gemini, Google, Stripe ou une clé Supabase `service_role`. L’absence de configuration affiche une erreur et ne redirige pas les données vers un projet codé en dur.

## Parcours disponibles

- **Études** : établissement libre, année et semestre, UE, coefficients, ECTS planifiés, notes pondérées, examens et échéances reliées aux tâches, import ICS avec aperçu, export JSON de tous les semestres. Des liens officiels Lyon 1 sont proposés ; aucun identifiant ENT n’est demandé.
- **Organisation** : recherche et tri des tâches, sous-tâches, objectifs, habitudes, journal et statistiques provenant des données enregistrées. Le minuteur utilise une échéance persistante et permet de réessayer un enregistrement interrompu.
- **Google** : OAuth géré côté serveur, choix de l’agenda et de la liste, actions explicites sur le calendrier et transferts de tâches. La connexion nécessite la configuration du projet Google et le déploiement des fonctions correspondantes.
- **IA** : demandes manuelles, coût affiché, quota commun aux différents points d’entrée et réservation atomique. Le journal est exclu du contexte par défaut. Les statistiques courantes ne déclenchent pas d’appel IA payant.
- **Confidentialité** : export des données, déconnexion Google, thèmes clair/sombre/système, réduction des animations, cache PWA limité aux fichiers publics.

Les notes restent des estimations personnelles. Les règles de compensation et de validation d’une formation ne sont pas déduites des ECTS. L’ICS n’est pas une connexion CAS/ENT et les récurrences non prises en charge sont refusées explicitement, sans import partiel. Le mode hors connexion permet d’afficher l’interface ; il ne promet pas de synchronisation des modifications privées.

## Backend et mise en service

Le projet Supabase identifié dans le compte **Leny.grivel** est `xzgdfetnjnwrberyddmf`. Son schéma et ses avis de sécurité ont été consultés en lecture seule. **Les corrections locales ne modifient pas automatiquement ce projet.**

Lire le [plan de mise en service](docs/mise-en-service.md) avant d’appliquer les nouvelles migrations. Les migrations historiques du dépôt ne constituent pas un bootstrap complet et ne doivent pas être rejouées aveuglément sur la base existante.

- [Audit et correctifs de sécurité](docs/security-audit.md)
- [Configuration Google et limites des tests](docs/google-integration.md)
- [Fonctionnement de l’espace étudiant](docs/student-workspace.md)
- [Bilan de vérification](docs/refonte-validation.md)
- [.env.functions.example](.env.functions.example) : noms des paramètres serveur, sans secrets réels

Les achats réels, l’envoi d’emails et la connexion Google ne sont pas simulés comme des succès si leur configuration manque. Les anciennes voies d’administration, d’octroi de crédits ou d’API développeur qui ne satisfont pas les contrôles de sécurité sont fermées ; consulter l’audit pour le détail.

## Vérifier

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd audit --audit-level=high
npm.cmd run test:e2e
```

Les tests SQL utilisent PostgreSQL embarqué via PGlite. Les tests navigateur utilisent un backend local intercepté et un build isolé `.browser-dist`. Ils ne contactent pas les comptes Google, Gemini, Stripe ou les données Supabase de production. Sous Windows, Chrome installé est utilisé ; sur Linux, installer Chromium avec `npx playwright install --with-deps chromium`.

La CI applique ces contrôles aux PR et aux branches `main` et `codex/**`. Les tests avec services externes réels et la validation des migrations sur une copie de la base restent nécessaires avant mise en production.
