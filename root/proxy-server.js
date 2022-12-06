const path = require("path");
const fastify = require("fastify")({
  logger: true,
  ignoreTrailingSlash: true,
});

const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const lambdaClient = new LambdaClient({
  // credentials: fromIni({ profile: "liquid-dev" }),
});

const Lambdas = {
  // File Service
  obj: `arn:aws:lambda:${process.env.AWSRegion}:${process.env.AWSAccountId}:function:ObjectFunction_${process.env.Environment}`,
};

fastify.register(require("@fastify/cors"), {
  origin: "*",
  methods: "POST,OPTIONS",
});

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'static'),
});

fastify.addContentTypeParser(
  "application/octet-stream",
  function (request, payload, done) {
    // payload is a stream, just pass it along as the request body
    done(null, payload);
  }
);

const logRequest = function (request) {
  console.log(
    // request,
    request.url,
    JSON.stringify(request.headers)
  );
  const lambdaRequest = {
    body: request.body,
    headers: request.headers,
    httpMethod: request.method,
    queryStringParameters: request.query,
    url: request.url,
  };

  if (request.params["*"]) {
    lambdaRequest.pathParameters = { path: request.params["*"] };
  }
  return lambdaRequest;
};

const sendResponse = function (result, reply, error) {
  if (error) {
    console.log("sendResponse error", error);
    return reply.code(error.statusCode || 500).send(error.message || "Error");
  } else {
    console.log("sendResponse result", result);
  }

  let lambdaResponse;
  if (result.Payload) {
    lambdaResponse = JSON.parse(Buffer.from(result.Payload).toString());
  } else {
    lambdaResponse = result;
  }

  let statusCode = lambdaResponse.StatusCode || lambdaResponse.statusCode

  if (
    lambdaResponse.headers &&
    lambdaResponse.headers["Content-Type"] === "application/octet-stream"
  ) {
    reply
      .code(statusCode)
      .headers(lambdaResponse.headers)
      .send(Buffer.from(lambdaResponse.body, "base64"));
  } else {
    try {
      reply
        .code(statusCode)
        .headers(lambdaResponse.headers)
        .send(lambdaResponse.body);
    } catch (error) {
      console.log(error);
      reply.code(500).send(error.message);
    }
  }
};

fastify.post("/data", function (request, reply) {
  logger.debug("POST data");
  console.log(request);

  // check ip against allowlist

  const lambdaRequest = logRequest(request);
  const command = new InvokeCommand({
    FunctionName: Lambdas.ca_request,
    Payload: JSON.stringify(lambdaRequest),
  });
  lambdaClient.send(command).then((result) => {
    sendResponse(result, reply);
  })
  .catch((error) => {
    sendResponse(null, reply, error);
  });
});

fastify.get("/health", function (request, reply) {
  logger.debug("GET healthcheck");
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
