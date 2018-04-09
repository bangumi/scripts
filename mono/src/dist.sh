#!/bin/bash

set -ue
cd $(dirname "$0")

npm run webpack:prod &
npm run webpack &
wait

for entry in bgm-eps-editor ; do
  cat header/$entry.js prod/$entry.min.js > ../dist/$entry.min.user.js
  cat header/$entry.js dev/$entry.js      > ../dist/$entry.user.js
  cat header/$entry.js loader/$entry.js   > ../dist/$entry.loader.js
done
