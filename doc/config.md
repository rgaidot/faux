Configuration Options
===

**title**

Sets the window title. Equivalent to writing a snippet of code that is spliced into the `redirect` step, which takes place *after* anything is displayed. For example:

    magic_controller
      .display('spells', { title: 'Book of Magic' });

Or:

    magic_controller
      .display('vestaments', {
        route: '/vestaments/:colour',
        title: function (params) { return "Splendid " + params.colour + " Robes!"; }
      });
      
**location**

Sets the faux-route displayed in the location bar of the browser. Equivalent to writing a snippet of code that is spliced into the `redirect` step, which takes place *after* anything is displayed, but it does not actually cause a redirect of any kind.

The simplest example is this:

    magic_controller
      .display('spells', { location: true });

`lcoation: true` tells Faux to set the location to the current route. This is usually superfluous, however you might write some code that does something like this:

    magic_controller.spells();

That would display the `spells.haml` template, but if you hand't specified `location: true`, the location bar would remain unaltered. Now Faux resets the location bar so that bookmarking works properly.

This allows you to use direct method invocation to perform faux redirects instead of fooling around with URLs. For example:

    magic_controller
      .display('vestaments', {
        route: '/vestaments/:colour',
        title: function (params) { return "Splendid " + params.colour + " Robes!"; },
        location: true
      });
      
Now you can call `magic_controller.vestaments({ colour: 'blue'})` wherever you like and Faux will arrange for the title and location to be updated appropriately.

You can also manage the location more explicitly:

    magic_controller
      .display('foo', {
        location: '/fubar'
      })
      .display('bar', {
        location: function (params) { return 'bar/' + params.type; }
      })
      .display('frobbish', {
        location: '/frobbish/:type
      });
      
So far, we use `location: true` almost exclusively.

**redirects\_to**

Sets the faux-route displayed in the location bar of the browser. Equivalent to writing a snippet of code that is spliced into the `redirect` step, which takes place *after* anything is displayed, but it *does* cause the appropriate controller method to be triggered.

Example:

    SpellView = Backbone.View.extend({ ... });

    magic_controller
      .display('spell', {
        route: '/spell/:type',
        gets: '/spell/:type'
      })
      .action('invisibility', {
        redirects_to: '/spell/invisibility'
      });
      
This sets up an route `/invisibility` that redirects to `/spell/invisibility`.