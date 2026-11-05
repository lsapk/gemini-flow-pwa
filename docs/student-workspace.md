# Espace étudiant

Le module `/student` conserve uniquement les informations saisies ou importées par l’utilisateur. Il ne fournit aucune donnée académique fictive. Le profil accepte tout établissement, diplôme et niveau français ; les UE, échéances et cours sont isolés par année universitaire et semestre.

## Configuration

Configurer le client Supabase avec les variables documentées à la racine du projet, puis appliquer la migration `student_workspace` dans un environnement local/de test avant toute production. Elle dépend de `auth.users` et de la table existante `public.tasks` (colonnes `id`, `user_id`, `title`, `description`, `priority`, `due_date`, `completed`). Le module n’ajoute aucune colonne à `tasks`.

Tables : `student_profiles`, `student_modules`, `student_assessments`, `student_deadlines`, `student_calendar_events`. RLS est activée partout, avec `USING` et `WITH CHECK` sur `auth.uid() = user_id`. Une clé étrangère composite interdit de rattacher une évaluation à l’UE d’un autre utilisateur. La politique d’échéance vérifie aussi le propriétaire d’une tâche liée. Les accès sont explicitement accordés au seul rôle `authenticated`.

RPC :

- `create_student_revision_task` : transaction `SECURITY INVOKER`, verrou sur l’échéance, création idempotente d’une tâche normale sous les RLS existantes. Une tâche supprimée libère le lien (`ON DELETE SET NULL`). Supprimer une échéance conserve sa tâche.
- `import_student_calendar` : transaction `SECURITY INVOKER`, 2 000 événements au maximum, contrôle des versions et annulations, sans accès réseau. La base ne reçoit ni URL privée ni identifiant universitaire.

Le client utilise un adaptateur TypeScript local dans `src/services/student-service.ts` pour les nouvelles tables. Regénérer les types Supabase après application de la migration permettra de supprimer ultérieurement cet adaptateur. Aucun accès `service_role` n’est nécessaire dans le navigateur.

## Calculs et limites universitaires

Note d’UE = somme des notes renseignées × leur poids / somme de leurs poids. Une note de zéro est incluse ; une note absente est exclue et la moyenne reste partielle. Les poids doivent totaliser 100 % pour qu’une UE soit complète. Un verrou et un trigger empêchent de dépasser 100 %, y compris lors d’écritures concurrentes.

Moyenne du semestre = somme des moyennes d’UE renseignées × coefficient d’UE / somme des coefficients correspondants. Les ECTS ne remplacent pas les coefficients et sont affichés comme crédits planifiés. Il n’y a aucune décision de validation, compensation, rattrapage, absence ou seuil éliminatoire : les modalités officielles propres à chaque formation restent nécessaires.

## Connecteur Lyon 1

Disponible : ouverture des outils officiels, import manuel d’un fichier iCalendar, et téléchargement manuel d’un lien iCalendar depuis un serveur universitaire autorisé. Indisponibles : connexion CAS/ENT, abonnement automatique en arrière-plan, import automatique des notes TOMUSS. Aucun champ de mot de passe universitaire n’existe.

