# Livre de recettes — consignes pour Claude

Ce dépôt est un livre de recettes numérique (site statique, GitHub Pages). L'utilisateur envoie
des liens (Instagram, TikTok, sites…), des captures d'écran ou du texte, et Claude en tire une
recette propre, rédigée en français.

## Ajouter une recette

1. Lire la source (captures, légende du post, transcription…). Si une info manque (quantité,
   temps), l'estimer raisonnablement et le signaler dans « Astuces » ou à l'utilisateur ; ne rien inventer
   d'important sans le dire.
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
