# 📖 Mon Livre de Recettes

Un livre de recettes numérique : sommaire par catégories, recherche (titre, ingrédient, tag),
cases à cocher pour les ingrédients, navigation page par page et impression.

## Ajouter une recette

Envoie à Claude un lien Instagram, des captures d'écran ou un texte : il rédige la recette et
l'ajoute dans `recettes/` (voir `CLAUDE.md` pour le format).

## Mettre le site en ligne (gratuit)

Sur GitHub : **Settings → Pages → Source : Deploy from a branch**, choisir la branche `main`
et le dossier `/ (root)`. Le site sera disponible à `https://<ton-pseudo>.github.io/livre-recette-/`.

## Voir le site en local

```bash
python3 -m http.server
```
puis ouvrir http://localhost:8000