1. Ouvrir l’[emploi du temps officiel](https://edt.univ-lyon1.fr/) et se connecter directement à l’université si demandé.
2. Choisir sa formation, son groupe et la période ; utiliser l’export agenda / iCalendar lorsqu’il est proposé par la composante.
3. Télécharger le `.ics` sur son appareil, ou copier le lien HTTPS d’export fourni par ADE.
4. Choisir un nom de source stable, charger le fichier ou demander l’actualisation du lien, lire l’aperçu et confirmer.

Le lien reste en mémoire dans la page et n’est enregistré ni dans le profil ni dans l’export. Le service `ical-proxy` doit être déployé et `ICS_ALLOWED_HOSTS` doit contenir le nom exact de chaque serveur universitaire autorisé. Il exige une session valide, limite la réponse à 2 Mio, refuse les redirections et les URL avec identifiants. Une université absente de cette liste reste compatible via l’import de fichier. Chaque téléchargement et chaque import résultent d’une action explicite ; il n’y a pas d’abonnement automatique. Un lien privé peut donner accès à l’agenda : ne pas le publier ni le copier dans un ticket d’assistance.

## Export personnel

Le bouton « Exporter mes données » télécharge un JSON versionné avec le profil étudiant, les UE et évaluations de **tous** les semestres, les échéances, les événements importés et les tâches de révision encore liées. Les requêtes sont filtrées par utilisateur et paginées ; une erreur ou le dépassement de la borne de 20 000 lignes d’une table annule l’export au lieu de produire un fichier incomplet. Le JSON n’est pas un relevé officiel ni une sauvegarde des fichiers ICS d’origine. Il contient des données privées à conserver dans un emplacement approprié.

Sources primaires consultées le 3 novembre 2026 :

- [Portail étudiant Lyon 1 : outils officiels](https://etu.univ-lyon1.fr/outils), qui référence ADE, Moodle et TOMUSS.
- [Guide ADE de l’INSPE : consulter et exporter son emploi du temps](https://moodle.univ-lyon1.fr/pluginfile.php/2472533/mod_resource/content/2/2024%202025%20-%20Rentre%CC%81e%20des%20enseignants%20-%20Pre%CC%81sentation%20-%20Direction%20des%20e%CC%81tudes%20-%20Consulter%20son%20Emploi%20du%20Temps.pdf). La présentation dépend de la composante ; aucune disponibilité universelle du même menu n’est promise.
- [Documentation Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) et [upsert JavaScript](https://supabase.com/docs/reference/javascript/upsert).

## Import iCalendar borné

`src/lib/student-calendar.ts` traite le fichier sur l’appareil avant toute écriture : 2 Mio, 50 000 lignes dépliées, 2 000 VEVENT, champs bornés. Il accepte les lignes pliées, les textes échappés, UTC, Europe/Paris, les heures flottantes (avec avertissement) et les journées entières avec fin exclusive. Les heures de changement d’heure inexistantes/ambiguës sont refusées ; un export UTC permet de les lever. Les autres fuseaux sont refusés.

Les propriétés RRULE/RDATE/EXDATE/EXRULE, DURATION et RECURRENCE-ID;RANGE provoquent le rejet complet avec une consigne d’export d’occurrences individuelles et de DTEND explicites. Il n’y a donc aucune expansion partielle et aucune récurrence perdue silencieusement. VTODO/VJOURNAL/VFREEBUSY sont refusés ; VALARM n’est pas importé.

Identité d’un événement : utilisateur + semestre + nom de source + UID + RECURRENCE-ID. Les doublons gardent la plus grande SEQUENCE, puis LAST-MODIFIED / DTSTAMP le plus récent. Une réimportation utilise la même clé. Une ancienne version ne remplace pas une récente. Une annulation STATUS:CANCELLED ou METHOD:CANCEL peut n’avoir que son UID ; sans RECURRENCE-ID elle annule les occurrences de cet UID dont la version n’est pas plus récente. L’absence d’un événement dans un nouvel export ne le supprime pas. Un fichier est un instantané ; aucune synchronisation permanente n’est promise.

## Vérifications

Exécuter `node --test tests/student.test.mjs` avec Node 24, ou un environnement supportant les imports TypeScript sans compilation. Les cas couvrent pondérations, zéro/notes absentes, coefficients, UTC/Paris/été, changement d’heure, lignes pliées, journées entières, doublons/version, occurrences détachées, annulations, récurrences refusées, fichiers invalides, URL de flux et bornes. Les tests SQL sous PGlite exécutent réellement les politiques/RPC contre deux utilisateurs de test ; ils ne remplacent pas une répétition complète des migrations historiques ni une connexion réelle à ADE.

Avant déploiement, appliquer la migration en local/test puis vérifier avec deux utilisateurs : A crée ses UE/notes/échéances/cours ; B ne peut ni lire ni modifier les lignes de A, ni créer une évaluation sur une UE de A, ni lier une tâche de A. Vérifier aussi le dépassement des poids en concurrence, la double création de révision, les réimports identiques/anciens, une annulation de série et le rollback intégral d’un lot invalide. L’accès à une base de test n’est pas préconfiguré par le module ; ne pas présenter cette vérification comme faite sans l’avoir exécutée.
