#!/bin/bash
set -e
set -u

PATH="$PATH:node_modules/.bin"
appname="Relay"
build="build/"
dist="dist/"

function main {
  npx rimraf "$build" "$dist" &&

  mkdir -p "$build/js" &&
  mkdir -p "$build/static" &&

  # dependencies
  echo "Installing production dependencies into $build..." &&
  cp src/package.json "$build" &&

  # js
  echo "Compiling JS with Babel..." &&
  cd src &&
  NODE_ENV=production babel ./js --out-dir "../build/js" &&
  cd .. &&

  # css
  npm run sass -- --output-style compressed &&

  # static
  echo "Copying static files into $build..." &&
  cp src/static/* "$build/static" &&
  cp src/index.js "$build/index.js" &&
  cp src/menu.js "$build/menu.js" &&
  cp src/.nvmrc "$build/.nvmrc" &&
  cp src/humans.txt "$build/humans.txt" &&
  grep -v 'babel/register' src/index.html > "$build/index.html" &&

  create_app_dist
}

function create_app_dist {
  mkdir -p "$dist" &&
  npm run builderDir &&
  echo "Done building $appname"
}

main
