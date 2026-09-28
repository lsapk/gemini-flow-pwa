# Mode Étudiant

Un interrupteur "Mode Étudiant" dans Paramètres. Une fois activé, une nouvelle section **Études** apparaît dans le menu, et les pages existantes (Tâches, Focus, Calendrier, Objectifs, Tableau de bord) gagnent des options scolaires. Désactivé, l'app reste identique.

## Fonctionnalités proposées

**1. Matières**
- Créer ses matières (nom, couleur, prof, coefficient, salle).
- Chaque tâche, session Focus et objectif peut être rattaché à une matière.

**2. Devoirs & Projets**
- Devoirs : matière, date de rendu, type (exercice, dissertation, exposé, lecture), charge estimée.
- Projets longs : étapes (jalons) avec dates, progression automatique.
- Les devoirs apparaissent aussi dans Tâches et Calendrier (badge matière).
- Vue "À rendre cette semaine" triée par urgence.

**3. Examens & Révisions**
- Ajouter un examen (matière, date, chapitres).
- IA "Planning de révision" : génère des sessions réparties jusqu'à la date (répétition espacée), ajoutées au calendrier en un clic.

**4. Emploi du temps**
- Grille hebdo des cours, affichée dans le Calendrier pour éviter de planifier du travail pendant les cours.

**5. Notes & moyenne**
- Saisie des notes par matière, moyenne pondérée par coefficient, courbe d'évolution, objectif de moyenne.

**6. Outils IA (crédits consommés uniquement au clic)**
- **Découper un devoir** : à partir de la consigne, l'IA crée les sous-tâches et estime le temps.
- **Fiches de révision** : coller un cours → résumé + fiches question/réponse (flashcards) à réviser.
- **Quiz** : l'IA génère un QCM sur un chapitre, score enregistré.
- **Coach d'études** : conseils basés sur les devoirs en retard, temps de Focus par matière et notes.

**7. Focus étudiant**
- Choisir la matière avant une session ; stats de temps d'étude par matière.
- Mode "Pomodoro révision" qui enchaîne avec les flashcards pendant les pauses.

**8. Tableau de bord**
- Carte "Études" : prochain examen (compte à rebours), devoirs à rendre, moyenne actuelle, heures d'étude de la semaine.

## Ordre de réalisation proposé
1. Interrupteur + Matières + Devoirs/Projets + carte tableau de bord.
2. Examens + planning de révision IA + emploi du temps.
3. Notes & moyenne, fiches/quiz IA, coach.

## Détails techniques
- `user_settings.student_mode boolean default false`; hook `useStudentMode` pour afficher/masquer les éléments.
- Nouvelles tables (RLS `auth.uid() = user_id`, GRANT authenticated/service_role, triggers updated_at) : `subjects`, `assignments` (+ `assignment_milestones`), `exams`, `class_schedule`, `grades`, `flashcard_decks`, `flashcards` (champs de répétition espacée), `quiz_attempts`.
- Colonne optionnelle `subject_id` sur `tasks`, `focus_sessions`, `goals`.
- Nouvelle page `/etudes` avec onglets (Devoirs, Examens, Emploi du temps, Notes, Révisions), lien menu conditionnel.
- Fonction serveur `ai-student` (actions : breakdown, revision_plan, flashcards, quiz, coach) via Lovable AI, `consume_ai_credit` par appel, sortie JSON structurée jamais affichée brute.
- Design Liquid Glass existant, pas de gamification.
