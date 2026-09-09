# Mon tableau Kanban

Un tableau Kanban simple, personnalisable et gratuit : crée des colonnes, choisis leurs couleurs, ajoute des tâches et déplace-les par glisser-déposer. Les données restent dans le navigateur de chaque personne.

## Mettre le tableau en ligne avec GitHub Pages

1. Crée un nouveau dépôt GitHub public, par exemple `mon-tableau-kanban`.
2. Téléverse **tous les fichiers de ce dossier** à la racine du dépôt : `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `sw.js` et `icon.svg`.
3. Sur GitHub, ouvre **Settings** → **Pages**.
4. Dans « Build and deployment », choisis **Deploy from a branch**, puis la branche `main` et le dossier `/(root)` ; enregistre.
5. GitHub affichera l’adresse publique du tableau après quelques instants. Partage cette adresse : tout le monde peut l’ouvrir dans son navigateur.

## Pour les personnes qui l’utilisent

- Elles créent leurs colonnes et leurs tâches sans compte.
- Leurs tâches sont sauvegardées seulement sur leur navigateur, donc personne ne voit les données des autres.
- Dans Safari sur Mac, elles peuvent choisir **Fichier → Ajouter au Dock** afin de l’ouvrir comme une petite application.
- Le bouton de réglages permet d’exporter puis d’importer une sauvegarde au format JSON.

## Publier une mise à jour

Remplace les fichiers dans GitHub avec la nouvelle version. Pour éviter qu’un ancien affichage reste en cache, augmente `mon-tableau-v1` dans `sw.js` (par exemple `mon-tableau-v2`).

## Important

Cette version ne synchronise pas les tableaux entre appareils ou entre utilisateurs. C’est volontaire : elle est privée, ne demande ni compte ni serveur. Une version collaborative demanderait une base de données et un système de connexion.
