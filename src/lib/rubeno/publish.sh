#!/bin/bash
set -e
cd "$(dirname "$0")" || exit 1

echo "Building and publishing Ruby gem..."
ruby publish.rb
