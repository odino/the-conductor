// require the mandatory dependencies
var conductor   = require('../lib/the-conductor');
var http        = require('http');

// add some routes
conductor.router.load({
    example: {
        pattern: "/example.json",
        facade: "f1"
    },
    greet: {
        pattern: "/greet/:name",
        facade: "greet"
    }
});

// add resources and facades via plain JS
conductor.config.resources = {
    whats_my_ip: {
        url: "http://ip.jsontest.com/"
    },
    date: {
        url: "http://date.jsontest.com/"
    }
};

conductor.config.facades = {
    'f1': {
        resources: [
            'whats_my_ip',
            'date'
        ]
    }
};

// or import them through a YML file
conductor.loadConfigFile('./example/config.yml');

// inject the conductor in your webserver and let the orchestra play!
http.createServer(conductor.run()).listen(conductor.getPort());
console.log("server started on port " + conductor.getPort() + " [" + conductor.getEnvironment() + ']')