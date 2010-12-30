Faux
===

Faux is a Javascript utility for building [Single Page Interface][spi] (or "SPI") applications using the [Backbone][b] library's models, views, and controllers. Faux isn't a framework: Faux doesn't ask you to learn a new, [non-portable][wicmajsp] abstraction in lieu of using MVC (we actually call it MVP, but [that's another story][mvp]). Instead, Faux provides you with a very simple DSL for declaring view classes and wiring them up to a controller that implements client-side routes.

Faux applications strongly resemble traditional server-side client applications. They are route-centric. While a server application might have routes like `http://prestidigitation.unspace.ca/spells/` or `/ingredients/42`, Faux applications have faux-routes like `/#/spells/` and `/#/ingredients/42`.

This approach is not a one-size-fits-all for writing SPI applications.

* Some applications are extremely simple and don't need the support for events and interaction that views provide. A framework like [Sammy][s] might be a good choice.
* Some applications are small but need some support for interaction. Using Backbone directly might be the best choice, as this [example][todo] shows.
* Many client-side applications ought to feature rich and varied interaction that doesn't revolve around routes. You might want to roll your own code on top of [Backbone][b] or jump right into a more sophisticated tool like [Sproutcore][sprout].

Our bet is that Faux is a good choice for applications with lots of functions that break neatly down into "pages," but fairly straightforward interactions on each page. For these applications, you may want to provide users with the benefits of a web interface they already understand: bookmarkable, back-buttonable locations. We're also betting that  a declarative syntax for defining the skeleton of your application is easier to maintain than a collection of classes wired together in an ad hoc fashion, so much so that if Faux isn't for you, you'll probably end up rolling something similar for yourself that is closely tailored to your needs.

**our motivation**

In our own case, we were building an application that mapped neatly onto a traditional CRUD server-side interface, however it was important for us to segregate the domain logic into a domain entity server and the UI into a separate application-specific code base. While in theory this is easy to do in a single Rails application, our experience is that in practice, domain and application logic blur. So we looked at building two Rails applications, a RESTful domain logic server and an application server using ActiveResource as model proxies.

Once we realized how much Javascript we'd be adding to support application logic in the client, the idea of having what amounts to three separate code bases became unpalatable, so we embarked on building all of the application logic into the client and keeping the domain server lean, mean, clean, and RESTful.

Thus, Faux is optimized to act as a font end for a RESTful domain logic server.

Basic Faux
---

**setting up a faux application**

For starters, you need a server that can deliver a page to host your application and the necessary Javascript files. If you're using Rails with Haml on the server, your application directory will look like this (non-essential directories elided):

    rails_application_directory
      app
        ...
      config
        ...
      db
        ...
      haml
        index.haml
      lib
        ...
      public
        hamljs
          ...
        javascripts
          underscore.js
          backbone.js
          haml-js.js
          faux.js
          application.js

We've set things up so that our Rails app serves a single page for the route `/`, and we're using Haml to serve that page, so it's template is `index.haml`. You can serve HTNL directly by putting index.html in the `public` folder if you prefer, of course, and if you prefer another server, you can use any technique you like to serve a simple page for the `/` path.

Here's what `index.haml` looks like:

    !!!
    %html{:lang => 'en'}
      %head
        %title My Application
        %meta{:charset => 'utf-8'}
    
        %script{:src => '/javascripts/underscore.js',  :type => 'text/javascript' }
        %script{:src => '/javascripts/backbone.js',    :type => 'text/javascript' }
        %script{:src => '/javascripts/haml-js.js',     :type => 'text/javascript' }
        %script{:src => '/javascripts/faux.js',        :type => 'text/javascript' }

        %script{:src => '/javascripts/application.js', :type => 'text/javascript' }
    
      %body
    
        .container
        
This loads Faux's dependencies, Faux itself, and provides a container element (`.container`) that Faux will work with. You can decorate the page with headers, footers, and so forth if you like. You can use multiple containers. You can do a lot of things, but for now let's stick with a simple, single container application.

All of our own code that defines the application will go into `application.js`. Lets have a look at it.

**application.js**

The concept behind Faux is extremely simple. When you include `faux.js` in your application, you get a Backbone controller class, `Faux.Controller`. You use an instance of `Faux.Controller` to build all of the faux-pages in your application. So you start by creating an instance of the controller. This code goes in `application.js`:

    magic_controller = new Faux.Controller({ 
      element_selector: '.container',
      partial: 'hamljs',
      partial_suffix: '.haml',
      title: 'My Application'
    });
    
