#!/usr/bin/env bash
set -euo pipefail

REPO="camhahu/browser"
INSTALL_DIR="$HOME/.browser/bin"

RED='\033[0;31m'
GREEN='\033[0;32m'
DIM='\033[0;2m'
NC='\033[0m'

error() { echo -e "${RED}Error: $1${NC}" >&2; exit 1; }

# Detect OS
case "$(uname -s)" in
  Darwin) os="darwin" ;;
  Linux) os="linux" ;;
  MINGW*|MSYS*|CYGWIN*) os="windows" ;;
  *) error "Unsupported OS: $(uname -s)" ;;
esac

# Detect arch
case "$(uname -m)" in
  x86_64) arch="x64" ;;
  arm64|aarch64) arch="arm64" ;;
  *) error "Unsupported architecture: $(uname -m)" ;;
esac

# macOS Rosetta detection
if [ "$os" = "darwin" ] && [ "$arch" = "x64" ]; then
  if sysctl -n sysctl.proc_translated 2>/dev/null | grep -q 1; then
    arch="arm64"
  fi
fi

target="$os-$arch"
filename="browser-$target"
if [ "$os" = "windows" ]; then
  filename="$filename.exe"
fi

echo -e "${DIM}Installing browser ($target)...${NC}"

# Get latest version
version=$(curl -sI "https://github.com/$REPO/releases/latest" | grep -i "^location:" | sed -n 's/.*\/v\([^[:space:]]*\).*/\1/p' | tr -d '\r')
[ -z "$version" ] && error "Failed to get latest version"

url="https://github.com/$REPO/releases/download/v$version/$filename"

mkdir -p "$INSTALL_DIR"

if [ "$os" = "windows" ]; then
  curl -fsSL "$url" -o "$INSTALL_DIR/browser.exe" || error "Failed to download binary"
else
  curl -fsSL "$url" -o "$INSTALL_DIR/browser" || error "Failed to download binary"
  chmod +x "$INSTALL_DIR/browser"
fi

echo -e "${GREEN}Installed browser v$version${NC} to $INSTALL_DIR"

# Add to PATH if needed
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
  shell_config=""
  case "$(basename "${SHELL:-bash}")" in
    zsh) shell_config="$HOME/.zshrc" ;;
    bash) 
      if [ -f "$HOME/.bashrc" ]; then
        shell_config="$HOME/.bashrc"
      else
        shell_config="$HOME/.bash_profile"
      fi
      ;;
    fish) shell_config="$HOME/.config/fish/config.fish" ;;
  esac

  if [ -n "$shell_config" ] && [ -f "$shell_config" ]; then
    if ! grep -q "$INSTALL_DIR" "$shell_config" 2>/dev/null; then
      echo "" >> "$shell_config"
      echo "# browser" >> "$shell_config"
      if [ "$(basename "${SHELL:-bash}")" = "fish" ]; then
        echo "fish_add_path $INSTALL_DIR" >> "$shell_config"
      else
        echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> "$shell_config"
      fi
      echo -e "${DIM}Added to PATH in $shell_config${NC}"
    fi
  else
    echo -e "${DIM}Add to your PATH:${NC} export PATH=\"$INSTALL_DIR:\$PATH\""
  fi
fi

echo ""
echo "Run 'browser --help' to get started (restart your shell or run 'source $shell_config')"
