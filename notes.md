to remove file from history
git filter-branch --index-filter "git rm -rf --cached --ignore-unmatch .env" HEAD


and push force 
