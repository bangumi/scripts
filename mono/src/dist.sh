#!/bin/bash

set -ue
cd $(dirname "$0")

npm run webpack:prod
for entry in bgm-eps-editor ; do
  cat header/$entry.js prod/$entry.min.js > ../$entry.user.js
done
