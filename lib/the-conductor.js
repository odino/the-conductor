var facadeManager = require('./facade-manager');
var argv    = require('optimist').argv;
var _s      = require('underscore.string');
var _       = require('underscore');
var logger  = require('winston');
var async   = require('async');
var router  = require('odino.router');
var fs      = require('fs');
var yaml    = require('js-yaml');

var theConductor = {
    mode:           argv.m || argv.mode || 'prod',
    config:         {},
    router:         router,
    facadeManager:  facadeManager,
    port:           argv.p || argv.port || 6971,
    addFacadeStrategy: function(name, fn) {
        facadeManager[_s.sprintf('%sSubrequests', name )] = fn;
    },
    loadConfigFile: function(filePath) {
        this.config = yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
    },
    orchestrate: function(route, request, response, info) {
        var facade  = route.facade;
        self        = this;
        resources   = [];

        if (this.config.facades[facade] != undefined) {
            facadeManager.execute(this.config.facades[facade], this.config.resources, route, request, response, info)
        } else {
            throw new Error(_s.sprintf('undefined facade "%s"', facade));
        }
    },
    onRequest:  function(request, response) {
        logger.log('info', _s.sprintf("%s %s", request.method, request.url));

        var info = {
            mode:  this.mode,
            start: new Date().getTime()
        }

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
        logger.log('info', _s.sprintf("[%d %s] %dms", response.statusCode, request.url, info.end - info.start));
    }
}

module.exports = theConductor;