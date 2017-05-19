/* Basic Demo to create soap server service.
* 1. http-proxy is used to create two level access point (external and internal).
* 2. basic auth for security.
* 3. get wsdl ready for this.
*/
var http = require('http');
var soap = require('soap');
var bodyParser = require('body-parser');
var auth = require('http-auth');
var basicAuth = require('basic-auth');
var httpProxy = require('http-proxy');
var fs = require('fs');
var util = require('util');
//var config = require('./config/config');
//var logger = require("./log");
//var sshelper = require('./soapserverhelper');

var d = require('domain').create();

d.on('error', function(err){
    // handle the error here
    console.log("below is the error caught. ******");
    console.log(err);
    console.log("above is the error caught. ^^^^^^");
});

/* avoid this in production */
process.on("uncaughtException", function(err) {
    if (process.env.release == "development")
    {
       console.log("uncaughtException happened.");
       console.log(err)
    }
})

d.run(function(){

    var proxy_port = 8000;
        var physical_IP = "http://192.168.1.2";

        /* actual port in use */
        var main_port = 60001;

        var rcvack_service_address = physical_IP + ":" + main_port;
        var rcvack_wsdl_file = "wsdl/recv_asyn.wsdl";

        var RecvAckService = {
      /* below function name must match with the wsdl definition */
      RECV_ACK_IN_Async: {
          RECV_ACK_IN_AsyncSOAP: {
              SI_RECV_ACK_IN : function(args, callback){
                console.log("SI_RECV_ACK_IN Started.");
                logger.log(args, 'debug');

                        /* save backup */
                console.log(args);
                //utils.saveStringToFile(filename, args, true, true);

                                //one-way process, be aware from node-soap
                callback({'result' : 'success'});
              }
          }
      }
    };

    var basic = auth.basic({
        realm: "COMMs XXX"
    }, function (username, password, callback) {
            // Use callback(error) if you want to throw async error.
            callback(username === "user" && password === "password");
      }
    );

    //http server
    var proxy = httpProxy.createProxyServer({});

    /*assume instr in format '/listener?wsdl' or '/listener' */
    function prepareUrlStr(instr)
    {
        var pQuesMark = instr.indexOf('?');
        if (pQuesMark != -1)
            return instr.substring(1, pQuesMark);
        else
            return instr.substring(1);
    }

    var proxyserver = http.createServer(basic, function(request,response){
      var requrl = request.url;
      console.log("request url:" + requrl);
      var rcvackStr   = "RECVACKIN"; //your string for identify

      if (rcvackStr === prepareUrlStr(requrl))
      {
          proxy.web(request, response, { target: rcvack_service_address});
      }
      else
      {
          console.log("wrong url");
          response.end("404: Not Found: " + request.url);

          var err = new Error('not found')
               throw err
      }
    });
    proxyserver.listen(proxy_port);

    /* common server */
    var commonServer = http.createServer(function(request,response) {
        response.end("404: Not Found: " + request.url);
     });
    commonServer.listen(main_port);

    /* rcv ack */
    var listenToDirRecvAck = '/RECVACKIN';
    var xmlRcvAck = require('fs').readFileSync(rcvack_wsdl_file, 'utf8');
    var prodSoapServer = soap.listen(commonServer, listenToDirRecvAck, RecvAckService, xmlRcvAck);

    console.log("listening on " + main_port + " ...");
});