We'll define our individual routes later. Before we do that, let's finish with the basic application initialization.

Once the page has fully loaded, we need to tell Backbone to start managing history so that the back button will work properly:

    $(function() {
      Backbone.history.start();
    });
    
At this point the application will serve all of the faux urls we will be defining later. There's just one "problem:" If we load our index page without supplying a faux route, nothing will be loaded and the user will face a blank page. For example, if the user loads `/`, they get a blank page, whereas if they load `/#/`, they will be directed to whatever route we define for the faux url `#/`

There are two fixes for this. One fix is to put some default HTML in the container. This is good for dealing with graceful degradation, but limits what we can put on the default page because we can't make use of Faux's support for backbone views and other goodies we'll read about below.

So instead, we'll include the following snippet:

    $(function() {
      Backbone.history.start();
      window.location.hash || magic_controller.home();
    });
    
This extra line of code checks to see whether there's a hash to interpret as a faux url. If there isn't, it invokes the `.home()` method on our controller. Let's see how we define such methods.

**defining faux routes and controller methods**
    
As we noted above, Faux provides a utility, not an abstraction. You can write any methods you want for `magic_controller`, Faux simply provides a short-hand for the most common methods you'd write when constructing a route-centric application.

Let's see how it works. We'll define the simplest possible method:

    magic_controller
      .display('home');

The `.display` method creates a method in your controller, `magic_controller.home()`.By default, this method fetches a Haml template from `/hamljs/home.haml` and uses that to render the HTML that the user sees into the current page inside the element identified by the jQuery selector `.container`.

Our favourite letter of the alphabet is [K][k], so you also can write things like:

    magic_controller
      .display('spellbook')
      .display('robe');

Also by default, Faux creates a faux route in your application that is extracted from the name of the method. Thus, calling `.display('home')` will create a method `.home()` and also create a faux route of `/home`. This route is bound (using Backbone's controller architecture) to your method. 

Let's be clear what we mean by "faux route." A real route is something like `http://prestidigitation.unspace.ca/`. When we say there is a faux route of `/home`, we mean that the *anchor* of the real route will be `/home`. So the complete location in the user's browser would be `http://prestidigitation.unspace.ca/#/home`. The complete location is always real route + `#` + faux route.

You can take control over the finer details by overriding Faux's defaults using a hash of options. Here is an example:

    magic_controller
      .display('home', {
        route: '/'
      });

Now the faux route `/` is bound to the `.home()` method instead of `/home`. And because of the initialization code we added to application.js, `.home()` will be triggered using the actual route `/` or the faux route `/` (locations `http://prestidigitation.unspace.ca/` or `http://prestidigitation.unspace.ca/#/`).

**parameters**

The route option is interesting. You can add some simple parameter interpolation:

    magic_controller
      .display('headgear', {
        route: '/hat/:type'
      });

Just as you would expect from working with Backbone's controllers or other frameworks, this matches routes like `#/hat/pointed`. Faux routing differs from Backbone's routing when parameters are involved. In Backbone, the route `#/hat/pointed` is equivalent to invoking `magic_controller.headgear("pointed")`. In Faux, the route `#/hat/pointed` is equivalent to invoking `magic_controller.headgear({ type: "pointed" })`. Faux prefers named to positional parameters at all times.

Parameters can be used in your Haml templates, of course, so you can add things like this to your Haml templates:

    %h2= type
    
And you can probably deduce what the following does to the displayed page:

    magic_controller
      .display('vestaments', {
        route: '/vestaments/:colour',
        title: function (params) { return "Splendid " + params.colour + " Robes!"; }
      });
      
**views**

From the basics above, you can see how Faux provides a simple DSL for building a backbone controller with methods that render views in the form of Haml templates. If you stop right there, you have the simplest possible [(~M)VC][mvp] architecture. But it won't be long before you want to add a little interaction in the client.

The best way to do this in Faux is to start using some Backbone views. In Faux, you can associate a view with a faux page. Here's the explicit way to do it:

    VestamentsView = Backbone.View.extend({ });

    magic_controller
      .display('vestaments', {
        route: '/vestaments/:colour',
        clazz: VestamentsView
      });
      
Now when the route `/#/vestaments/blue` is invoked, the `.vestaments()` method will create a new instance of `VestamentsView` and pass its initialization method `{ colour: 'blue' }` as a parameter. You can write your own `.intitialize()` method to do whatever you like with that, of course. To quote the Backbone documentation:

> When creating a new View, the options you pass are attached to the view as `this.options`, for future reference. There are several special options that, if passed, will be attached directly to the view: `model`, `collection`, `el`, `id`, `className`, and `tagName`. If the view defines an **initialize** function, it will be called when the view is first created. If you'd like to create a view that references an element *already* in the DOM, pass in the element as an option: `new View({el: existingElement})`

Faux isn't done yet. If you neglect to write a `.render()` method for your view, Faux writes one for you. Faux's render method uses the Haml template to render the page contents, however it does so using the instance of the view as the default context. Your Haml template can include lines like this:

    %h2= this.options.type
    
If you want to write code that is called when the view is rendered, but still want to use Faux's templates, you can use a little aspect-oriented programming. Simply write your own `.before_render()` and/or `.after_render()` methods and Faux will call them before and after `.render()` is invoked. With a View class in place, you can add event handling and methods as you see fit to create the appropriate interaction in an unobtrusive way.

**an example view class**

Here's a simple example extracted from a recent project. This view's model is a `Backbone.Collection` instance. The template (not shown) has a hidden form for adding a new spell.

There are two events the view manages. When you click on an element with the CSS class `add_spell`, it shows the hidden form. When you click the form's submit button, it bundles all the form element's values into a hash. This becomes the attributes for a new spell added to the collection with the `.create(...)` method. When `.create(...)` successfully completes, you hide the form again.

    var SpellsView = Backbone.View.extend({
      
      model: SpellsCollection, // not shown
  
      // Backbone's DOM event handling. We declare an event by name, an optional 
      // jQuery selector, and a method to call.
      events: {
        'click .add_spell'   : 'show_spell_form',
        'submit'             : 'submit_spell'
      },
  
      initialize: function () {
        var view = this;
        this.model.bind('refresh', function () {
          view.render();
        });
        // *TODO: Implement a feature to add one spell without re-rendering everything*
        this.model.bind('add', function () {
          view.render();
        });
      },
  
      show_spell_form: function () {
        $('form', this.el).show('slow');
      },
      
      submit_spell: function (event) {
        event.preventDefault();
        event.stopPropagation();
        var form = $(event.target).parents('form').andSelf().filter('form');
        var attrs = _(form.serializeArray()).foldl(function (acc, obj) {
          return (acc[obj.name] = obj.value) && acc) || acc;
        }, {});
        this.model.create(attrs, { success: function () {
          $('form', this.el).hide('fast');
        }});
      }

    });

