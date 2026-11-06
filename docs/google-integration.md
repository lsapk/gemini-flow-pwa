# Google Calendar et Google Tasks

Le code de `/connections` et `/calendar` utilise les API Google Calendar et Tasks. Connexions affiche les 14 prochains jours et transfère les tâches sur demande ; Calendrier permet de parcourir les semaines et de créer, modifier ou supprimer des événements personnels. L’activation réelle nécessite les migrations, les fonctions déployées et les identifiants OAuth décrits ci-dessous. Les tests locaux simulent les frontières réseau ; aucun compte Google réel n’a été connecté pendant cette refonte.

## Préparer Google Cloud

Sur le projet Deepflow `xzgdfetnjnwrberyddmf`, la vérification du 6 novembre 2026 a confirmé l’absence de `google-api`, de `google-oauth` et du stockage `google_private`. Reconnecter un compte dans l’interface ne peut pas corriger cette situation. Après les réglages ci-dessous, appliquer [la migration Google](../supabase/migrations/20261103202446_google_connections.sql) sur le projet cible et déployer les deux fonctions du dépôt depuis la branche de refonte.

1. Créer ou sélectionner un projet Google Cloud, puis activer **Google Calendar API** et **Google Tasks API** dans la bibliothèque des API.
2. Configurer l’écran de consentement Google Auth Platform : nom Deepflow, adresse de support, domaine de l’application, politique de confidentialité et audience. En mode de test, ajouter chaque compte de test à la liste autorisée.
3. Créer un client OAuth de type **Application Web**. Renseigner l’URI de redirection exacte :

   ```text
   https://<project-ref>.supabase.co/functions/v1/google-oauth/callback
   ```

   Pour le projet Deepflow, inscrire exactement `https://xzgdfetnjnwrberyddmf.supabase.co/functions/v1/google-oauth/callback` dans les URI de redirection autorisés du client.

   Pour Supabase local, l’URI correspondante est `http://127.0.0.1:54321/functions/v1/google-oauth/callback`. Utiliser le même nom d’hôte pendant tout le parcours : le cookie de sécurité est lié à cet hôte.

4. Ajouter les portées suivantes à l’écran de consentement :

   ```text
   openid
   email
   https://www.googleapis.com/auth/calendar.calendarlist.readonly
   https://www.googleapis.com/auth/calendar.events
   https://www.googleapis.com/auth/tasks
   ```

   L’identité Google sert à afficher le compte connecté et à isoler les correspondances de tâches lorsqu’une personne change de compte. La liste des agendas reste en lecture seule ; la portée `calendar.events` autorise les modifications explicites d’événements. Tasks nécessite l’accès en écriture pour créer une tâche ou modifier son état terminé. Les connexions déjà autorisées uniquement avec `calendar.events.readonly` restent consultables ; l’interface demande une nouvelle autorisation avant toute modification.

5. Avant une ouverture publique, suivre les exigences de vérification des portées sensibles de Google. Une application externe encore en mode Testing peut recevoir des jetons d’actualisation expirant après sept jours. Un administrateur Google Workspace peut aussi bloquer l’accès aux API.

