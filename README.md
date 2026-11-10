# 📖 Mon Livre de Recettes

Un livre de recettes numérique : sommaire par catégories, recherche (titre, ingrédient, tag),
cases à cocher pour les ingrédients, navigation page par page et impression.

## Ajouter une recette

- **Depuis le site** : bouton « ＋ Nouvelle recette », ajoute tes captures d'écran et envoie.
  Puis dis à Claude « traite les nouvelles recettes » : il les met en page sans rien changer au contenu.
  (La première fois, le site te demande un jeton GitHub : les étapes sont expliquées sur la page.)
- **Directement à Claude** : envoie un lien, des captures ou un texte dans la conversation.

Le format des recettes et les consignes sont dans `CLAUDE.md`.

## Mettre le site en ligne (gratuit)

Sur GitHub : **Settings → Pages → Source : Deploy from a branch**, choisir la branche `main`
et le dossier `/ (root)`. Le site sera disponible à `https://<ton-pseudo>.github.io/livre-recette-/`.

## Voir le site en local

```bash
python3 -m http.server
```
puis ouvrir http://localhost:8000
