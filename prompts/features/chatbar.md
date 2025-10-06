# 🧠 Prompt – Refonte UI/UX d’une extension Visual Studio Code

Tu es un **expert UI/UX designer et développeur front-end senior**, spécialisé dans les extensions Visual Studio Code et les applications web professionnelles modernes. Ta mission : **analyser et refondre l’interface et l’ergonomie d’une extension existante** pour la rendre **plus claire, élégante, cohérente et fluide**, tout en restant sobre, performante et adaptée à un usage dans un IDE.

## 🎯 Objectif global
Produire une interface moderne, professionnelle, minimaliste et vivante, qui inspire confiance et efficacité. L’interface doit être **lisible, hiérarchisée, interactive, réactive et cohérente** avec les standards des outils développeurs modernes (VS Code, Cursor, Raycast, Warp, etc.). Les icônes utilisées dans la narration doivent être **monochromes, discrètes, et sans couleur vive** (par exemple ton gris clair sur fond sombre).

## 🧩 1. Structure & Hiérarchie visuelle
- Organiser le contenu en **blocs autonomes** : **Action** (ce que fait le système), **Résultat** (ce que l’utilisateur obtient), **Logs / détails techniques** (repliables).  
- Chaque bloc doit être identifiable visuellement (carte ou encart).  
- Ajouter de l’espace vertical (`margin: 12–16px`) entre les sections.  
- Utiliser une mise en page à **base de cartes** : fond légèrement contrasté (`#1e1e1e` sur fond `#121212`), coins arrondis (radius 8–12 px), ombre subtile (`box-shadow: 0 1px 4px rgba(0,0,0,0.3)`).  
- Prévoir une **double colonne** : gauche = étapes & résultats, droite = logs techniques repliables.

## 🧠 2. Clarté fonctionnelle & narration
- Toujours indiquer l’intention avant l’action : “Je vais rechercher les fichiers SQLite de Cursor Analytics…”.  
- Séparer clairement **diagnostic** et **action** : intention (texte naturel), action (bloc de commande), résultat (succès / échec / fichier trouvé).  
- Formuler les résultats en langage clair : “✓ 1 fichier trouvé dans ~/Library/Application Support/…”.  
- En cas d’échec : “⚠︎ Aucun fichier trouvé. Essayez : `⌘+Shift+P → Ouvrir le dossier d’extensions`.”  
- Les icônes de narration doivent rester **monochromes et discrètes** (ton gris clair sur fond sombre, pas d’émoji coloré).

## 💬 3. Feedbacks & États
- Toujours afficher un **état transitoire visible** : “⋯ Recherche en cours”, “✓ Connexion établie”, “✗ Erreur : base introuvable”.  
- Icônes discrètes, monochromes.  
- Différencier visuellement les statuts : vert = succès (`#34d399`), bleu = en cours (`#60a5fa`), rouge = erreur (`#f87171`), gris = neutre.  
- Transitions douces (fade-in/out).  
- Possibilité d’ajouter une **mini chronologie verticale** des étapes.

## 🔠 4. Typographie & Lisibilité
- Deux familles cohérentes : **Sans-serif** (`Inter`, `SF Pro`, `Segoe UI`) pour le texte, **Monospace** (`JetBrains Mono`, `Fira Code`) pour le code.  
- Hiérarchie par taille et poids : `h3` = titre, `p` = texte explicatif, `code` = monospace coloré.  
- Code couleur minimal mais expressif : vert = réussite, rouge = erreur, cyan/violet = accent modernité.

## 🧭 5. Guidage & accompagnement utilisateur
- Chaque action doit être expliquée : “Je cherche le fichier SQLite…”.  
- Afficher **une suite logique** : “Souhaitez-vous afficher les tables ? → [Afficher] [Ignorer]”.  
- En cas d’échec, proposer une **solution corrective**.  
- Ajouter un **fil directeur narratif** (type assistant technique) : Étape 1 : Recherche → Étape 2 : Connexion → Étape 3 : Résultats.  
- Les icônes de narration sont **monochromes, fines, neutres** (pas de couleurs vives).

## 🧰 6. Interaction & affordance
- Tout élément cliquable doit être identifiable : survol, curseur pointeur, feedback au clic.  
- Boutons : “Ouvrir”, “Copier le chemin”, “Relancer la recherche”, “Afficher les logs”.  
- Logs repliables (accordéon).  
- Réponse visuelle immédiate à chaque action.

## ⚙️ 7. Performance & confort d’usage
- Interface fluide et réactive : chargement paresseux (lazy render) des logs volumineux, historique d’exécutions dans un volet latéral.  
- **Mode compact** pour limiter le scroll.  
- Transitions cohérentes entre états.

## 🎨 8. Identité visuelle & tonalité
- Charte visuelle : fond `#121212`, cartes `#1e1e1e`, accent bleu-cyan `#5cb6ff` ou violet doux `#a882ff`.  
- Ton neutre, professionnel, rassurant.  
- Animations discrètes (pulsation, spinner, transition douce).  
- Iconographie : Lucide ou Heroicons, en mode monochrome gris.  
- Sobriété élégante > effets visuels.

## 🧱 9. Code CSS de référence
```css
body {
  background-color:#121212;
  color:#e0e0e0;
  font-family:'Inter',sans-serif;
  line-height:1.5;
  margin:16px;
}
.card {
  background:#1e1e1e;
  border-radius:10px;
  padding:14px 18px;
  margin-bottom:14px;
  box-shadow:0 1px 3px rgba(0,0,0,0.3);
}
.code-block {
  background:#171717;
  border-radius:8px;
  padding:10px;
  font-family:'Fira Code',monospace;
  color:#b8dfff;
}
.status-success{border-left:3px solid #34d399;}
.status-pending{border-left:3px solid #60a5fa;}
.status-error{border-left:3px solid #f87171;}
h3{
  font-size:1rem;
  color:#bdbdbd;
  margin-bottom:6px;
}
## 🧾 10. UX narrative globale

L’expérience utilisateur doit suivre une logique **narrative naturelle** :  
1. **Intention** → expliquer ce que l’outil va faire.  
2. **Action** → montrer la commande ou le processus.  
3. **Résultat** → afficher succès ou échec, avec feedback visuel.  
4. **Prochaine étape** → proposer une action.

**Exemple narratif :**  
“Je vais me connecter à la base Cursor Analytics.”  
“Connexion en cours…”  
“✓ Connexion établie.”  
“Souhaitez-vous consulter la table `analytics_events` ? [Oui / Non]”

Les icônes insérées dans ces messages doivent rester **monochromes, fines et neutres**, en **ton gris clair**, sans couleur accentuée ni emoji coloré. Elles doivent s’intégrer discrètement au texte, comme des repères visuels sobres et élégants.

---

## 🧭 11. Synthèse des objectifs

| Axe | Objectif | Résultat attendu |
|------|-----------|------------------|
| **Hiérarchie visuelle** | Clarifier la lecture | Sections lisibles et équilibrées |
| **Guidage** | Accompagner l’utilisateur | Interface explicative et rassurante |
| **Feedback** | Donner du sens à l’action | États explicites et visuels |
| **Interaction** | Fluidifier l’usage | Actions visibles, réponses immédiates |
| **Tonalité visuelle** | Inspirer confiance | Design sobre, moderne, cohérent |
| **Performance** | Fluidité et lisibilité | Aucun lag ni surcharge visuelle |
