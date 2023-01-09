const fastify = require("fastify")({
  logger: true,
  ignoreTrailingSlash: true,
});

const { IoTDataPlaneClient, PublishCommand } = require("@aws-sdk/client-iot-data-plane");

const client = new IoTDataPlaneClient();

// fastify.register(require("@fastify/cors"), {
//   origin: "*",
//   methods: "POST,OPTIONS",
// });

// fastify.register(require('@fastify/static'), {
//   root: path.join(__dirname, 'static'),
// });

fastify.addContentTypeParser(
  "application/octet-stream",
  function (request, payload, done) {
    // payload is a stream, just pass it along as the request body
    let payloadArray = [];
    payload.on("data", (data) => {
      payloadArray.push(data);
    })
    payload.on("end", () => {
      console.log('on end', payloadArray);
      done(null, Buffer.concat(payloadArray));
    })
  }
);

fastify.post("/data", function (request, reply) {
  console.log(request.body);

  const command = new PublishCommand({
    topic: '/test',
    payload: request.body,
  });

  client.send(command).then((result) => {
    reply.send({ status: "OK" });
  })
  .catch((error) => {
    reply.status(500).send({ error: error.message });
  });
});

fastify.post("/data/:imei", function (request, reply) {
  console.log(request.body, request.params);

  const command = new PublishCommand({
    topic: `optimyze/gateway/laird/${request.params.imei}`,
    payload: request.body,
  });

  client.send(command).then((result) => {
    console.log(result);
    reply.send();
  })
  .catch((error) => {
    console.log(error);
    reply.status(500).send({ error: error.message });
  });
});

fastify.post("/gettime/:imei", function (request, reply) {
  console.log(request.body, request.params);

  let pl;
  try {
    console.log(request.body.toString('ascii'))
    pl = JSON.parse(request.body.toString('ascii'));
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }

  const command = new PublishCommand({
    topic: `optimyze/gateway/laird/${request.params.imei}/gettime`,
    payload: JSON.stringify(pl),
  });

  client.send(command).then((result) => {
    reply.header('Content-Type', 'application/json; charset=utf-8')
    if (Math.random() * 10 < 5) {
      reply.send(`{ "timestamp": ${Math.round(Date.now() / 1000)}, "device": ${pl.device} }`);
    } else {
      reply.send(`{ "device": ${pl.device}, "timestamp": ${Math.round(Date.now() / 1000)} }`);
    }
  })
  .catch((error) => {
    console.log(error);
    reply.status(500).send({ error: error.message });
  });
});

fastify.post("/shadow/:imei", function (request, reply) {
  console.log(request.body, request.params);

  let pl;
  try {
    console.log(request.body.toString('ascii'))
    pl = JSON.parse(request.body.toString('ascii'));
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }

  const command = new PublishCommand({
    topic: `$aws/things/deviceId-${request.params.imei}/shadow/update`,
    payload: JSON.stringify(pl),
  });

  client.send(command).then((result) => {
    reply.send();
  })
  .catch((error) => {
    console.log(error);
    reply.status(500).send({ error: error.message });
  });
});

fastify.get("/health", function (request, reply) {
  reply.send({ status: "OK" });
});

// load params from param store

fastify.listen({ port: 8080, host: 'localhost' }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Server is now listening on ${address}`);
});
