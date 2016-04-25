var facadeManager = require('./facade-manager');
var argv    = require('optimist').argv;
var _       = require('lodash');
var logger  = require('winston');
var async   = require('async');
var router  = require('odino.router');
var fs      = require('fs');
var yaml    = require('js-yaml');

var theConductor = {
    config:         {
        environment: argv.e || argv.env || 'prod',
        port:        argv.p || argv.port || 6971
    },
    router:         router,
    facadeManager:  facadeManager,
    addFacadeStrategy: function(name, fn) {
        facadeManager[`${name}Subrequests`] = fn;
    },
    loadConfigFile: function(filePath) {
        this.config = _.extend(this.config, yaml.safeLoad(fs.readFileSync(filePath, 'utf8')));
    },
    getPort: function() {
        return this.config.port;
    },
    getEnvironment: function() {
        return this.config.environment;
    },
    orchestrate: function(route, request, response, info) {
        var facade      = route.facade;
        var self        = this;
        var resources   = [];

        if (this.config.facades[facade] != undefined) {
            facadeManager.execute(this.config.facades[facade], this.config.resources, route, request, response, info)
        } else {
            throw new Error(`undefined facade "${facade}"`);
        }
    },
    onRequest:  function(request, response) {
        logger.log('info', `${request.method} ${request.url}`);

        var info = {
            environment:    this.getEnvironment(),
            start:          new Date().getTime()
        }

        var route;

        if (route = router.resolve(request)) {
            try {
                this.orchestrate(route, request, response, info);
            } catch (err) {
                logger.log("error", err.message);
                this.http404(request, response, info);
            }
        } else {
            this.http404(request, response, info);
        }
    },
    run: function() {
        function createBoundedWrapper(object, method) {
            return function() {
                return method.apply(object, arguments);
            };
        }

        return createBoundedWrapper(this, this.onRequest);
    },
    http: function(response, status, body, headers) {
        response.writeHead(status, headers);

        if (body) {
            response.write(body);
        }

        response.end();
    },
    http404: function(request, response, info) {
        this.http(response, 404, null, {"Content-Type": "text/plain"})
        info.end = new Date().getTime();
        logger.log('info', `[${response.statusCode} ${request.url}] ${info.end - info.start}ms`);
    }
}

module.exports = theConductor;
