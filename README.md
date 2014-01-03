# The Conductor

Jump into [the future of API design](http://thenextweb.com/dd/2013/12/17/future-api-design-orchestration-layer/)
and add an *orchestration layer* to your APIs.

In order to understand what an orchestration layer does, take a look at the following image:

![api comparison](http://cdn2.tnwcdn.com/wp-content/blogs.dir/1/files/2013/12/resource-v-experience-apis.png)

In simple words: an API Orchestration Layer (OL) is responsible for assembling different API responses
(ie. `/product/123` and `/product/123/reviews`) at a single endpoint (ie. `/view/web/product/123`), so that a service
can make one single call to that endpoint and retrieve all the informations needed to render its views with
a single API call.
The advantage of this is that:

* you can spread the workload over multiple, concurrent requests
* you can have very clean, separate, decoupled, resource-oriented APIs on the background

If your applications use different APIs to build user interfaces, you might want to invest on your own orchestra!
And in order for an orchestra to be succesfull, it needs a very good *conductor*.

Not a simple conductor, **the conductor**.

## Installation

You can simply include it via `npm install the-conductor`

## How it works

TBD

## Basic usage

TBD

## Configuration

TBD

## Custom facade strategies

TBD

## Tests

TBD