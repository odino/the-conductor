var http    = require("http");
var _       = require('lodash');
var logger  = require('winston');
var async   = require('async');
var hh      = require('http-https');

var facadeManager = {
    joinSubrequests: function(response, resources, defaultHeaders) {
        response.writeHead(200, defaultHeaders);

        _.each(resources, function(resource){
            response.write(resource.response.body);
        });

        response.end();
    },
    mergeSubrequests: function(response, resources, defaultHeaders) {
        response.writeHead(200, defaultHeaders);
        var body = {};

        _.each(resources, function(resource){
            body = _.extend(body, JSON.parse(resource.response.body));
        });

        response.write(JSON.stringify(body));
        response.end();
    },
    getDefaultHeaders: function(format, info, resources) {
        var headers = {
            'Content-Type': format || 'application/json'
        };

        if (info.environment == 'dev') {
            var urls = [];
            info.end = new Date().getTime();

            _.each(resources, function(resource){
                var url = resource.response.req._headers.host + resource.response.req.path;
                urls.push(url);

                var headerName = "The-Conductor-Resource-" + url;

                headers[headerName] = resource.response.body;
            });

            headers["The-Conductor-Resources"]          = urls.join(", ");
            headers["The-Conductor-Resources-Count"]    = urls.length;
            headers['The-Conductor-Time-Elapsed']       = info.end - info.start;
        }

        return headers;
    },
    completeSubrequest: function(facade, pendingResources, resources, request, response, info) {
        pendingResources -= 1;

        if (pendingResources == 0) {
            var strategy = `${facade.strategy || 'join'}Subrequests`;
            this[strategy](response, resources, this.getDefaultHeaders(facade.format, info, resources));
            info.end = new Date().getTime();
            logger.log('info', `[${response.statusCode} ${request.url}] ${info.end - info.start}ms`);
        }

        return pendingResources;
    },
    execute: function(facade, resources, route, request, response, info) {
        var pendingResources    = facade.resources.length;
        var self                = this;
        var resourceCollection  = [];

        async.each(facade.resources, function(resource){
            var url = resources[resource].url;

            _.each(route.parameters, function(value, parameter){
                url = url.replace(':' + parameter, value);
            });

            hh.get(url, function(res){
                var body = '';

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
