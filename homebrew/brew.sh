# Check for Homebrew and install if we don't have it
if test ! $(which brew); then
  echo "  Installing Homebrew for you."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

brew update
brew upgrade

read -p "Do you want to install all homebrew packages? (y/n) " -n 1;
echo "";
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Install all our dependencies with bundle (See Brewfile)
  brew tap homebrew/bundle
  brew bundle
fi;

brew cleanup