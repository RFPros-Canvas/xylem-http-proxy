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
    done(null, payload);
  }
);

fastify.post("/data", function (request, reply) {
  logger.debug("POST data");
  console.log(request);

  // check ip against allowlist
  const command = new PublishCommand({
    topic: '/test',
    payload: request.body,
  });

  client.publish(command).then((result) => {
    reply.send({ status: "OK" });
  })
  .catch((error) => {
    reply.status(500).send({ error: error.message });
  });
});

fastify.get("/health", function (request, reply) {
  reply.send({ status: "OK" });
});

// load params from param store

fastify.listen({ port: 8080, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Server is now listening on ${address}`);
});
