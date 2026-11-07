# Deepflow — Design system

**Version 1.0 · Direction visuelle et spécification d’interface**

Deepflow est un espace de travail personnel. Au premier regard, on doit comprendre ce qui compte aujourd’hui et savoir où agir. La direction visuelle associe une typographie nette, des surfaces en verre dépoli et des reflets doux. La lumière met en valeur la navigation et les moments de transition. Les listes, notes et formulaires reposent sur des surfaces stables et lisibles.

## Direction visuelle

| Référence fournie | Ce que Deepflow en retient |
| --- | --- |
| **1 · Admin Dashboard** | Une structure de travail dense mais ordonnée. Barre latérale fumée, cartes mates et lumière colorée derrière les panneaux. |
| **2 · Glassy Navigation Tabs** | Un dock flottant à bord poli. Un reflet sous l’onglet actif et une action centrale identifiable au toucher. |
| **3 · Glassy Login Form** | Une carte de connexion sculptée, posée devant un fond minéral. Un seul éclat de lumière sur l’arête du panneau. |
| **4 · Domus** | Une hiérarchie entre le fond, les commandes flottantes et les données. Des groupes de commandes qui se repèrent par leur forme et leur position. |

Le violet reste la couleur d’action de Deepflow. Le bleu glacier et le menthe servent de reflets. L’ambre chaud apporte une lumière secondaire sur les écrans d’accueil et de connexion. Dans une même vue, choisir une lumière dominante et une lumière secondaire discrète.

## Couleurs

| Rôle | Clair · Porcelaine | Sombre · Obsidienne | Usage |
| --- | --- | --- | --- |
| Fond | `#F5F5FA` | `#101119` | Base de l’application et repli des effets vitrés |
| Surface de lecture | `#FFFFFF` | `#191C27` | Tâches, notes, données, champs et formulaires |
| Surface surélevée | `#FAFAFF` | `#242838` | Menus, feuilles et dialogues |
| Texte principal | `#1C2031` | `#F0F1F8` | Titres, données et libellés importants |
| Texte secondaire | `#50566B` | `#B0B6CC` | Métadonnées, aides et légendes |
| Accent d’action | `#4C47B5` | `#A8A5FF` | Actions principales, liens et sélection |
| Texte sur accent | `#FFFFFF` | `#15152B` | Libellé d’un bouton principal rempli |
| Sélection discrète | `#E9E7FB` | `#313058` | Fond d’un onglet, d’un filtre ou d’un élément actif |
| Bordure de séparation | `#DADDE8` | `#373D53` | Contours de panneaux et séparateurs de listes |
| Bordure de contrôle | `#747B90` | `#8189A4` | Champs et contrôles dont le contour indique la zone interactive |
| Succès | `#17674E` | `#85E1BD` | Tâche terminée, import réussi, connexion active |
| Attention | `#8A4B11` | `#FFD18C` | Retard, action attendue, configuration incomplète |
| Erreur | `#AD2D49` | `#FF9BB0` | Échec, blocage ou action destructive |

Les reflets `#7ABEFF` (glacier), `#9BE4CF` (menthe) et `#E8B776` (ambre) sont décoratifs. Appliquer les couleurs d’état avec un libellé ou un symbole lisible, par exemple « En retard » avec une icône d’horloge. Contrôler le contraste sur la surface réellement composée, notamment aux endroits les plus lumineux du verre.

## Matières et profondeur

Les valeurs de flou et d’opacité sont des points de départ en pixels d’interface. L’opacité désigne la teinte de la surface, indépendamment de son contenu.

| Matière | Composition | Où l’utiliser |
| --- | --- | --- |
| **Voile ambiant** | Fond du thème, halo large et fixe, intensité indicative de 8 à 16 % en clair et de 12 à 24 % en sombre | Arrière-plan du tableau de bord, de la connexion et du focus |
| **Verre dépoli** | Teinte blanche en clair à 82 %, graphite en sombre à 86 %, flou de 20 px, liseré de 1 px plus lumineux sur l’arête haute | Barre latérale, en-tête flottant et dock |
| **Verre sculpté** | Teinte à 90 %, flou de 28 px, reflet bref sur une arête et ombre large diffuse | Carte de connexion et feuilles de commande |
| **Mat** | Surface de lecture opaque, bordure fine, ombre légère uniquement si le panneau doit se détacher | Tableaux, messages, champs, listes de cours et tâches |

