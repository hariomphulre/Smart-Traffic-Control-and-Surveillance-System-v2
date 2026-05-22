#!/bin/sh
set -e

# Generate nginx conf from template using env vars
if [ -f /etc/nginx/conf.d/default.conf.template ]; then
  echo "Generating /etc/nginx/conf.d/default.conf from template"
  envsubst '$$PUBLIC_DOMAIN' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
fi

exec nginx -g 'daemon off;'