All of this is plain vanilla Backbone.js. Faux's contribution is to make it easy to everything up with a few lines of code like this:

    magic_controller
      .display('spells', {
        gets: { model: '/spells' }
      });

Now the view gets a `.render()` method that invokes the `spells.haml` template and when you invoke the `/spells` faux route, you see your spells. Note that it's also possible to wire up the `SpellsCollection` to fetch its own contents, in which case you could just write:

    magic_controller
      .display('spells');

*You can read more about Faux and views in [More About Views][v].*
      
**playing well with others**

The examples so far give a flavour for declaring views and populating them with parameters extracted from the route. But these days, nobody uses applications that don't talk to a server (where by "nobody," we mean "[fewer than 10,000,000 people][api]").

Let's start with the simplest case: performing a `GET`. Nothing could be easier:

    magic_controller
      .display('spells', {
        gets: '/spells'
      });
      
Given a `gets` option (or `get`, if you prefer that), Faux builds a `.spells(...)` method that uses AJAX to performs  `GET` back to the server, passing it the route's parameters (if any). It expects the results in `JSON` format.

You shouldn't have any trouble figuring out what happens if you type `posts: '/foo'`, `puts: '/bar'`, or `deletes: '/bash'`, but let's stick with `gets` for now: By default, the result from the server is mixed in with your parameters was a parameter called `server_data`. So given a route of `/#/spells`, Faux will issue `GET /spells` to the server. Hand-waving over error handling for now, let's say the server responds with a JSON of:

    [
      { id: 1, name: 'invisibility' },
      { id: 2, name: 'teleportation' }
    ]
    
Faux will blend that in with the parameters. Since there weren't any, the result is now:

    {
      server_data: [
        { id: 1, name: 'invisibility' },
        { id: 2, name: 'teleportation' }
      ]
    }
    
You can get that directly within the template, or you can have it added to your `SpellsView` instance as `this.options`. That being said, you might not care for Faux's default choice of `server_data`. Here's how to change it:
    
    magic_controller
      .display('spells', {
        gets: { models: '/spells' }
      });

And now the options passed to your `SpellsView` instance are:

    {
      models: [
        { id: 1, name: 'invisibility' },
        { id: 2, name: 'teleportation' }
      ]
    }

