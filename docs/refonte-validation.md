# Vérifications de la refonte Deepflow

La branche `codex/deepflow-modernization` part de `lsapk/gemini-flow-pwa@147390a`.

| Contrôle local                                 | Résultat                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| TypeScript et build Vite                       | Réussis                                                                               |
| ESLint                                         | 0 erreur, 22 avertissements liés principalement aux hooks existants et à Fast Refresh |
| Tests Node et PostgreSQL embarqué              | 97 réussis                                                                            |
| Parcours Chrome ordinateur et émulation mobile | 8 réussis                                                                             |
| Typage Deno des fonctions Supabase             | 31 points d’entrée vérifiés                                                           |
| Audit des dépendances npm                      | 0 vulnérabilité connue signalée                                                       |

Les parcours navigateur couvrent l’aperçu public, les thèmes clair et sombre, la protection des routes, les tâches, l’export étudiant, l’erreur d’un lien ICS non autorisé, le quota IA et les modifications Google Calendar avec nouvelle tentative sans doublon. Les tests de fonctions vérifient notamment le consentement OAuth, les transferts Google Tasks, les droits d’accès, le décompte des crédits et la validation des fichiers ICS.

[Aperçu ordinateur](preview-desktop.png) · [Aperçu mobile](preview-mobile.png) · [Thème sombre](preview-desktop-dark.png)

Les tests utilisent des comptes fictifs et des réponses de fournisseurs contrôlées. La base Supabase hébergée a servi à vérifier le schéma et les avis de sécurité en lecture seule. La recette avec Google, Gemini et Stripe, ainsi que l’application des migrations sur une copie du schéma de production, restent à effectuer avant la mise en service. [Plan de mise en service](mise-en-service.md)

La refonte s’appuie sur les guides d’Emil Kowalski pour l’interface et Superpowers pour la relecture. Security Guidance, HexStrikeAI et CyberStrikeAI ont été consultés comme références de périmètre. Les deux plateformes de pentest et la vidéo de design ne font pas partie des vérifications exécutées. [Audit de sécurité](security-audit.md)
