const express = require('express');
const bodyParser = require('body-parser');
const gremlin = require('gremlin');
const cors = require('cors');
const { getUrlAndHeaders } = require('gremlin-aws-sigv4/lib/utils');
const app = express();
const port = 3001;

app.use(cors({
  credentials: true,
}));

// parse application/json
app.use(bodyParser.json());

function mapToObj(inputMap) {
  let obj = {};

  inputMap.forEach((value, key) => {
    obj[key] = value
  });

  return obj;
}

function edgesToJson(edgeList) {
  return edgeList.map(
      edge => ({
        id: typeof edge.get('id') !== "string" ? JSON.stringify(edge.get('id')) : edge.get('id'),
        from: edge.get('from'),
        to: edge.get('to'),
        label: edge.get('label'),
        properties: mapToObj(edge.get('properties')),
      }),
  );
}

function nodesToJson(nodeList) {
  return nodeList.map(
      node => ({
        id: node.get('id'),
        label: node.get('label'),
        properties: mapToObj(node.get('properties')),
        edges: edgesToJson(node.get('edges')),
      }),
  );
}

function makeQuery(query, nodeLimit) {
  const nodeLimitQuery = !isNaN(nodeLimit) && Number(nodeLimit) > 0 ? `.limit(${ nodeLimit })` : '';
  return `${ query }${ nodeLimitQuery }.dedup().as('node').project('id', 'label', 'properties', 'edges').by(__.id()).by(__.label()).by(__.valueMap().by(__.unfold())).by(__.outE().project('id', 'from', 'to', 'label', 'properties').by(__.id()).by(__.select('node').id()).by(__.inV().id()).by(__.label()).by(__.valueMap().by(__.unfold())).fold())`;
}

function buildClient() {
  const gremlinHost = process.env.GREMLIN_HOST || "localhost";
  const gremlinPort = process.env.GREMLIN_PORT || 8182;
  const protocol = process.env.GREMLIN_PROTOCOL || "ws"

  let url = `${ protocol }://${ gremlinHost }:${ gremlinPort }/gremlin`;
  let headers = {};
  if (process.env.AWS_ACCESS_KEY_ID) {
    ({ url, headers } = getUrlAndHeaders(gremlinHost, gremlinPort, {}, '/gremlin', protocol));
  }

  console.log("Connecting to:" + url);
  return new gremlin.driver.Client(url, { traversalSource: 'g', mimeType: 'application/json', headers: headers });
}

const client = buildClient();

function isQueryForbidden(query) {
  if (process.env.GREMLIN_ALLOW_DESTRUCTIVE_QUERIES === "true") {
    return false;
  }
  const forbidden_commands = ["truncate()", "drop()"];
  for (let i = 0; i < forbidden_commands.length; i++) {
    if (query.includes(forbidden_commands[i])) {
      return true;
    }
  }
  return false;
}

app.post('/query', (req, res, next) => {
  const nodeLimit = req.body.nodeLimit;
  const query = req.body.query;
  if (isQueryForbidden(query)) {
    res.status(403).send("Query is Forbidden!")
    return;
  }

  let fullQuery = makeQuery(query, nodeLimit);
  console.log("Query: " + fullQuery);
  client.submit(fullQuery, {}).then((result) => {
        console.log("Result: " + result)
        res.send(nodesToJson(result._items));
      },
  ).catch((err) => {
    console.error(err);
    next(err)
  });

});

app.listen(port, () => console.log(`Simple gremlin-proxy server listening on port ${ port }!`));