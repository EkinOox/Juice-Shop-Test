#!/bin/bash

# Script complémentaire pour les mots de passe restants

cd /Users/ekinoox/Documents/GitHub/Juice-Shop

for file in test/api/*.ts; do
    # Remplacer les nouveaux mots de passe identifiés
    sed -i "" "s/password: 'ship coffin krypt cross estate supply insurance asbestos souvenir'/password: testPasswords.chatbotMnemonic/g" "$file"
    sed -i "" "s/password: 'testtesttest'/password: testPasswords.chatbotTest/g" "$file"
    sed -i "" "s/password: 'kitten lesser pooch karate buffoon indoors'/password: testPasswords.erasure/g" "$file"
    sed -i "" "s/password: 'kunigunde'/password: testPasswords.kunigunde/g" "$file"
    sed -i "" "s/password: 'monkey summer birthday are all bad passwords but work just fine in a long passphrase'/password: testPasswords.passphrase/g" "$file"
done

# Traiter aussi les fichiers frontend
for file in frontend/src/app/**/*.spec.ts; do
    if [ -f "$file" ]; then
        # Ajouter import si contient des passwords
        if grep -q "password: '" "$file"; then
            if ! grep -q "import { testPasswords }" "$file"; then
                last_import=$(grep -n "^import " "$file" | tail -1 | cut -d: -f1)
                if [ -n "$last_import" ]; then
                    sed -i "" "${last_import}a\\
import { testPasswords } from '../../../test/testPasswords'
" "$file"
                fi
            fi
            sed -i "" "s/password: 's3cr3t!'/password: testPasswords.twoFaSecret/g" "$file"
            sed -i "" "s/password: 'aaaaa'/password: testPasswords.weak/g" "$file"
            sed -i "" "s/password: 'password'/password: testPasswords.password/g" "$file"
            sed -i "" "s/password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='/password: testPasswords.bjoernOAuth/g" "$file"
        fi
    fi
done

echo "Remplacement complémentaire terminé!"
