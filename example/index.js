// require the mandatory dependencies
var conductor   = require('../lib/the-conductor');
var http        = require('http');

// add some routes
conductor.router.routes.push({
    pattern: "/example",
    facade: "f1"
});

// add resources and facades via plain JS
conductor.config = {
    resources: {
        whats_my_ip: {
            url: "http://ip.jsontest.com/"
        },
        date: {
            url: "http://date.jsontest.com/"
        }
    },
    facades: {
        'f1': {
            resources: [
                'whats_my_ip',
                'date'
            ]
        }
    }
}

// or import them through a YML file
conductor.loadConfigFile('./example/config.yml');

// inject the conductor in your webserver and let the orchestra play!
http.createServer(conductor.run()).listen(conductor.port);
console.log("server started on port " + conductor.port)