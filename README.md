# The Conductor

## Why?

Jump into [the future of API design](http://thenextweb.com/dd/2013/12/17/future-api-design-orchestration-layer/)
and add an *orchestration layer* to your APIs.

In order to understand what an orchestration layer does, take a look at the following image:

![api comparison](http://cdn2.tnwcdn.com/wp-content/blogs.dir/1/files/2013/12/resource-v-experience-apis.png)

In simple words: an API Orchestration Layer (OL) is responsible for assembling different API responses
(ie. `/product/123` and `/product/123/reviews`) at a single endpoint (ie. `/view/web/product/123`), so that a service
can make one single call to that endpoint and retrieve all the informations needed to render its views with
a single API call.

The advantage of this approach is that:

* you can spread the workload over multiple, concurrent requests
* you can have very clean, separate, decoupled, resource-oriented APIs on the background

If your applications uses different APIs to build user interfaces, you might want to invest on your own orchestra!
And in order for an orchestra to be succesfull, it needs a very good *conductor*.

Not a simple conductor, **the conductor**.

## Installation

You can simply include it via `npm install the-conductor`

This package follow semantic versioning, so if you want to always ensure backwards compatibility just use:

```
"the-conductor": "~0.1"
```

## How it works

There are 2 main concepts that you will have to understand before using the conductor:

* **resources**: these are objects representing your resource-oriented APIs, that the conductor will call in order
to assemble its responses
* **facade**: the endpoint of the conductor, a facade allows you to define which resources should be aggregated
there (and a few other, minor, things, like how the conductor should assemble the responses from the sub-requests it
makes)

## Usage

Using the conductor it's a matter of a few lines of code:

```
var conductor   = require('the-conductor');
var http        = require('http');

http.createServer(conductor.run()).listen(conductor.port);
console.log("server started on port " + conductor.port)
```

and then you can simply run `node yourFile.js`: by default, the conductor will run on port `6971`, but you can override
this setting by just specifying the port during the startup process (for example `-p 8080`).

## Configuration

Of course, the above example won't be very helpful since we are not telling the conductor on which routes it should
listen to, nor which facades to run for those routes; to do that, we simply have to 1. add some routes and 2. add facades
and configure them.

In order for our conductor to respond to a request hitting `http://example.org/web/view/users/john`, for example, we simply need
to add a new route (the router used by the conductor is [odino.router](https://npmjs.org/package/odino.router)):

```
conductor.router.routes.push({
    id:         'web_user_details',
    pattern:    "/web/view/users/:username",
    facade:     "user_detail"
});
```

In this way we are telling the conductor that for whichever request that hits `/web/view/users/:username` it will need
to run the `user_detail` facade. But how do we define what the facade does?

We can simply populate the `conductor.config` object with these informations:

```
conductor.config = {
    resources: {
        user_details: {
            url: "http://api.example.org/users/:username"
        },
        user_friends: {
            url: "http://api.example.org/users/:username/friends"
        }
    },
    facades: {
        'web_user_details': {
            resources: [
                'user_details',
                'user_friends'
            ]
        }
    }
}
```

or, alternatively (recommended), dump the configuration in a more readable YML file and load it:

```
conductor.loadConfigFile('./path/to/your/config.yml');
```

The YML would then look very simple:

```
resources:
 user_detail:
    url:  "http://api.example.org/users/:username"
  user_friends:
    url:  "http://api.example.org/users/:username/friends"
facades:
  web_user_details:
    resources:
      - user_detail
      - user_friends

```

At this point everything should be a bit clearer:

* whenever someone hits `http://example.org/web/view/users/:username` the conductor will match the route `web_user_details`
* at that point, it will see that it needs to run the facade `user_detail`
* the conductor will then look into its config, finding out that it needs to hit `http://api.example.org/users/:username`
and `http://api.example.org/users/:username/friends`, assembles the responses and serve them to the client

Simple as that!

## Facade strategies

A **facade strategy** is what the conductor runs to assemble the sub-responses it obtains from a facade's resources.

The conductor comes bundled with some very simple strategies:

* **join**, which simply joins all the response bodies altogether

In order to specify which facade strategy to use for a particular facade, simply specify it in your config:

```
facades:
  web_user_details:
    strategy: join
    resources:
      - user_detail
      - user_friends
```

## Custom facade strategies

You can also register and use your own facade strategies by simply specifying them in your configuration and register
them inside the conductor.

First, update your configuration:

```
facades:
  web_user_details:
    strategy: custom
    resources: ...
```

then register the strategy in the conductor:

```
conductor.addFacadeStrategy('custom', function(resources){
    return resources[0].response.body;
});
```

In this example, the `custom` facade strategy only returns the body of the first sub-response.

## Example

Have a look at the [example folder](https://github.com/odino/the-conductor/tree/master/example) in the source code.

You can also run the example with `node example/inde.js`.

## Tests

TBD