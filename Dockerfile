FROM node:10-alpine
RUN mkdir gremlin-visualizer-master
COPY package*.json /gremlin-visualizer-master/

RUN npm cache clean --force && \
	cd gremlin-visualizer-master && \
	npm install

COPY proxy-server.js /gremlin-visualizer-master/
COPY src /gremlin-visualizer-master/src/
COPY public /gremlin-visualizer-master/public/


EXPOSE 3000 3001

WORKDIR /gremlin-visualizer-master

CMD npm start
