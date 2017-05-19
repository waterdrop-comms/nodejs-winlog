/* Demo to use node-soap lib to send data back to soap server.
 * 1. use synch way, avoid in production.
 * 2. basic auth or token, ssl, wss; favorite is username+key.
 * */
var fs = require('fs');
var soap = require('soap');
var config = require('./config/config');
var uuid = require('node-uuid');
var request = require('request');
var logger = require('../log');
var iconvlite = require('iconv-lite');

var endpoint = "config.wsserver.endpoint"; //web service end point
var url = "config.wsserver.url";           //web service url

var destDir  = "./data";
var tInterval  = 1000;
var debugfile  = "./log/clientlog.debuglog";
var errorfile  = "./log/clientlog.exceptlog";
var debuglevel = "debug";

var account  = "username";
var password = "password";

//initialize the debuger
if (!logger.isInited()) {
    logger.initialize(debugfile, errorfile, debuglevel);
}

/* [ UTF-8 character conversion may move it to utils */
String.prototype.strToChars = function (){
    var chars = new Array();
    for (var i = 0; i < this.length; i++){
        chars[i] = [this.substr(i, 1), this.isCHS(i)];
    }
    String.prototype.charsArray = chars;
    return chars;
}

//is in CHinese chars
String.prototype.isCHS = function(i){
    if (this.charCodeAt(i) > 255 || this.charCodeAt(i) < 0)
        return true;
    else
        return false;
}

//find substring, start...end
String.prototype.subCHString = function(start, end){
    var len = 0;
    var str = "";
    this.strToChars();
    for (var i = 0; i < this.length; i++) {
        if(this.charsArray[i][1])
            len += 3;
        else
            len++;

        if (end < len) {
            return str;
        }
        else if (start < len) {
            str += this.charsArray[i][0];
            //console.log("str is " + str);
        }
    }
    return str;
}

//start....length
String.prototype.subCHStr = function(start, length){
    return this.subCHString(start, start + length);
}
/* ] */

function SoapAsClient()
{
     var OKtoSend = true;
     var listOfFiles = [];
     var timerObj = setInterval(loopdir, tInterval, destDir);

     /*basic auth + ssl; header auth; pwd digest; wss
       here: basic auth only. */
     var auth = "Basic " + new Buffer(account + ":" + password).toString("base64");
//     var request_with_defaults = request.defaults({wsdl_headers : {Authorization: auth},
//                                            'timeout': 5000, 'connection': 'keep-alive'});
//     var soap_client_options = {'request': request_with_defaults};

     function soapClientSend(file) {
         OKtoSend = false;
         console.log(url + account + password);
         soap.createClient(url, {wsdl_headers: {Authorization: auth}}, function(err, client)
         {
             if (err != null) {
                 var msg = "failed to connect server. Err:" + err;
                 logger.log(msg, "error");
                 console.log(err);
             }

             client.addHttpHeader('connection', 'keep-alive');
             client.setSecurity(new soap.BasicAuthSecurity(account, password));

             //reest end point with new uuid
             var uuidstr = uuid.v4().toUpperCase();
             client.setEndpoint(endpoint + uuidstr);

             debugger;

             console.log("calling ....");

             var finalArgs = Object.assign(ackArgs, msgobj); //whatever you want
             console.log(finalArgs);

             /* get the operation name from your wsdl */
             client.SI_OPERATION_NAME(finalArgs, function(err, result){
                   if (err != null) {
                        console.log(err);
                        logger.log(err, "debug");
                   }
                   if (result)
                   {
                       console.log(result.body);
                   }
             });

             console.log("finished calling ....");

             //restart timer
             console.log("waiting for msg ...");
             timerObj = setInterval(loopdir, tInterval, destDir);

             OKtoSend = true;
        });
    };
    /* loop through to find files in directory */
    /* demo purpose using synchronous way */
    function loopdir(dir)
    {
         try {
             if (timerObj)
             {
                  clearInterval(timerObj);
                  timerObj = null;
             }

             if (listOfFiles)
                 listOfFiles.length = 0;

             listOfFiles = fs.readdirSync(dir);
             if (listOfFiles.length > 0)
                 console.log("found details file.");

             if (listOfFiles.length < 1)
             {
                 timerObj = setInterval(loopdir, tInterval, destDir);
                 return;
             }

             var nFiles = listOfFiles.length;
             if (nFiles > 1)
             {
                 /* sort by mod time */
                 listOfFiles.sort(function(a, b) {
                    return fs.statSync(dir + "/" + a).mtime.getTime() -
                         fs.statSync(dir + "/" + b).mtime.getTime();
                 });
             }

             /* handle file one by one */
             if (nFiles > 0) {
                 for (var fileCount = 0; fileCount < nFiles; fileCount++) {
                     soapClientSend(listOfFiles[fileCount]);
                     break;
                 }
             }

          } catch (err) {
               var msg = "message directory checking error."
                         + err + "," + dir;
               logger.log(msg, "error");
               console.log(msg);
          }
    };

};

module.exports = SoapAsClient;