Prévoir au maximum deux plans vitrés visibles en même temps. Garder les cartes internes mates dans un panneau vitré. Lorsqu’un dialogue s’ouvre, atténuer le fond et donner la priorité à son panneau. Si le flou est indisponible ou si la transparence est réduite, utiliser le fond opaque du même rôle avec la même géométrie. Le dock conserve sa silhouette et sa sélection dans ce mode.

## Typographie, dimensions et icônes

Police système, avec SF Pro sur les appareils Apple et la police native de la plateforme ailleurs. Chiffres tabulaires pour le minuteur, les crédits, les horaires et les notes. Les textes d’action restent en français courant et en casse de phrase.

| Usage | Taille / interligne | Graisse |
| --- | --- | --- |
| Titre de page | 36 / 42 px sur ordinateur, 30 / 36 px sur mobile | 650 |
| Titre de section | 20 / 26 px | 600 |
| Titre de carte | 16 / 22 px | 600 |
| Texte courant et champs | 16 / 24 px | 400 |
| Commandes, navigation, métadonnées | 14 / 20 px | 400 à 600 selon la hiérarchie |
| Légende de dock ou d’indicateur | 11–12 / 16 px | 500 |

- **Espacement** · grille de 4 px. Références de 4, 8, 12, 16, 24, 32 et 48 px. Écart courant entre cartes de 16 px sur mobile et de 24 px sur ordinateur.
- **Rayons** · 10 px pour un champ, 12 px pour un bouton, 20 px pour une carte, 28 px pour une feuille. Capsule entière pour le dock et les badges courts.
- **Commandes** · cible d’au moins 44 × 44 px, avec un indicateur de focus extérieur de 2 px. Le contour de focus se distingue du liseré décoratif.
- **Icônes** · conserver Lucide, trait cohérent et sans remplissage décoratif. Taille de 20 px en navigation et 16 px dans les contrôles. Une icône seule reçoit un nom accessible.

## Navigation

| Largeur | Structure proposée |
| --- | --- |
| **≥ 1 024 px** | Barre latérale vitrée de 232 à 248 px. Entrées principales visibles, sélection par fond teinté et libellé renforcé. Contenu centré avec une largeur maximale de 1 440 px. |
| **768 à 1 023 px** | Rail compact de 72 px et en-tête de page. Les icônes ont un nom accessible et un libellé visible au survol ou au focus clavier. |
| **< 768 px** | Dock flottant, marges latérales de 12 à 16 px et espace réservé en bas du contenu. Cinq positions, **Accueil · Tâches · Créer · Études · Plus**. |

Sur mobile, **Créer** ouvre une feuille avec les actions disponibles. C’est une commande et elle ne reçoit pas l’état d’onglet actif. **Plus** donne accès au calendrier, aux objectifs, aux habitudes, à la concentration, au journal, à l’assistant et aux paramètres. Le repère de l’onglet actif combine une forme, une icône et un libellé. Le reflet turquoise s’arrête au bord de la capsule.

Les raccourcis **Objectifs**, **Habitudes** et **Assistant IA** restent en haut de la vue d’ensemble à toutes les largeurs. Un accès fréquent tient en un geste depuis l’accueil. Sur un écran de 320 px, conserver les libellés, les zones tactiles et les marges sûres du système. Lorsque le clavier recouvre l’écran, garder la commande du formulaire visible et laisser le dock s’effacer temporairement si nécessaire.

## Composants

| Composant | Anatomie et comportement |
| --- | --- |
| **Carte d’indicateur** | Libellé, valeur et période. Une icône secondaire. Une donnée inconnue affiche « Indisponible » et réserve `0` à une valeur mesurée. |
| **Raccourci** | Icône, destination en toutes lettres et chevron. La carte entière est un lien avec un seul arrêt clavier. |
| **Bouton** | Rempli violet pour l’action principale, contour visible pour l’alternative, texte seul pour les actions secondaires. État de chargement avec libellé et largeur stables. |
| **Ligne de tâche** | Contrôle de complétion, intitulé, date et priorité libellée. Le menu rassemble les actions secondaires. L’état terminé reste lisible. |
| **Champ** | Libellé permanent, zone mate, aide sous le champ. Une erreur précise la correction attendue près du contrôle. |
| **Onglets et filtres** | Sélection visible par le fond et la graisse. Un groupe ne déborde pas de la page. Sur mobile, une liste longue peut défiler sur son axe avec une indication visible. |
| **Feuille ou dialogue** | Titre, contenu, action et fermeture explicite. Feuille ancrée en bas sur mobile, panneau centré sur ordinateur. Le focus revient à la commande d’ouverture. |
| **État vide ou erreur** | Une phrase explique l’état réel. Une action permet de commencer, de réessayer ou de trouver l’aide. L’erreur d’une intégration laisse les fonctions locales accessibles. |

