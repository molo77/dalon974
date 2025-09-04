#!/bin/bash

# Script pour envoyer des emails via Postfix
# Usage: ./send-email.sh <email> <subject> <content_file>

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

# Envoyer l'email via Postfix
cat "$CONTENT_FILE" | mail -s "$SUBJECT" "$EMAIL"

# Vérifier le statut
if [ $? -eq 0 ]; then
    echo "Email envoyé avec succès à $EMAIL"
    exit 0
else
    echo "Erreur lors de l'envoi de l'email à $EMAIL"
    exit 1
fi

