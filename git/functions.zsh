# Pull the latest changes from upstream into your fork
function git-sync() {
	git checkout "$1" && git fetch upstream && git rebase upstream/"$1" && git push origin "$1"
}
