#!/bin/bash
echo "=============================="
echo "  Moaz Studio - Push to GitHub"
echo "=============================="
echo ""

if [ ! -d ".git" ]; then
    git init
    git remote add origin https://github.com/moazsam08-eng/bottt.git
fi

git add .
git commit -m "restore: Moaz Studio v17 full codebase"
git branch -M main
git push -f origin main

echo ""
echo "=============================="
echo "تم الرفع بنجاح! ارجع لـ Railway"
echo "=============================="
