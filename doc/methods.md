Methods
===

**steps**

By default, there are five steps that are executed in order: `['get_params', 'fetch_data', 'transform', 'display', 'redirect']`.

**more about writing your own steps**

As mentioned in the [readme][r], you can write your own function and slot it in the options like this:

    magic_controller
      .display('coven', {
        gets: { models: '/witches' },
        transform: function (parameters) {
          return {
            model: {
              models: parameters.models,
              length: parameters.models.length
            }
          };
        }
      });

In this case, we're transforming parameters of:

    {
      models: [ ... ]
    }

Into:

    {
      model: {
        models: [ ... ],
        length: 3
      }
    }

There are some subtleties, of course. Sometimes you don't want to change the parameters, you just want to do something of your own. No problem, if your function doesn't return anything, Faux leaves the parameters untouched:

    function (parameters) {
      window.console && console.log(parameters);
    }
    
Another is that Faux actually passes three parameters to each function. The first is the `parameters` that you often want to read or manipulate. The second is some `options` that Faux uses privately for its own purposes. Obviously, you mess with those at your peril. If you're curious, you can write:

    function (parameters, options) {
      window.console && console.log(options);
    }

The third parameter is quite important. Faux doesn't actually chain the functions together as shown above in our "ridiculously simple" example. If it did, it couldn't handle the case where a function returns nothing. Also, it couldn't handle asynchronous operations like fetching the template from the server or for that matter, fetching data from the server.

Like many other Javascript code bases, Faux uses [Continuation-Passing Style][cps] (or "CPS") to chain the functions together. If you declare a function with one or two parameters, Faux assumes that your function is synchronous and calls your function then calls any subsequent functions immediately after your function returns.

Therefore, if you write something like:

    transform: function (parameters) {
      jQuery.get('/somequery', parameters, function (data, textStatus, XMLHttpRequest) {
        do_something(data);
      }, 'json');
    }
    
Your function will return immediately and `do_something(data)` will get called whenever jQuery receives a response from the server. If you want to perform an action before the method moves onto the next step, you need to write a function taking all three parameters, like this:

    transform: function (parameters, options, callback) {
      jQuery.get('/foo/bar', parameters, function (data, textStatus, XMLHttpRequest) {
        parameters.fubar = data;
        callback(parameters, options);
      }, 'json');
    }
    
Now Faux will assume that you are managing the chain of steps and will pass the future of the method chain as the `callback` parameter.

[r]: ../README.MD#readme