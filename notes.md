optimyze/gateway/laird/<<IMEI>>
optimyze/gateway/laird/<<IMEI>>/gettime
optimyze/gateway/laird/<<IMEI>>/memfault/chunk


CA Chain

Server cert & key signed by CA

discoveryName.namespace
service.http-proxy


### Manually Deploy Container after changes
- Codepipeline deployment step creates a new revision, but drops the service connect portmapping name. I think this is a bug in AWS.
- The coap proxy service needs to have service discovery enabled, client-server mode using the namespace created by the HTTP proxy