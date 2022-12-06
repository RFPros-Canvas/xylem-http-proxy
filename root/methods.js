const {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  PutObjectTaggingCommand,
  GetObjectTaggingCommand,
} = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-provider-ini");

const S3PutObject = function (params) {
  let command = new PutObjectCommand(params);
  console.log("putting s3 object", params);

  return s3Client
    .send(command)
    .then((data) => {
      // process data.
      console.log("S3PutObject: Data: ", data);
      return data;
    })
    .catch((error) => {
      // error handling.
      console.log("S3PutObject: Error: ", error);
      throw error;
    })
    .finally(() => {
      // finally.
    });
};

const ResponseConstructor = function (err, event, barrel, result) {
  this.statusCode = 200;
  this.headers = {
    // 'Cache-Control': 'max-age=0',
    "Cache-Control": "no-cache,no-store",
    "Content-Type": "application/json",
  };
  this.body = {};

  if (!isNaN(parseInt(process.env.MAX_AGE))) {
    // this.headers['Cache-Control'] = process.env.MAX_AGE
  }

  if (err) {
    this.statusCode = err.statusCode;
    this.body.error = err.body;
  } else if (result && typeof result === "object") {
    this.body = result;
  }

  if (process.env.Environment !== "prod") {
    if (barrel && barrel.STATUS) {
      this.body.status = barrel.STATUS;
    } else {
      this.body.status = [];
    }
  }
  if (barrel) {
    console.log(JSON.stringify(barrel.STATUS));
  }
  this.body = JSON.stringify(this.body);
  this.headers["Content-Length"] = this.body.length;

  return this;
};

const Barrel = function (event, context) {
  this.AWS_REGION = process.env.AWS_REGION;
  this.STATUS = [];
  if (context) {
    this.AWS_ACCOUNT = context.invokedFunctionArn.split(":")[4];
  }

  if (event) {
    this.HTTP_METHOD = event.httpMethod;

    // silly, null type is object
    if (event.body !== null) {
      this.BODY = event.body;
    } else {
      this.BODY = {};
    }

    this.HEADERS = {};
    if (event.headers) {
      for (let k in event.headers) {
        this.HEADERS[k.toLowerCase()] = event.headers[k];
      }
      try {
        this.TOKEN = decodeURIComponent(event.headers["Authorization"]);
      } catch (error) {
        this.TOKEN = event.headers["Authorization"];
      }
    }

    this.QUERY_PARAMETERS = event.queryStringParameters || {};
    for (const k in this.QUERY_PARAMETERS) {
      try {
        this.QUERY_PARAMETERS[k] = decodeURIComponent(this.QUERY_PARAMETERS[k]);
      } catch (error) {
        this.QUERY_PARAMETERS[k] = this.QUERY_PARAMETERS[k];
      }
    }

    this.PATH_PARAMETERS = event.pathParameters || {};
    for (const k in this.PATH_PARAMETERS) {
      try {
        this.PATH_PARAMETERS[k] = decodeURIComponent(this.PATH_PARAMETERS[k]);
      } catch (error) {
        this.PATH_PARAMETERS[k] = this.PATH_PARAMETERS[k];
      }
    }

  }
};

module.exports = {
  S3PutObject,
  ResponseConstructor,
  Barrel,
};
