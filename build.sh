#!/bin/bash

# Copyright (c) 2020 - 2024 Alex313031 and Matt Brandly.

set -ue

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

function displayHelp {
	printf "${bold}${GRE}Script to build and distribute Relay IRC!${c0}\n" &&
	printf "${bold}${YEL}Use the --build flag to build the code${c0}\n" &&
	printf "${bold}${YEL}Use the --dir flag to make an unpacked distribution${c0}\n" &&
	printf "${bold}${YEL}Use the --dist flag to make distribution packages${c0}\n" &&
	printf "${bold}${YEL}Use the --help flag to show this help${c0}\n" &&
	printf "\n"
}

PATH="$PATH:./node_modules/.bin"
appname="Relay IRC"
build="./build"
dist="./dist"

function main {
  printf "${GRE}Cleaning up old build...${c0}\n" &&
  rimraf "$build" "$dist" &&
  printf "${YEL}Removed $build/ & $dist/${c0}\n" &&
  printf "\n" &&
  printf "${GRE}Setting up directories in $build...${c0}\n" &&

  mkdir -p "$build/js" &&
  mkdir -p "$build/static" &&

  # Dependencies
  cp -v src/package.json "$build" &&

  # JavaScript
  printf "\n" &&
  printf "${GRE}Compiling JS with Babel...${c0}\n" &&
  cd src &&
  NODE_ENV=production babel ./js --out-dir "../build/js" &&
  cd .. &&

  # CSS compilation
  printf "\n" &&
  printf "${GRE}Compiling CSS with Saas...${c0}" &&
  NODE_ENV=production npm run sass -- --output-style compressed &&

  # Static files
  printf "\n" &&
  printf "${GRE}Copying static files into $build...${c0}\n" &&
  cp -v src/static/* "$build/static" &&
  cp -v src/index.js "$build/index.js" &&
  cp -v src/menu.js "$build/menu.js" &&
  cp -v src/.nvmrc "$build/.nvmrc" &&
  cp -v src/humans.txt "$build/humans.txt" &&
  grep -v 'babel/register' src/index.html > "$build/index.html"
}

function create_app {
  mkdir -p "$dist" &&
  printf "\n" &&
  printf "${GRE}Building $appname with electron-builder${c0}\n" &&
  electron-builder --config electron-builder.json --dir &&
  printf "\n" &&
  printf "${GRE}Done building $appname!\n" &&
  printf "\n" &&
  printf "${YEL} - You will find the build in $dist/*platform*-unpacked\n" &&
  printf "${YEL}   Where *platform* is the name of your OS.\n" &&
  printf "\n" &&
  tput sgr0
}

function create_app_dist {
  mkdir -p "$dist" &&
  printf "\n" &&
  printf "${GRE}Building distribution packages for $appname with electron-builder${c0}\n" &&
  electron-builder --config electron-builder.json &&
  printf "\n" &&
  printf "${GRE}Done building $appname!\n" &&
  printf "\n" &&
  printf "${YEL}You will find the installers in $dist\n" &&
  printf "\n" &&
  tput sgr0
}

case $1 in
	--help) displayHelp; exit 0;;
esac

case $1 in
	--build) main; exit 0;;
esac

case $1 in
	--dir) main; create_app; exit 0;;
esac

case $1 in
	--dist) main; create_app_dist; exit 0;;
esac
