#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Obtenir la date actuelle
const now = new Date();
const dateStr = now.toLocaleDateString('fr-FR'); // Format: 09/10/2025
const timeStr = now.toLocaleTimeString('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'Europe/Paris'
});

// 1. Mettre à jour le package.json
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const baseDescription = "Hybrid AI developer analytics extension with dual-level routing, local Ollama support, and adaptive coaching";
packageJson.description = `${baseDescription} - Built: ${dateStr} ${timeStr} CEST`;

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

// 2. Mettre à jour le build-info.json
const buildInfoPath = path.join(__dirname, 'build-info.json');
const buildInfo = {
  buildTimestamp: `${dateStr} ${timeStr}`,
  version: packageJson.version
};

fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

console.log(`✅ Date de build mise à jour: ${dateStr} ${timeStr} CEST`);
console.log(`✅ Version: ${packageJson.version}`);