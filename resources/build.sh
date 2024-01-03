#!/bin/bash
set -e

#set -u

# Copyright (c) 2020 - 2023 Alex313031 and Matt Brandly.

YEL='\033[1;33m' # Yellow
CYA='\033[1;96m' # Cyan
RED='\033[1;31m' # Red
GRE='\033[1;32m' # Green
c0='\033[0m' # Reset Text
bold='\033[1m' # Bold Text
underline='\033[4m' # Underline Text

# Error handling
yell() { echo "$0: $*" >&2; }
die() { yell "$*"; exit 111; }
try() { "$@" || die "${RED}Failed $*"; }

# --help
displayHelp () {
	printf "\n" &&
	printf "${bold}${GRE}Script to build and distribute Relay IRC!${c0}\n" &&
	printf "\n"
}
case $1 in
	--help) displayHelp; exit 0;;
esac

PATH="$PATH:node_modules/.bin"
appname="Relay IRC"
build="build"
dist="dist"

function main {
  npx rimraf "$build" "$dist" &&

  mkdir -p "$build/js" &&
  mkdir -p "$build/static" &&

  # Dependencies
  printf "${GRE}Installing production dependencies into $build ...${c0}\n" &&
  cp -v src/package.json "$build" &&

  # JavaScript
  printf "\n" &&
  printf "${GRE}Compiling JS with Babel...${c0}\n" &&
  printf "\n" &&
  cd src &&
  NODE_ENV=production babel ./js --out-dir "../build/js" &&
  cd .. &&

  # CSS compilation
  printf "\n" &&
  printf "${GRE}Compiling CSS with Saas...${c0}\n" &&
  npm run sass -- --output-style compressed &&

  # Static files
  printf "\n" &&
  printf "${GRE}Copying static files into $build ...${c0}\n" &&
  cp -v src/static/* "$build/static" &&
  cp -v src/index.js "$build/index.js" &&
  cp -v src/menu.js "$build/menu.js" &&
  cp -v src/.nvmrc "$build/.nvmrc" &&
  cp -v src/humans.txt "$build/humans.txt" &&
  grep -v 'babel/register' src/index.html > "$build/index.html"
}

function create_app {
  mkdir -p "$dist" &&
  # electron-builder --dir
  npm run builderDir &&
  printf "\n" &&
  printf "${GRE}Done building $appname!\n" &&
  printf "\n" &&
  printf "${YEL} - You will find the build in ./dist/*platform*-unpacked\n" &&
  printf "${YEL}   Where *platform* is the name of your OS.\n" &&
  printf "\n" &&
  tput sgr0
}

function create_app_dist {
  mkdir -p "$dist" &&
  # electron-builder
  npm run builderDist &&
  printf "\n" &&
  printf "${GRE}Done building $appname!\n" &&
  printf "\n" &&
  printf "${YEL}You will find the installers in ./$dist\n" &&
  printf "\n" &&
  tput sgr0
}

case $1 in
	--dir) main; create_app; exit 0;;
esac

case $1 in
	--dist) main; create_app_dist; exit 0;;
esac