Configuring your parameter name(s) has interesting implications for integrating smoothly with Backbone's `Model` classes. before we discuss things in more detail, we should discuss parameterizing server requests. Let's say we write:
    
    magic_controller
      .display('spells', {
        gets: { models: '/spells' }
      })
      .display('spell', {
        route: '/spells/:id',
        gets: { model: '/spells/:id' }
      });

Now when we have a route of `/#/spells/42`, Faux issues `GET /spells/42` and the parameters coming back might be something like:

    {
      id: '42',
      model: {
        id: 42,
        name: 'Bolt of Disruption'
      }
    }
    
Note that the original parameter is preserved and will be passed along to your `SpellView` initialization. In this example the server's route has the same structure as the client's faux route, but that needn't be the case:

    magic_controller
      .display('spell', {
        route: '/cast_:id',
        gets: { model: '/spells/search' }
      });
      
In this case, a route of `/#/cast_42` will result in a request to the server of `GET /spells/search?id=42`.

Pop quiz: What do you think will happen if you type the following?

    magic_controller
      .display('spell', {
        route: '/spells/:id',
        gets: { model: '/spells/:id', history: '/spells/:id/history' }
      });
      
That's right, Faux will issue two AJAX request to the server. When both have returned, your `parameters` will look something like this:

    {
      id: '42',
      model: {
        id: 42,
        name: 'Bolt of Disruption'
      },
      history: [
        {
          cast: '20101225',
          by: 'Theis'
        },
        {
          cast: '20100614',
          by: 'Merlin'
        },
        // ...
      ]
    }

**methods step by step**

If you're writing server and client together, you can make one suit the other. But you may need to munge things a bit to make everything work. Alas, this is our lot as programmers. We dream at night of building towers of pure logic, but we spend our days mating copper wire with knob-and-tube wiring or re-routing plumbing around a building's extension.

Faux can't read your architect's mind, but it does provide a few tools for modifying the methods it creates. When Faux builds a method like `magic_controller.spells()`, it does so by composing a series of functions together into a pipeline. The initial parameters go in one end, and each function along the way can augment or even entirely change the parameters as it goes along.

Radically simplified, Faux writes something like this:

    function spell (params) {
      spell_redirect(
        spell_display(
          spell_transform(
            spell_fetch_data(
              spell_get_params(
                params
              )
            )
          )
        )
      );
    }

I said it was radically simplified. Let's work at a higher level of abstraction. By default, there are five steps that are executed in order: `['get_params', 'fetch_data', 'transform', 'display', 'redirect']`.

Faux writes a function for you for some of those steps. You can probably guess which ones for the examples given so far: When you write a `gets` option, Faux writes a `fetch_data` function for you. Unless you override Faux's partial handling by writing `partial: false` and don't declare a view, Faux writes a `display` function for you. Faux uses the `get_params` step for something we haven't explained yet called an *unobtrusive handler*, and uses the `redirect` step for something rare, an *action*. The `transform` step is always left undefined by Faux so that you can do whatever you want with it.

We see you want a little more detail so here it is. You can write your own function and slot it in the options like this:

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

*You can read more about writing your own steps in [Methods][m].*

**free advice**

You usually write a `transform` like this:

    transform: function (params) {
      jQuery.extend(params, {
        // some more stuff
      });
    }
    
Very simple. And for that matter, you don't even have to write a `tranform`. Faux also supports *step advice*. You can write `before_` and `after_` steps that are mixed into the steps that Faux writes for you. So you can also write:

    magic_controller
      .display('coven', {
        gets: { models: '/witches' },
        before_display: function (parameters) {
          return {
            model: {
              models: parameters.models,
              length: parameters.models.length
            }
          };
        }
      });
      
The two techniques may seem indistinguishable, however the difference will become abundantly clear in the next section when we discuss sharing definitions with *scopes*. For now, file away the following cryptic rule: When you declare more than one `before_` or `after_` step, they are chained together just as the steps are chained together.

**scopes: re-using definitions**

Sometimes you want to make several different definitions share some commonality. Faux supports this with *scopes*. Scopes use `.begin` and `.end` methods to ape the way lexical scope works in languages like Javascript (jQuery uses the same technique with `.find` and `.end`). Here's an example:

    magic_controller
      .begin({
        route: 'headgear',
        partial: 'hats'
      })
        .display('hats', {
          route: '',
          gets: { models: '/hats' },
          partial: 'plural'
        })
        .display('hat', {
          route: ':id',
          gets: { models: '/hats/:id' },
          partial: 'singular'
        })
        .end();