Références : [OAuth pour applications serveur](https://developers.google.com/identity/protocols/oauth2/web-server), [bonnes pratiques OAuth](https://developers.google.com/identity/protocols/oauth2/resources/best-practices), [OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect), [portées Calendar](https://developers.google.com/workspace/calendar/api/auth), [API Google Tasks](https://developers.google.com/workspace/tasks/reference/rest).

## Configurer le serveur

Les variables suivantes sont des secrets **Supabase Edge Functions**. Elles ne doivent jamais porter le préfixe `VITE_` ni être stockées dans Git.

| Variable                      | Valeur                                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `APP_URL`                     | Origine exacte de Deepflow, par exemple `https://deepflow.example` ou `http://localhost:8080`. Aucun chemin, paramètre ou fragment. |
| `GOOGLE_CLIENT_ID`            | ID du client OAuth Web Google.                                                                                                      |
| `GOOGLE_CLIENT_SECRET`        | Secret du même client.                                                                                                              |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | Clé aléatoire de 32 octets encodée en base64.                                                                                       |
| `SUPABASE_URL`                | Fournie automatiquement par Supabase.                                                                                               |
| `SUPABASE_SERVICE_ROLE_KEY`   | Fournie automatiquement par Supabase ; reste exclusivement côté serveur.                                                            |

Générer une clé localement avec Node, puis la saisir dans le gestionnaire de secrets :

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Conserver une sauvegarde sécurisée de cette clé. La remplacer directement rend les anciens jetons indéchiffrables. Pour une rotation, déconnecter/révoquer les comptes avant le remplacement ou prévoir un processus explicite de rechiffrement.

Appliquer la migration Google contenue dans `supabase/migrations` après les migrations des tables de l’application. Elle crée le schéma non exposé `google_private` et la seule façade `public.google_store`, exécutable par `service_role` uniquement. Ne pas exposer `google_private` dans les paramètres Data API et ne pas accorder son accès aux rôles `anon` ou `authenticated`.

Déployer les deux nouvelles fonctions après configuration. Le fichier `supabase/config.toml` doit contenir :

```toml
[functions.google-oauth]
verify_jwt = false

[functions.google-api]
verify_jwt = true
```

Depuis la copie de la branche `codex/deepflow-modernization`, avec la CLI Supabase connectée au compte qui gère ce projet, déployer les fonctions avec ces commandes PowerShell :

```powershell
npm.cmd exec -- supabase functions deploy google-api --project-ref xzgdfetnjnwrberyddmf
npm.cmd exec -- supabase functions deploy google-oauth --project-ref xzgdfetnjnwrberyddmf --no-verify-jwt
```

Ouvrir ensuite Deepflow depuis l’origine renseignée dans `APP_URL`, se connecter au compte Deepflow, puis choisir **Connexions → Connecter Google**. En cas de `redirect_uri_mismatch`, comparer le callback exact de l’étape 3 avec celui du client OAuth Google.

`google-oauth` doit recevoir les redirections de Google sans JWT. Son action POST `start` vérifie elle-même la session avec `auth.getUser()`. Ses routes GET n’autorisent aucun accès aux tâches Deepflow. `google-api` vérifie également le JWT utilisateur côté serveur pour toutes les actions. Voir [autorisation des fonctions Supabase](https://supabase.com/docs/guides/functions/auth-headers).

Déployer également les remplacements des quatre anciennes fonctions `google-calendar-oauth`, `google-tasks-oauth`, `google-calendar-api` et `google-tasks-api` : les anciens gestionnaires OAuth répondent désormais **410** sans échanger de code ; les anciens noms API chargent le gestionnaire sécurisé et rejettent les anciennes actions incompatibles. La migration de durcissement retire les accès navigateur aux anciennes tables et vues de jetons. Les anciens jetons en clair ne sont pas copiés : reconnecter les comptes avec le nouveau parcours, révoquer l’ancienne autorisation Google et supprimer les jetons historiques après validation de la reprise. Une modification du code local ne désactive pas à elle seule les anciennes fonctions déjà déployées.

Le frontend n’a besoin que des variables Supabase publiques habituelles (`VITE_SUPABASE_URL` et clé publique). Il n’envoie aucune requête Google lorsque Supabase n’est pas configuré. Aucun paramètre OAuth Google n’est requis dans le frontend. La connexion de compte Google pour les API est indépendante du fournisseur de connexion sociale Supabase Auth.

## Parcours de sécurité

1. Un utilisateur connecté lance la connexion. Le serveur crée un état aléatoire valable dix minutes, attaché à son identifiant Supabase, et un vérificateur PKCE chiffré. Seuls les condensats de l’état et du nonce sont persistés.
2. Le navigateur passe par `/google-oauth/authorize`, qui consomme le démarrage et pose un cookie `HttpOnly`, `SameSite=Lax`, `Secure` en HTTPS. Google reçoit un challenge PKCE S256.
3. Le callback compare le nonce du cookie et consomme atomiquement l’état (`DELETE … RETURNING`). Un état expiré ou déjà utilisé est refusé. Le code est échangé côté serveur, puis les portées réellement accordées et l’identité Google sont contrôlées.
4. Une autorisation chiffrée provisoire est stockée dix minutes. Le navigateur revient sur l’origine fixe `APP_URL` et finalise la connexion au moyen de sa session Deepflow actuelle. L’identifiant utilisateur doit correspondre à celui qui a démarré OAuth. Une URL de démarrage copiée dans un autre navigateur ne peut donc pas connecter le compte Google à une autre session Deepflow.
5. Les jetons d’accès et d’actualisation sont chiffrés en AES-256-GCM avec un IV aléatoire et un contexte lié à l’utilisateur et au compte Google. Aucun jeton Google ne sort vers le frontend, le stockage navigateur ou les journaux applicatifs. Le frontend efface immédiatement la clé de confirmation provisoire de son URL.

Les routes de retour sont fixes : aucun `redirectTo` fourni par le navigateur n’est accepté. CORS autorise seulement l’origine `APP_URL`. Les transferts, les renouvellements de jeton et la déconnexion sont sérialisés par utilisateur avec un verrou temporaire.

## Comportement des transferts

- **Consulter l’agenda** : lecture paginée des agendas accessibles et des événements récurrents développés. Connexions affiche 14 jours ; Calendrier affiche une semaine, du lundi au dimanche, et permet d’aller à une autre date. Le serveur limite chaque période à 93 jours et refuse les résultats trop volumineux plutôt que de les tronquer. Les horaires et le fuseau du navigateur sont affichés ; les événements sans heure restent des journées entières. Les échéances Deepflow sont chargées séparément avec pagination et ne sont pas exportées automatiquement.
- **Créer un événement** : choix explicite d’un agenda où le compte dispose d’un accès en écriture ; titre, notes, lieu, horaires ou journées entières. Le dernier jour choisi est inclus dans le formulaire puis converti en fin exclusive pour Google. Un identifiant de création stable par formulaire évite les doublons lorsqu’une réponse réseau est interrompue et que l’utilisateur réessaie sans fermer le formulaire. La clé reste en mémoire pendant la vie du formulaire ; après fermeture ou rechargement, vérifier l’agenda avant de recréer un événement dont la réponse était incertaine.
- **Modifier ou supprimer** : action manuelle avec contrôle de la version `ETag` via `If-Match`. Une modification concurrente produit une erreur visible et demande d’actualiser ; les changements Google ne sont pas écrasés silencieusement. Pour un événement récurrent développé, seule l’occurrence sélectionnée est modifiée ou supprimée. La suppression demande confirmation.
- **Invités et événements spéciaux** : lecture et lien vers Google uniquement ; le serveur refuse leurs modifications même si un client forge une requête. Le formulaire ne permet pas de créer une invitation, une visioconférence ou une série récurrente. Ces opérations restent disponibles dans Google. Voir [création d’événements](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert), [modifications conditionnelles](https://developers.google.com/workspace/calendar/api/guides/version-resources).
- **Importer depuis Google** : crée les nouvelles tâches et applique les changements Google aux tâches déjà liées. Le titre, les notes, la date d’échéance et l’état terminé sont transférés. Les changements Google remplacent ces champs locaux. Les tâches terminées ou masquées par les applications Google sont incluses explicitement.
- **Envoyer vers Google** : envoie les nouvelles tâches Deepflow et celles dont les champs transférés ont changé depuis le dernier transfert. Les tâches liées sont mises à jour ; elles ne sont pas recréées. Cette action peut remplacer les champs Google concernés. Pour conserver une modification effectuée dans Google, l’importer avant d’envoyer une modification locale.
- Chaque clic traite au plus **40 changements**, ou moins si le budget de temps de la requête est atteint. Le résultat indique le nombre restant. Relancer le même bouton jusqu’à zéro pour terminer un gros transfert. Les pages Google sont parcourues entièrement avant les écritures ; un dépassement de taille ou un délai ne produit pas de succès partiel masqué.
- Les correspondances sont isolées par utilisateur, identité Google et liste Google. Un marqueur stable dans les notes (`[deepflow:<user-id>:<task-id>]`) permet de retrouver une création Google réussie lorsqu’une écriture de correspondance a échoué. Ce marqueur ne contient aucun secret ; le conserver évite les doublons après une interruption.
- Les imports locaux et leur correspondance sont atomiques. Les changements déjà enregistrés restent acquis en cas d’erreur pendant un lot. Réessayer reprend les changements restants.
- Les échéances de Google Tasks sont des **dates sans heure**. Les priorités, objectifs liés, ordre et hiérarchie des sous-tâches ne sont pas transférés. Les tâches Google importées sont à plat ; les éléments de la table distincte `subtasks` ne sont pas exportés.
- Les suppressions ne se propagent pas. Supprimer une tâche dans Google ne supprime pas sa copie Deepflow ; supprimer une tâche Deepflow ne supprime pas sa copie Google. Les tâches attribuées depuis Docs/Chat restent modifiables dans leur application d’origine. Les modifications de ces tâches peuvent être refusées explicitement par le serveur.
- Les correspondances non secrètes sont conservées après une déconnexion, pour éviter les doublons à la reconnexion du même compte. Tous les jetons et demandes OAuth de l’utilisateur sont supprimés à la déconnexion. La suppression du compte Supabase supprime également toutes les données Google privées via les clés étrangères.
- Aucun transfert périodique, webhook ou synchronisation automatique en arrière-plan n’est installé. Un compte révoqué, une API désactivée, un quota Google ou une panne réseau donnent une erreur visible. La déconnexion demande la révocation Google ; si Google ne la confirme pas, elle reste en erreur pour permettre une nouvelle tentative.

## Vérifier avant activation

Les tests sans réseau s’exécutent avec Node 24 :

```powershell
node --experimental-strip-types --test supabase/functions/_shared/google-domain.test.ts
```

`npm test` inclut aussi les tests Google de base de données et les vrais gestionnaires OAuth/API, avec les appels réseau Google et Supabase Auth simulés et les RPC exécutées par PostgreSQL via PGlite. Ces tests couvrent les échecs de transfert, la reprise sans doublon, les lots, l’actualisation des jetons, la révocation, les anciennes connexions retirées, les dates invalides, les versions concurrentes et les créations d’événements idempotentes. Ils ne contactent aucun compte externe. `tests/browser/calendar.spec.ts` vérifie le formulaire réel, sa reprise après erreur, la modification et la suppression confirmée, avec serveur simulé.

Les assertions SQL de `supabase/tests/google-integration.sql` doivent s’exécuter sur une base locale de test après les migrations. Elles vérifient l’accès réservé au service, l’expiration, l’usage unique de l’état, la confirmation liée à l’utilisateur et l’idempotence des tâches. Elles s’exécutent dans une transaction annulée à la fin.

Validation manuelle avec un projet et un compte Google de test :

1. Connecter un utilisateur Deepflow, refuser l’écran de consentement puis recommencer avec toutes les autorisations. Vérifier que l’adresse du compte connecté est correcte.
2. Rejouer un callback ou attendre dix minutes : il doit échouer. Dans un autre navigateur connecté à un autre utilisateur Deepflow, une autorisation démarrée par le premier utilisateur ne doit pas pouvoir être finalisée.
3. Sélectionner un agenda contenant un événement daté, un événement récurrent et un événement sur une journée entière. Vérifier les événements et leurs liens réels.
   Dans Calendrier, créer un événement daté puis un événement sur une journée entière ; modifier et supprimer après confirmation. Modifier un événement simultanément dans Google et vérifier le conflit de version. Vérifier qu’un agenda en lecture seule et un événement avec invités ne proposent pas d’écriture. Une ancienne connexion avec portée de lecture seule doit demander une nouvelle autorisation pour écrire.
4. Importer une liste avec des tâches actives et terminées. Refaire l’import : aucune copie supplémentaire. Modifier titre et état dans Google, puis importer : les mêmes tâches Deepflow doivent être mises à jour.
5. Envoyer une tâche locale, refaire l’envoi, terminer puis rouvrir cette tâche et envoyer à nouveau. Vérifier une seule tâche Google, avec le bon état et la bonne date. Tester un lot de plus de 40 changements jusqu’à zéro restant.
6. Interrompre une réponse après une création Google, puis recommencer : le marqueur doit permettre de retrouver la tâche existante. Retirer l’accès depuis le compte Google et vérifier le message invitant à se reconnecter.
7. Déconnecter : vérifier la révocation et l’absence de jetons dans le stockage navigateur et dans toute réponse au frontend. Vérifier qu’un autre utilisateur ne peut ni lire ni modifier ces tâches.

Cette validation bout en bout nécessite des identifiants OAuth Google, un projet Supabase migré et les fonctions déployées. Elle ne peut pas être remplacée par les seuls tests locaux. Aucune opération sur un projet distant n’est nécessaire pour lire ou modifier le code de cette intégration.
