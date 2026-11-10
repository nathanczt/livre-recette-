# Livre de recettes — consignes pour Claude

Ce dépôt est un livre de recettes numérique (site statique, GitHub Pages). L'utilisateur envoie
des liens (Instagram, TikTok, sites…), des captures d'écran ou du texte, et Claude en tire une
recette propre, rédigée en français.

## Publication automatique (demandé par l'utilisateur)

Après chaque modification : commit, push sur la branche de travail, **puis publier sur `main`**
sans attendre (c'est `main` qui est en ligne sur GitHub Pages) :
`git fetch origin main && git merge origin/main && git push origin HEAD:main`.
Pas besoin de pull request.
Si `app.js` ou `style.css` change : incrémenter `?v=N` dans `index.html` (et « version N » dans app.js),
sinon les téléphones gardent l'ancienne version en cache.

## Règle d'or : fidélité totale

Claude fait **uniquement la mise en page**. Ne jamais changer, ajouter, retirer ou « améliorer » :
ingrédients, quantités, unités, temps, températures, étapes, ordre des étapes.
- Reformuler seulement pour la clarté (phrases courtes, une action par étape), sans changer le sens.
- Une info absente de la source reste absente (ne pas remplir le champ du frontmatter) ;
  si elle manque dans un ingrédient, écrire « quantité non précisée ».
- Conserver les astuces de l'auteur dans « Astuces », sans en inventer.
- En cas de doute (texte illisible…), le signaler à l'utilisateur plutôt que deviner.
- Mesures américaines (cups, pounds, ounces…) : garder la mesure d'origine et ajouter l'équivalent
  métrique arrondi entre parenthèses (ex. « 1 livre (environ 450 g) », « 1 tasse (environ 24 cl) »).
  Demandé par l'utilisateur.

## « Traite les nouvelles recettes »

Le bouton « Nouvelle recette » du site dépose les captures dans `a-traiter/<date>-<nom>/`
(sur la branche `main`) : des images `capture-XX.jpg` et un `infos.md` (nom proposé, lien, note).

1. `git fetch origin main` et partir de `origin/main` (les dépôts arrivent sur `main`).
2. Pour chaque dossier de `a-traiter/` : regarder toutes les captures, lire `infos.md`
   (la note de l'utilisateur prime : catégorie, nom…), puis créer la recette (voir ci-dessous).
   Le lien va dans `source`.
3. Supprimer le dossier traité (`git rm -r a-traiter/<dossier>`).
4. Commit + push, puis lister à l'utilisateur les recettes ajoutées et tout point douteux.

## Ajouter une recette (lien, captures ou texte envoyés dans la conversation)

1. Lire la source (captures, légende du post, transcription…) en respectant la règle d'or.
2. Créer `recettes/<slug>.md` (slug en minuscules, sans accents, mots séparés par des tirets).
3. Ajouter le nom du fichier dans `recettes/index.json` (tableau JSON).
4. Commit + push.

## Format d'un fichier recette

```markdown
---
titre: Nom de la recette
categorie: Plats            # Apéritifs, Entrées, Plats, Accompagnements, Desserts, Pâtisseries, Boissons, Sauces, Autres
preparation: 15 min
cuisson: 30 min
temps: 45 min               # temps total
portions: 4
difficulte: Facile          # Facile, Moyen, Difficile
tags: [végétarien, rapide]
source: https://www.instagram.com/p/...
image: images/nom.jpg       # optionnel (fichier dans /images ou URL)
---

## Ingrédients

- 200 g de …

## Préparation

1. …

## Astuces

> …
```

- Les listes sous un titre contenant « Ingrédients » deviennent des cases à cocher sur le site.
- Sous-sections d'ingrédients possibles avec `### Pour la sauce`, etc. (garder « Ingrédients » dans un titre au-dessus).
- Unités : g, kg, cl, ml, c. à soupe, c. à café. Étapes courtes, une action principale par étape.

## Tester en local

`python3 -m http.server` puis ouvrir http://localhost:8000
