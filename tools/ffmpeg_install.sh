#!/bin/bash
# Auto-detect and install FFmpeg if missing
# Supports: macOS (brew), Linux (apt-get/yum), Windows (winget)

set -euo pipefail

detect_install() {
  if command -v ffmpeg &> /dev/null && command -v ffprobe &> /dev/null; then
    echo "FFmpeg already installed: $(ffmpeg -version 2>&1 | head -n1)"
    return 0
  fi

  echo "FFmpeg not found. Attempting to install..."

  case "$(uname -s)" in
    Darwin)
      if command -v brew &> /dev/null; then
        echo "Installing FFmpeg via Homebrew..."
        brew install ffmpeg
      else
        echo "Error: Homebrew not found. Install from https://brew.sh"
        return 1
      fi
      ;;
    Linux)
      if command -v apt-get &> /dev/null; then
        echo "Installing FFmpeg via apt-get..."
        sudo apt-get update && sudo apt-get install -y ffmpeg
      elif command -v yum &> /dev/null; then
        echo "Installing FFmpeg via yum..."
        sudo yum install -y ffmpeg
      elif command -v dnf &> /dev/null; then
        echo "Installing FFmpeg via dnf..."
        sudo dnf install -y ffmpeg
      else
        echo "Error: No supported package manager found. Install FFmpeg manually."
        return 1
      fi
      ;;
    MINGW*|CYGWIN*|MSYS*)
      if command -v winget &> /dev/null; then
        echo "Installing FFmpeg via winget..."
        winget install --id=Gyan.FFmpeg -e --accept-package-agreements --accept-source-agreements
      else
        echo "Error: winget not found. Install FFmpeg from https://ffmpeg.org"
        return 1
      fi
      ;;
    *)
      echo "Error: Unsupported OS: $(uname -s)"
      echo "Install FFmpeg manually from https://ffmpeg.org"
      return 1
      ;;
  esac

  # Verify installation
  if command -v ffmpeg &> /dev/null; then
    echo ""
    echo "FFmpeg installed successfully: $(ffmpeg -version 2>&1 | head -n1)"
    echo "ffprobe installed: $(ffprobe -version 2>&1 | head -n1)"
  else
    echo "Error: FFmpeg installation failed. Please install manually."
    return 1
  fi
}

echo "=========================================="
echo "FFmpeg Installer"
echo "=========================================="
detect_install
echo "=========================================="
echo "Done."
echo ""
echo "Tip: Run 'npm run extract-clips' to extract video segments."
