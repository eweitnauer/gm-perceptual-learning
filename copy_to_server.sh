rsync -avz --exclude '.DS_Store' --exclude '.gitignore' --exclude '.git' --exclude 'copy_to_server.sh' --exclude 'database-structure.md' --exclude 'README.md' \
  -e "ssh" --delete ./* perceptsconcepts@perceptsconcepts.psych.indiana.edu:/Library/Server/Web/Data/Sites/Default/experiments/ew/gm-pl-1.1/
