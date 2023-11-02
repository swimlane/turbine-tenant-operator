FROM python:3.10-slim-buster
WORKDIR /src

ADD requirements.txt /src/

RUN python -m pip install -r requirements.txt

COPY tenant_operator /src
COPY tenant_operator/templates /templates

CMD [ "/bin/sh", "-c", "kopf run tenant.py --verbose" ]