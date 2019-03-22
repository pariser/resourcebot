FROM node:11

WORKDIR /app

RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4 &&\
    echo "deb http://repo.mongodb.org/apt/debian stretch/mongodb-org/4.0 main" | tee /etc/apt/sources.list.d/mongodb-org-4.0.list &&\
    apt-get update &&\
    apt-get install -y mongodb-org &&\
    mkdir -p /data/db

ADD . /app

RUN npm install 

COPY ./entrypoint.sh /

ENTRYPOINT ["/entrypoint.sh"]
CMD ["resourcebot "]
