'use strict';
var fs = require('fs')
var winston = require('winston');

//default log location
var debugfileD  = "/usr/data/log/log_debug.log";
var errorfileD  = "/usr/data/log/log_exception.log";
var debuglevelD = "error";

//debug level allowed:  debug  info error  xxx xxx 
// this is used as up to level
var valDL = (debuglevelD == "debug") ? 0 : (debuglevelD == "info" ? 1 : 2);
var filesize = 10000000;

var logger;
var hasInitialised = false;

var winlogger = {
    logTimestamp : function() {
          return new Date().toString();  //change to different format as you want
    },

    initialize : function(debugfile, errorfile, debuglevel)
    { 
         /* check if path exists, otherwise just create it. */ 
         var reg = /[^\/]*$/;
         var debugpath = debugfile.replace(reg, '');
         var errorpath = errorfile.replace(reg, '');
         if (!fs.existsSync(debugpath)) {
              fs.mkdirSync(debugpath);
         }
         if (!fs.existsSync(errorpath)) {
              fs.mkdirSync(errorpath);
         }

         if (!debugfile) {
             debugfile = debugfileD; 
         }

         if (!errorfile) {
             errorfile = errorfileD;  
         }

         if (!debuglevel){
             debuglevel = debuglevelD;
         } else {
             valDL = (debuglevel == "debug") ? 0 : (debuglevel == "info" ? 1 : 2);
         }

         //console.log(debugfile);
         logger = new (winston.Logger)({
           transports: [
//               new (winston.transports.Console)({ json: false, timestamp: true, level: 'error' }),
               new winston.transports.File({ filename: debugfile, json: false, level: debuglevel,  
                                             maxsize: filesize, timestamp: winlogger.logTimestamp })
           ],
           exceptionHandlers: [
//               new (winston.transports.Console)({ json: false, timestamp: true, level: 'error' }),
               new winston.transports.File({ filename: errorfile, json: false, level: debuglevel,  
                                             maxsize: filesize, timestamp: winlogger.logTimestamp })
           ],
           exitOnError: false
         });

         if (logger) {
             hasInitialised = true;
         } else {
             hasInitialised = false;
         }
    },

    isInited : function() {
         return hasInitialised;           
    },
    
    log : function(message, level){
         var valLevel = (level == "debug") ? 0 : (level == "info" ? 1 : 2);
         //console.log("level is " + level + ", default is " + valDL);

	 //initialize should run first.
	 if (!logger)
            return;

         if (valLevel >= valDL)
         {
            switch(level) {
            case 'debug':
                logger.debug(message);
                break;
            case 'info':
                logger.info(message);
                break;
            case 'error':
                logger.error(message);
                break;
            default:
                logger.error(message);
                break;
            }
         }
    }
}; 

module.exports = winlogger;

