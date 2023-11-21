FROM python:3.10-slim-buster

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

WORKDIR /src

ADD requirements.txt /src/

RUN python -m pip install -r requirements.txt

COPY tenant_operator /src
COPY tenant_operator/templates /templates

CMD [ "/bin/sh", "-c", "kopf run tenant.py" ]