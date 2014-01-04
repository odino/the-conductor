var http    = require("http");
var _s      = require('underscore.string');
var _       = require('underscore');
var logger  = require('winston');
var async   = require('async');

var facadeManager = {
    joinSubrequests: function(resources, bodies) {
        return bodies.join('');
    },
    mergeSubrequests: function(resources) {
        var body = {};

        _.each(resources, function(resource){
            body = _.extend(body, JSON.parse(resource.response.body));
        });

        return JSON.stringify(body);
    },
    completeSubrequest: function(facade, pendingResources, resources, request, response, info) {
        pendingResources -= 1;

        if (pendingResources == 0) {
            var strategy = _s.sprintf('%sSubrequests', facade.strategy || 'join');
            response.writeHead(200, {'Content-Type': facade.format || 'application/json'});

            var bodies = [];

            _.each(resources, function(resource){
                bodies.push(resource.response.body);
            });

            response.write(self[strategy](resources, bodies));
            response.end();

            info.end = new Date().getTime();
            logger.log('info', _s.sprintf("[%d %s] %dms", response.statusCode, request.url, info.end - info.start));
        }

        return pendingResources;
    },
    execute: function(facade, resources, route, request, response, info) {
        var pendingResources    = facade.resources.length;
        self                    = this;
        var resourceCollection  = [];

        async.each(facade.resources, function(resource){
            var url = resources[resource].url;

            _.each(route.parameters, function(value, parameter){
                url = url.replace(':' + parameter, value);
            });

            http.get(url, function(res){
                body = '';

                res.on('data', function(chunk) {
                    body += chunk;
                });

                res.on('end', function() {
                    res.body = body;
                    resourceCollection.push({
                        url:        resources[resource].url,
                        response:   res
                    });
                    pendingResources = self.completeSubrequest(facade, pendingResources, resourceCollection, request, response, info);
                });
            });
        })
    }
};

module.exports = facadeManager;