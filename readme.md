Chicago Works For You
=====================

![](http://dl.dropbox.com/u/19098/Screenshots/zl1d.png)
![](http://dl.dropbox.com/u/19098/Screenshots/0eki.png)

Chicago Works For You is a collection of tools to track and compare 311 requests in Chicago.

This project is a fork of the awesome 311.fm application designed and built by Code for America developers [Jesse Bounds](https://github.com/boundsj), [Angel Kittiyachavalit](https://github.com/akit), and [Mick Thompson](https://github.com/dthompson).

Technical Details
-----------------

The core application is a node.js app built on the [Backbone Boilerplate](https://github.com/tbranyen/backbone-boilerplate) framework.

The application queries a data API for ward comparison statistics. Code for the data API is hosted in the [smartchicago/311-fm-data](https://github.com/smartchicago/311-fm-data) repository. The API operates at http://chicagoworks-api.herokuapp.com/.

To run the server locally, run:

    npm install -g
    bbb server

The application will boot and be available at http://localhost:8000/, and query the production API endpoint.

Contributing
------------

Pull requests, issue reports, and suggestions are welcome. The project is supported by the [Smart Chicago Collaborative](http://smartchicagocollaborative.org).

