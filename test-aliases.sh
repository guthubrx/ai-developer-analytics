#!/bin/bash
echo "🧪 Test des alias AI Developer Analytics"
echo ""

# Charger les alias
source ~/.zshrc 2>/dev/null || source ~/.bashrc 2>/dev/null || source ~/.bash_profile 2>/dev/null

echo "✅ Alias chargés"
echo ""
echo "📋 Test des alias principaux:"
echo "  build: $(type build 2>/dev/null && echo "✅ OK" || echo "❌ Manquant")"
echo "  build-clean: $(type build-clean 2>/dev/null && echo "✅ OK" || echo "❌ Manquant")"
echo "  build-check: $(type build-check 2>/dev/null && echo "✅ OK" || echo "❌ Manquant")"
echo "  build-test: $(type build-test 2>/dev/null && echo "✅ OK" || echo "❌ Manquant")"
echo "  fix-deps: $(type fix-deps 2>/dev/null && echo "✅ OK" || echo "❌ Manquant")"
echo "  rollback-list: $(type rollback-list 2>/dev/null && echo "✅ OK" || echo "❌ Manquant")"
echo "  build-help: $(type build-help 2>/dev/null && echo "✅ OK" || echo "❌ Manquant")"
echo ""
echo "🎉 Test terminé !"
