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
    orchestrate: function(facade, request, response, info) {
        self        = this;
        resources   = [];

        if (this.config.facades[facade] != undefined) {
            facadeManager.execute(this.config.facades[facade], this.config.resources, request, response, info)
        } else {
            throw new Error(_s.sprintf('undefined facade "%s"', facade));
        }
    },
    onRequest:  function(request, response) {
        logger.log('info', _s.sprintf("%s %s", request.method, request.url));

        var info = {
            start: new Date().getTime()
        }

        if (route = router.resolve(request)) {
            try {
                this.orchestrate(route.facade, request, response, info);
            } catch (err) {
                logger.log("error", err.message);
                this.http404(response);
            }
        } else {
            this.http404(response);
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
    http404: function(response) {
        this.http(response, 404, null, {"Content-Type": "text/plain"})
    }
}

module.exports = theConductor;