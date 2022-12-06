# 
FROM alpine:3.16.2
RUN apk update && apk upgrade

ENV ALPINE_MIRROR "http://dl-cdn.alpinelinux.org/alpine"
RUN echo "${ALPINE_MIRROR}/edge/main" >> /etc/apk/repositories
RUN apk add --no-cache nodejs-current  --repository="http://dl-cdn.alpinelinux.org/alpine/edge/community"
RUN node --version

EXPOSE 8080

# set current working directory
WORKDIR /usr/src/app

# copy our application files
COPY ./root/ .
RUN ls

ARG Environment
ENV DEPLOYMENT=$Environment
ENV Environment=$Environment

ENTRYPOINT ["/usr/bin/node"]
CMD ["proxy-server"]
