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
      done(null, Buffer.from(payloadArray));
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

fastify.post("/data/:sensorId", function (request, reply) {
  console.log(request.body, request.params);

  const command = new PublishCommand({
    topic: `/optimyze/gateway/laird/${request.params.sensorId}`,
    payload: request.body,
  });

  console.log('sending data');
  client.send(command).then((result) => {
    console.log(result);
    reply.send();
  })
  .catch((error) => {
    console.log(error);
    reply.status(500).send({ error: error.message });
  });
});

fastify.post("/gettime/:sensorId", function (request, reply) {
  console.log(request.body, request.params);

  const command = new PublishCommand({
    topic: `/optimyze/gateway/laird/${request.params.sensorId}/gettime`,
    payload: request.body,
  });

  client.send(command).then((result) => {
    reply.send({ timestamp: Date.now(), device: request.body.device });
  })
  .catch((error) => {
    console.log(error);
    reply.status(500).send({ error: error.message });
  });
});

fastify.post("/shadow/:sensorId", function (request, reply) {
  console.log(request.body, request.params);

  const command = new PublishCommand({
    topic: '/test',
    payload: request.body,
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
