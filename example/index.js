var conductor   = require('../lib/the-conductor');
var http        = require('http');

conductor.router.routes.push({
    pattern: "/hello",
    facade: "or1"
});
conductor.loadConfigFile('./example/config.yml');
http.createServer(conductor.run()).listen(conductor.port);
console.log("server started on port " + conductor.port)