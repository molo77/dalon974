#!/bin/bash

# Script pour envoyer des emails via Postfix pour www-data
# Usage: ./send-email-www-data.sh <email> <subject> <content_file>

if [ $# -ne 3 ]; then
    echo "Usage: $0 <email> <subject> <content_file>"
    exit 1
fi

EMAIL="$1"
SUBJECT="$2"
CONTENT_FILE="$3"

# Vérifier que le fichier de contenu existe
if [ ! -f "$CONTENT_FILE" ]; then
    echo "Erreur: Le fichier de contenu $CONTENT_FILE n'existe pas"
    exit 1
fi

# Créer un fichier temporaire avec les bons en-têtes
TEMP_EMAIL="/tmp/email-$(date +%s).txt"

# Construire l'email avec les bons en-têtes
cat > "$TEMP_EMAIL" << EOF
From: noreply@depannage-informatique974.fr
To: $EMAIL
Subject: $SUBJECT
Content-Type: text/plain; charset=utf-8

$(cat "$CONTENT_FILE")
EOF

# Utiliser sendmail
sendmail -t < "$TEMP_EMAIL"
SENDMAIL_STATUS=$?

# Nettoyer le fichier temporaire
rm -f "$TEMP_EMAIL"

# Vérifier le statut
if [ $SENDMAIL_STATUS -eq 0 ]; then
    echo "Email envoyé avec succès à $EMAIL"
    exit 0
else
    echo "Erreur lors de l'envoi de l'email à $EMAIL"
    exit 1
fi
