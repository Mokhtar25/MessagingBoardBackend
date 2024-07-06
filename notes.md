to remove file from history
git filter-branch --index-filter "git rm -rf --cached --ignore-unmatch .env" HEAD

add skeleton while loading old messages

and push force 
