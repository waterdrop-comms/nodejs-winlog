/* Copyright (c) 2015, Oracle and/or its affiliates. All rights reserved. */

/******************************************************************************
 *
 * You may not use the identified files except in compliance with the Apache
 * License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * NAME
 *   api.js
 *
 * DESCRIPTION
 *   Contains the logic for the main application API.
 *
 *****************************************************************************/

var express = require('express');
var database = require('./database.js');

function getRouter() {
    var router = express.Router();

    router.route('/personnel')
        .get(getEmps);

    router.route('/personnel/:PERCODE')
        .get(getEmpsByCode);


    router.route('/depts')
        .get(getDepts);

    return router;
}

module.exports.getRouter = getRouter;

function getEmpsByCode(req, res, next) {
    var query = require('url').parse(req.url, true).query;
    console.log(query);
    var per_code = req.params.PERCODE;
    var sqlstr =  'SELECT PER_CODE, ' +
        '    PER_NAME, ' +
        '    PER_CMPY, ' +
        '    PER_PASSWD ' +
        'FROM Personnel ' +
        'WHERE PER_CODE like \'%' + per_code + '%\''; /* testing only, not in production */

    console.log(sqlstr);

    database.simpleExecute( sqlstr,
        {}, //no binds
        {
            outFormat: database.OBJECT
        }
    )
        .then(function(results) {
            console.log(results);
            res.send(results);
        })
        .catch(function(err) {
            next(err);
        });
}


function getEmps(req, res, next) {
    console.log(req.params);
    database.simpleExecute(
        'SELECT PER_CODE, ' +
        '    PER_NAME, ' +
        '    PER_CMPY, ' +
        '    PER_PASSWD ' +
        'FROM Personnel',
        {}, //no binds
        {
            outFormat: database.OBJECT
        }
    )
        .then(function(results) {
            console.log(results);
            res.send(results);
        })
        .catch(function(err) {
            next(err);
        });
}
function getDepts(req, res, next) {
    database.simpleExecute(
        'SELECT department_id, ' +
        '    department_name, ' +
        '    manager_id, ' +
        '    location_id ' +
        'FROM departments',
        {}, //no binds
        {
            outFormat: database.OBJECT
        }
    )
        .then(function(results) {
            res.send(results);
        })
        .catch(function(err) {
            next(err);
        });
}


