var http    = require("http");
var _s      = require('underscore.string');
var _       = require('underscore');
var logger  = require('winston');
var async   = require('async');

var facadeManager = {
    joinSubrequests: function(resources) {
        var bodies = [];

        _.each(resources, function(resource){
            bodies.push(resource.response.body);
        });

        return bodies.join('');
    },
    completeSubrequest: function(facade, pendingResources, resources, request, response, info) {
        pendingResources -= 1;

        if (pendingResources == 0) {
            var strategy = _s.sprintf('%sSubrequests', facade.strategy || 'join');
            response.writeHead(200, {'Content-Type': facade.format || 'application/json'});
            response.write(self[strategy](resources));
            response.end();

            info.end = new Date().getTime();
            logger.log('info', _s.sprintf("[%d %s] %dms", response.statusCode, request.url, info.end - info.start));
        }

        return pendingResources;
    },
    execute: function(facade, resources, request, response, info) {
        var pendingResources    = facade.resources.length;
        self                    = this;
        var resourceCollection  = [];

        async.each(facade.resources, function(resource){
            http.get(resources[resource].url, function(res){
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