## Application aux écrans

- **Vue d’ensemble** · accueil et action « Nouvelle tâche », rangée des trois raccourcis, indicateurs, prochaines tâches et concentration. Verre sur la structure et halo derrière la carte de concentration. Les indicateurs et les lignes de tâches restent mats.
- **Connexion et inscription** · panneau sculpté sur un fond minéral à halo indigo ou ambre. Deux zones sur ordinateur, l’une pour le contexte et l’autre pour le formulaire. Une seule colonne sur mobile. Champs, erreurs et récupération du mot de passe restent visibles même lorsque le fond est très lumineux.
- **Tâches, objectifs et habitudes** · listes mates et denses. Les filtres peuvent flotter au-dessus de la liste pendant le défilement. Une tâche terminée reçoit une coche, un changement de teinte et une confirmation légère. Les actions importantes restent accessibles sans geste de balayage.
- **Espace étudiant** · parcours et semestre en haut, puis cours, UE, notes et échéances. Les notes et coefficients s’alignent à droite. Distinguer une note manquante d’un zéro et une moyenne provisoire d’une moyenne complète. Pour l’ICS, afficher la source et l’aperçu avant l’import.
- **Calendrier et connexions** · semaine et choix de l’agenda dans une barre de commandes. Les événements Google et les échéances Deepflow portent une étiquette de source. Les états « À connecter », « Connecté », « Autorisation expirée » et « Service indisponible » ont chacun leur action.
- **Concentration** · temps au premier plan, halo radial fixe et commandes séparées. États prêts, en cours, en pause et enregistrement distingués par le texte. Éviter les pulsations continues pendant le travail.
- **Assistant et crédits IA** · historique mat et composeur flottant. Présenter le solde, le coût et les options de partage avant l’envoi. Pendant une demande, indiquer l’attente sans déplacer le texte en cours de lecture.

## Mouvement et états interactifs

| Interaction | Prescription |
| --- | --- |
| Survol et focus | 120 à 160 ms. Variation de teinte ou de bordure. Le focus clavier est visible dès son arrivée. |
| Pression | 90 à 120 ms. Compression légère, autour de 98 % de la taille initiale. Relâchement immédiat si l’action est annulée. |
| Sélection du dock | 200 à 240 ms. Glissement du repère vers la nouvelle entrée. Aucun changement de largeur du dock ni de position des autres libellés. |
| Ouverture de feuille | 240 à 300 ms à l’entrée, 160 à 200 ms à la sortie. Translation de 12 à 20 px et fondu. Le mouvement commence dès l’action. |
| Navigation et mise à jour | Fondu court de 120 à 180 ms si le contenu est déjà prêt. Une attente réseau conserve la géométrie de la vue avec un état de chargement explicite. |

Préférer une décélération franche à l’arrivée. Interrompre la transition quand l’utilisateur change d’avis. Sous réduction des animations, retirer les translations et changements d’échelle, puis appliquer les états directement ou avec un fondu très bref. Les halos restent fixes dans tous les modes. Animer l’opacité et la position du repère, pas le flou du panneau entier.

## Critères de validation avant intégration

- Vérifier les thèmes clair et sombre, la réduction des animations et le repli opaque des matières. Contrôler un contraste d’au moins **4,5:1** pour le texte courant et **3:1** pour le grand texte et les repères visuels essentiels des contrôles.
- Tester les largeurs 320, 390, 768, 1 024 et 1 440 px, ainsi que le zoom à 200 %. Aucune commande principale ne se retrouve masquée par le dock, le clavier ou un en-tête fixe.
- Parcourir au clavier les raccourcis, les onglets, le dock et les dialogues. Vérifier les noms des icônes, l’ordre de focus et le retour au déclencheur.
- Examiner les vrais états de chargement, de vide, d’erreur et de connexion. Un tableau chargé, un nom long et une phrase sur plusieurs lignes doivent rester lisibles.
- Vérifier le défilement et les transitions sur un téléphone modeste. En cas de saccades, réduire d’abord le nombre de surfaces vitrées, puis le flou. Conserver les liserés, les formes et la hiérarchie de lumière.
