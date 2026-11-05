#!/bin/sh
set -e
python manage.py migrate --noinput
[ "$SEED_DEMO" = "1" ] && python manage.py seed
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${WEB_CONCURRENCY:-2}
