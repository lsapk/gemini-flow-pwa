# Mise en service de la refonte

Base de code : `lsapk/gemini-flow-pwa@147390a`. Projet constaté en lecture seule : `xzgdfetnjnwrberyddmf`, compte Leny.grivel. Aucune migration, modification Auth ou fonction corrigée n’a été appliquée à ce projet pendant la préparation locale.

## Ordre de déploiement

1. Sauvegarder la base existante et créer un environnement de préproduction reflétant son schéma. Vérifier la provenance des rôles administrateur et les correspondances clients/abonnements Stripe existantes.
2. Comparer les trois **nouvelles** migrations à ce schéma : `20261103202440_harden_backend_and_ai_credits.sql`, `20261103202443_student_workspace.sql`, `20261103202446_google_connections.sql`. Tester leur application dans cet ordre. Ne pas lancer un `db push` aveugle : les historiques local et distant diffèrent et les anciens fichiers supposent des tables préexistantes.
3. Configurer les secrets serveur indiqués dans `.env.functions.example`. Définir l’origine de production exacte dans `APP_URL` et `ALLOWED_ORIGINS`. Garder les secrets hors du build frontend. Choisir explicitement le modèle Gemini et les produits/prix réels ; le solde affiché ne constitue pas une confirmation de paiement.
4. Déployer les fonctions corrigées avec les réglages JWT de `supabase/config.toml`. Le callback Google et les webhooks vérifient eux-mêmes leur protocole ; les routes privées vérifient l’utilisateur. Déployer également les réponses de fermeture des anciens endpoints décrits dans l’audit, car une ancienne fonction distante resterait accessible même si son bouton frontend disparaît.
5. Configurer le client OAuth Google, les URI exactes de callback, les API Calendar et Tasks et l’écran de consentement selon [le guide Google](google-integration.md). Reconnecter les anciens comptes pour autoriser les nouveaux périmètres. Choisir explicitement les serveurs universitaires autorisés pour `ical-proxy`, ou conserver l’import de fichiers seul.
6. Configurer Supabase Auth : URL du site et redirections de confirmation/récupération de mot de passe, SMTP, confirmation email. Réduire l’expiration OTP signalée par les advisors et activer la protection contre les mots de passe divulgués si le plan le permet. Les changements du fichier TOML sont des valeurs locales, pas des réglages appliqués au service hébergé.
7. Déployer le frontend après disponibilité du backend. Vérifier inscription/confirmation/récupération/déconnexion, changement de compte sans données résiduelles, accès direct aux routes, import/export étudiant et création de tâche de révision.

## Vérifications avec les fournisseurs

- Google : connexion sur le domaine final, refus de consentement, renouvellement après expiration du jeton, déconnexion/révocation, création/modification/suppression d’un événement personnel et conflits, tâches terminées/réouvertes et reprises après interruption. Ne pas utiliser un agenda partagé sensible pour le premier test.
- IA : succès réel, absence de clé/modèle, dépassement de quota, échec fournisseur et remboursement, demandes concurrentes via plusieurs sessions PostgreSQL. Vérifier les conditions de traitement du compte fournisseur utilisé avant de transmettre des données personnelles.
- Stripe : mode test, prix autorisés, signature invalide, événement rejoué ou reçu dans le désordre, abonnement expiré et annulation, checkout et portail. Réconcilier les anciens abonnements légitimes avant d’ouvrir les offres payantes.
- Base : relancer les advisors et vérifier les grants/RLS sur toutes les tables privées et les fonctions conservées. Les tests embarqués couvrent des schémas représentatifs ; ils ne garantissent pas une migration sans intervention de toute la base historique.
- PWA : installation, mise à jour d’un ancien service worker, mode avion et déconnexion. Aucune réponse privée ne doit apparaître dans Cache Storage.

## Points du projet hébergé encore ouverts

Les advisors ont signalé une expiration OTP excessive, la protection des mots de passe divulgués désactivée et une version PostgreSQL disposant de correctifs. Ces réglages et une mise à niveau nécessitent une intervention sur le projet hébergé ; ils ne sont pas corrigés par le CSS ou les tests locaux.

Références : [sécurité Auth Supabase](https://supabase.com/docs/guides/auth/password-security), [préparation production](https://supabase.com/docs/guides/platform/going-into-prod#security), [mise à niveau PostgreSQL](https://supabase.com/docs/guides/platform/upgrading).
