#!/bin/bash

MESSAGE=$1

if [ -z "$MESSAGE" ]; then
  MESSAGE="updates"
fi

git add .
git commit -m "$MESSAGE"
git push

