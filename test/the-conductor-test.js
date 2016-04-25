var conductor   = require('../lib/the-conductor');
var http        = require('http');
var should      = require('should');

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

var host = 'http://localhost:' + conductor.getPort();
var server;

var createServer = function(port, onRequest){
    server = http.createServer(onRequest);
    server.listen(port);

    return server;
};

describe('the-conductor#run()', function () {
    before(function () {
        server = createServer(conductor.getPort(), conductor.run());
    });

    it('getPort() should return you the port conductor is running on', function (done) {
        conductor.getPort().should.be.eql(6971);
        conductor.config.port = 6972;
        conductor.getPort().should.be.eql(6972);
        done();
    });

    it('getEnvironment() should return you the environment used by conductor', function (done) {
        conductor.getEnvironment().should.be.eql('prod');
        conductor.config.environment = 'debug';
        conductor.getEnvironment().should.be.eql('debug');
        done();
    });

    it('should return 404 on a non-existing route', function (done) {
        http.get(host + '/not-found', function (res) {
            res.statusCode.should.be.eql(404);
            done();
        });
    });

    it('should return 200 when it finds resources', function (done) {
        var webserver = createServer(6792, function(req, res){
            res.writeHead(200, {})
            res.write('A');
            res.end();
        });

        conductor.config = {
            resources: {
                200: {
                    url: "http://localhost:6792"
                }
            },
            facades: {
                '200': {
                    resources: [
                        '200'
                    ]
                }
            }
        }

        conductor.router.load({
            ok200: {
                pattern: "/200",
                facade: "200"
            }
        });

        http.get(host + '/200', function (res) {
            res.statusCode.should.be.eql(200);
            res.setEncoding('utf8');
            res.on('data', function(chunk){
                chunk.should.be.eql('A');
                webserver.close();
                done();
            });
        });
    });

    it('should merge resources if you use the merge facade strategy', function (done) {
        var webserver = createServer(6792, function(req, res){
            if (req.url == '/a') {
                res.writeHead(200, {})
                res.write('{"a":"a"}');
                res.end();
            } else {
                res.writeHead(200, {})
                res.write('{"b":"b"}');
                res.end();
            }
        });

        conductor.config = {
            resources: {
                a: {
                    url: "http://localhost:6792/a"
                },
                b: {
                    url: "http://localhost:6792/b"
                }
            },
            facades: {
                'test': {
                    strategy: 'merge',
                    resources: [
                        'a',
                        'b'
                    ]
                }
            }
        }

        conductor.router.load({
            test: {
                pattern: "/test",
                facade: "test"
            }
        });

        var allRequestsCompleted = false;

        http.get(host + '/test', function (res) {
            var body = '';
            res.statusCode.should.be.eql(200);
            res.setEncoding('utf8');
            res.on('data', function(chunk){
                body += chunk;
            });

            res.on('end', function(){
                body.should.be.eql('{"a":"a","b":"b"}');
                webserver.close();
                done();
            });
        });
    });

    it('should join resources by default', function (done) {
        var webserver = createServer(6792, function(req, res){
            res.writeHead(200, {})
            res.write('A');
            res.end();
        });

        conductor.config = {
            resources: {
                200: {
                    url: "http://localhost:6792"
                }
            },
            facades: {
                '200': {
                    resources: [
                        '200',
                        '200',
                        '200',
                        '200',
                        '200'
                    ]
                }
            }
        }

        conductor.router.load({
            ok200: {
                pattern: "/200",
                facade: "200"
            }
        });

        var allRequestsCompleted = false;

        http.get(host + '/200', function (res) {
            var body = '';
            res.statusCode.should.be.eql(200);
            res.setEncoding('utf8');
            res.on('data', function(chunk){
                chunk.should.be.eql('A');
                body += chunk;
            });

            res.on('end', function(){
                body.should.be.eql('AAAAA');
                webserver.close();
                done();
            });
        });
    });

    it('should be able to pass parameters to its resources', function (done) {
        var webserver = createServer(6792, function(req, res){
            res.writeHead(200, {})
            res.write(req.url);
            res.end();
        });

        conductor.config = {
            resources: {
                hello: {
                    url: "http://localhost:6792/hello/:name"
                }
            },
            facades: {
                'hello': {
                    resources: [
                        'hello'
                    ]
                }
            }
        }

        conductor.router.routes = {
            hello: {
                pattern: "/hello/:name",
                facade: "hello"
            }
        };

        http.get(host + '/hello/john', function (res) {
            res.statusCode.should.be.eql(200);
            res.setEncoding('utf8');
            res.on('data', function(chunk){
                chunk.should.be.eql('/hello/john');
                done();
            });
        });
    });

    after(function () {
        server.close();
    });
});
