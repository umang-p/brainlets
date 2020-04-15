FROM python:alpine
LABEL maintainer="bruhmoment69@420blaze.it"

ARG PRODUCTION_SECRET=this_is_a_fake_key
ARG PRINT_DEBUG=True

COPY --chown=1000 ./brainlets /brainlets
COPY --chown=1000 ./requirements.txt /brainlets/requirements.txt
WORKDIR /brainlets
RUN pip install -r ./requirements.txt &&\
    pip install gunicorn
USER 1000
RUN set -xe &&\
    sed -e "s/this_is_a_fake_key/${PRODUCTION_SECRET}/1"\
        -e "s/DEBUG = True/DEBUG = ${PRINT_DEBUG}/1"\
        -e 's/ALLOWED_HOSTS = \[\]/ALLOWED_HOSTS = \[\"localhost\", \"127.0.0.1\"\]/1'\
        ./brainlets/sample_settings.py\
        > ./brainlets/settings.py
RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD [ "gunicorn", "--bind", "0.0.0.0:8000","--env", "DJANGO_SETTINGS_MODULE=brainlets.settings", "brainlets.wsgi" ]