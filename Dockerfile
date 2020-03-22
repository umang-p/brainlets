FROM python:alpine
LABEL maintainer="bruhmoment69@420blaze.it"

ARG PRODUCTION_SECRET=this_is_a_fake_key
ARG PRINT_DEBUG=True

COPY . /app
RUN chown -R 1000:1000 /app
WORKDIR /app
RUN pip install -r ./requirements.txt &&\
    pip install gunicorn
USER 1000
RUN set -xe &&\
    sed -e "s/this_is_a_fake_key/${PRODUCTION_SECRET}/1"\
        -e "s/DEBUG = True/DEBUG = ${PRINT_DEBUG}/1"\
        -e 's/ALLOWED_HOSTS = \[\]/ALLOWED_HOSTS = \[\"localhost\", \"127.0.0.1\"\]/1'\
        ./brainlets/brainlets/sample_settings.py\
        > ./brainlets/brainlets/settings.py
RUN python brainlets/manage.py collectstatic --noinput

EXPOSE 8000

WORKDIR /app/brainlets
CMD [ "python", "manage.py", "runserver", "0.0.0.0:8000" ]