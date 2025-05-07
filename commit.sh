#!/bin/bash

# Mostra lo stato del repository
git status

# Aggiunge tutte le modifiche
git add .

# Controlla se ci sono file da committare
if git diff --cached --quiet; then
    echo "Nessuna modifica da committare."
    exit 0
fi

# Usa il primo argomento come messaggio di commit, oppure lo chiede all’utente
if [ -z "$1" ]; then
    read -p "Inserisci il messaggio di commit: " commit_message
else
    commit_message="$1"
fi

# Esegue il commit
git commit -m "$commit_message"

# Controlla se il commit è riuscito prima di pushare
if [ $? -eq 0 ]; then
    git push
else
    echo "Commit fallito. Push non eseguito."
    exit 1
fi

