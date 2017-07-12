#!/bin/bash

set -ue
cd $(dirname "$0")

npm run webpack:prod
npm run webpack
for entry in bgm-eps-editor ; do
  cat header/$entry.js prod/$entry.min.js > ../$entry.min.user.js
  cat header/$entry.js dev/$entry.js      > ../$entry.user.js
done
