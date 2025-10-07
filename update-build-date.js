#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lire le package.json
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Obtenir la date actuelle
const now = new Date();
const dateStr = now.toISOString().split('T')[0]; // Format: 2025-10-07
const timeStr = now.toLocaleTimeString('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Paris'
});

// Mettre à jour la description
const baseDescription = "Hybrid AI developer analytics extension with dual-level routing, local Ollama support, and adaptive coaching";
packageJson.description = `${baseDescription} - Built: ${dateStr} ${timeStr} CEST`;

// Sauvegarder
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

console.log(`✅ Date de build mise à jour: ${dateStr} ${timeStr} CEST`);