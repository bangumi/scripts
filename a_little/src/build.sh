#!/bin/bash

js=`git status | grep "js/"`

if [[ -z $js ]]; then
    exit 0
fi
script_list='tttt'

for f in $js ; do
    [[ $f =~ js\/(.*)\.js ]]
    if [[ -n ${BASH_REMATCH[1]} ]]; then
        script_list=$script_list,"\"${BASH_REMATCH[1]}\""
    fi
done
sed "/const.*TARGET_SCRIPT_LIST/s/\[.*\]/[${script_list#tttt,}]/" webpack.config.js > temp.config.js
./node_modules/webpack/bin/webpack.js --config temp.config.js
