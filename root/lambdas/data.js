const async = require("async");
const methods = require("../methods");

exports.handler = (event, context, callback) => {
  console.log("event: ", JSON.stringify(event));
  console.log("context: ", JSON.stringify(context));

  const Top = function Top(next) {
    let barrel = new methods.Barrel(event, context);
    next(barrel.ERROR, barrel);
  };

  const methodStacks = {
    POST: [
      Top,
      function (barrel, next) {
        const path = event.url.split('/');
        let imei = path[3];
        // current topics:
        // optimyze/gateway/laird/<<IMEI>>
        // optimyze/gateway/laird/<<IMEI>>/gettime
        // optimyze/gateway/laird/<<IMEI>>/memfault/chunk


        // if route is telemetry
        if (path.length === 4) {
          // make a request to send to iot core telemetry topic
          // protobuff data
        } else if (path[4] === 'gettime') {
          // make a request to gettime telemetry topic
          // json, get response
        } else if (path[4] === 'memfault') {
          // make a request to send to iot core shadow topic          
          // probably not used
        }
      }
    ]
  }


}