We establish a scope with `.begin(...)` and end it with `.end()`. In between, we call `.display(...)` twice, and each of those calls is inside our scope. Faux notes that your scope includes values for `route` and `partial`, and it acts as if you'd written:

    magic_controller
      .display('hats', {
        route: '/headgear',
        gets: { models: '/hats' },
        partial: 'hats/plural'
      })
      .display('hat', {
        route: 'headgear/:id',
        gets: { models: '/hats/:id' },
        partial: 'hats/singular'
      });

Faux knows that `route` and `partial` scopes should nest like paths nest, with `/` separators. Scopes are completely optional, of course, but used in conjunction with indenting as shown above, they help to make your code's appearance resemble its behaviour, which is an important consideration when [writing programs for people to read][read].

Scopes also help you share code. You recall we said that Faux chains `before_` and `after_` step advice. Here's a contrived example:

    magic_controller
      .begin({
        route: 'headgear',
        after_fetch_data: function (params) {
          if (params.models) {
            var models = params.models;
            delete params.models;
            params.model = {
              models: models,
              length: models.length
            };
          }
        },
        partial: 'hats'
      })
        .display('hats', {
          route: '',
          gets: { model: '/hats' },
          partial: 'plural'
        })
        .display('hat', {
          route: ':id',
          gets: { models: '/hats/:id' },
          partial: 'singular'
        })
        // insert other calls to .display here
        .end();

This code automatically massages any `models` parameter into `model: { models: [...], length: n }` form for all of the methods defined in its scope. And because `after_` calls are chained, you can write:

    magic_controller
      .begin({
        route: 'headgear',
        after_fetch_data: function (params) {
          if (params.models) {
            var models = params.models;
            delete params.models;
            params.model = {
              models: models,
              length: models.length
            };
          }
        },
        partial: 'hats'
      })
        .display('hats', {
          route: '',
          gets: { model: '/hats' },
          after_display: function (params) {
            // this gets called after the scope's "after_display"
          },
          partial: 'plural'
        })
        .display('hat', {
          route: ':id',
          gets: { models: '/hats/:id' },
          partial: 'singular'
        })
        // insert other calls to .display here
        .end();


*Faux and its documentation is still a work in progress: Future additions to this document may or may not include discussions about handling error codes, directly invoking methods, unobtrusive handlers, and some of the other macros such as `title`, `infers`, `redirects_to`, and `location`.*

*Faux was conceived on August 19, 2010 as "Roweis." A remark by Jeremy Ashkenas that we were creating a "Faux Server API" led to its new name.*

[s]: http://github.com/quirkey/sammy "sammy_js"
[sinatra]: http://www.sinatrarb.com/
[couch]: http://couchdb.apache.org/
[cloud]: http://getcloudkit.com/
[spa]: http://en.wikipedia.org/wiki/Single_page_application "Single Page Application"
[haml]: http://haml-lang.com/ "#haml"
[core]: http://www.ridecore.ca "CORE BMX and Boards"
[prg]: http://en.wikipedia.org/wiki/Post/Redirect/Get
[aanand]: http://github.com/aanand/
[jamie]: http://github.com/jamiebikies
[raganwald]: http://github.com/raganwald
[functional]: http://osteele.com/sources/javascript/functional/
[spi]: http://itsnat.sourceforge.net/php/spim/spi_manifesto_en.php "The Single Page Interface Manifesto"
[b]: http://documentcloud.github.com/backbone/
[mvp]:  http://github.com/raganwald/homoiconic/blob/master/2010/10/vc_without_m.md#readme "MVC, PVC and (¬M)VC"
[todo]: http://documentcloud.github.com/backbone/examples/todos/index.html
[sprout]: http://www.sproutcore.com/
[wicmajsp]: http://raganwald.posterous.com/why-i-call-myself-a-javascript-programmer "Why I Call Myself a Javascript Programmer"
[k]: https://github.com/raganwald/JQuery-Combinators
[api]: http://www.joelonsoftware.com/articles/APIWar.html "How Microsoft Lost the API War"
[t]: https://github.com/raganwald/homoiconic/blob/master/2008-10-30/thrush.markdown
[cps]: http://en.wikipedia.org/wiki/Continuation-passing_style "Continuation-passing style - Wikipedia, the free encyclopedia"
[read]: http://weblog.raganwald.com/2007/04/writing-programs-for-people-to-read.html "Writing programs for people to read"
[v]: ./doc/more_about_views.md#readme
[m]: ./doc/methods.md#readme