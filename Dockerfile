FROM node:18

WORKDIR /app

RUN wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add - &&\
    echo "deb [ arch=amd64 ] http://repo.mongodb.org/apt/debian buster/mongodb-org/4.4 main" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list &&\
    apt-get update  &&\
    apt-get install -y mongodb-org &&\
    mkdir -p /data/db

ADD . /app

RUN npm config set unsafe-perm true
RUN npm install && npm install -g forever

COPY ./entrypoint.sh /

ENTRYPOINT ["/entrypoint.sh"]
CMD ["resourcebot"]
