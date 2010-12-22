Faux
===

Faux is a Javascript utility for building [Single Page Interface][spi] (or "SPI") applications using the [Backbone][b] library's models, views, and controllers. Faux isn't a framework: Faux doesn't ask you to learn a new, [non-portable][wicmajsp] abstraction in lieu of using MVC (we actually call it MVP, but [that's another story][mvp]). Instead, Faux provides you with a very simple DSL for declaring view classes and wiring them up to a controller that implements client-side routes.

Faux applications strongly resemble traditional server-side client applications. They are route-centric. While a server application might have routes like `http://prestidigitation.unspace.ca/spells/` or `/ingredients/42`, Faux applications have faux-routes like `/#/spells/` and `/#/ingredients/42`.

This approach is not a one-size-fits-all for writing SPI applications.

* Some applications are extremely simple and don't need the support for events and interaction that views provide. A framework like [Sammy][s] might be a good choice.
* Some applications are small but need some support for interaction. Using Backbone directly might be the best choice, as this [example][todo] shows.
* Many client-side applications ought to feature rich and varied interaction that doesn't revolve around routes. You might want to roll your own framework on top of [Backbone][b] or jump right into a more sophisticated tool like [Sproutcore][sprout].

Our bet is that Faux is a good choice for broad but shallow applications, applications with lots of functions that break neatly down into "pages," but fairly straightforward interactions on each page. For these applications, you may want to provide users with the benefits of a web interface they already understand: bookmarkable, back-buttonable locations. We're also betting that  a declarative syntax for defining the skeleton of your application is easier to maintain than a collection of classes wired together in an ad hoc fashion, so much so that if Faux isn't for you, you'll probably end up rolling something similar for yourself that is closely tailored to your needs.

**our motivation**

In our own case, we were building an application that mapped neatly onto a traditional CRUD server-side interface, however it was important for us to segregate the domain logic into a domain entity server and the UI into a separate application-specific code base. While in theory this is easy to do in a single Rails application, our experience is that in practice, domain and application logic blur. So we looked at building two Rails applications, a RESTful domain logic server and an application server using ActiveResource as model proxies.

Once we realized how much Javascript we'd be adding to support application logic in the client, the idea of having what amounts to three separate code bases became unpalatable, so we embarked on building all of the application logic into the client and keeping the domain server lean, mean, clean, and RESTful.

Thus, Faux is optimized to act as a font end for a RESTful domain logic server.

**basics**

The concept behind Faux is extremely simple. When you include `faux.js` in your application, you get a Backbone controller class, `Faux.Controller`. You use an instance of `Faux.Controller` to build all of the faux-pages in your application. So you start by creating an instance:

    magic_controller = new Faux.Controller({ 
      element_selector: '.base',
      partial: 'pages',
      partial_suffix: '.haml',
      title: 'My Application'
    });
    
Since `my_controller` is an instance of `Backbone.Controller`, you can always manipulate it directly. As we note above, we are providing a utility, not an abstraction. Once you have your controller, you can start defining your faux-pages. Although you can render your HTML any way you like, at Unspace we use [Haml][haml] extensively and Faux makes it easy to use Haml in the client. Here's the simplest possible example:

    magic_controller
      .display('spellbook');

The `.display` method creates a method in your controller, `magic_controller.spellbook()`.By default, this method fetches a Haml template from ``prestidigitation.unspace.ca/pages/spellbook.haml` and uses that to render the HTML that the user sees into the current page inside the element identified by the jQuery selector `.base`. Also by default, Faux creates a route in your application, `prestidigitation.unspace.ca/#/spellbook`. This route is bound (using Backbone's controller architecture) to your method.

Our favourite letter of the alphabet is [K][k], so you also can write things like:

    magic_controller
      .display('spellbook')
      .display('robe');

You can take control over the finer details by overriding Faux's defaults using a hash of options. Here are some examples:

    magic_controller
      .display('spellbook', {
        route: '/spells'
      });

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

The best way to do this in Faux is to start using some Backbone views. In Faux, you can associate a view with a faux page. Here's one way to do it:

    VestamentsView = Backbone.View.extend({ });

    magic_controller
      .display('vestaments', {
        route: '/vestaments/:colour',
        clazz: VestamentsView
      });
      
Now when the route `/#/vestaments/Blue` is invoked, the `.vestaments()` method will create a new instance of `VestamentsView` and pass its initialization method `{ colour: 'Blue' }` as a parameter. You can write your own do whatever you like with that, of course. To quote the Backbone documentation:

> When creating a new View, the options you pass are attached to the view as `this.options`, for future reference. There are several special options that, if passed, will be attached directly to the view: `model`, `collection`, `el`, `id`, `className`, and `tagName`. If the view defines an **initialize** function, it will be called when the view is first created. If you'd like to create a view that references an element *already* in the DOM, pass in the element as an option: `new View({el: existingElement})`

Faux isn't done yet. If you neglect to write a `.render()` method for your view, Faux writes on for you. Faux's render method uses the Haml template to render the page contents, however it does so using the instance of the view as the default context. Your Haml template can include lines like this:

    %h2= this.options.type
    
If you want to write code that is called when the view is rendered, but still want to use Faux's templates, you can use a little aspect-oriented programming. Simply write your own `.before_render()` and/or `.after_render()` methods and Faux will call them before and after `.render()` is invoked.

With a View class in place, you can add event handling and methods as you see fit to create the appropriate interaction in an unobtrusive way.

**a little more about convention over configuration when views**
      
We know it's a question of taste, but if you like convention over configuration, you can also write:

    VestamentsView = Backbone.View.extend({ ... });

    magic_controller
      .display('vestaments', {
        route: '/vestaments/:colour',
        view: true
      });
      
We're not big fans of global namespace clutter, so let's back up a bit:

    window.ca || (window.ca = {});
    window.ca.unspace || (window.ca.unspace = {});

    magic_controller = new Faux.Controller({ 
      element_selector: '.base',
      partial: 'pages',
      partial_suffix: '.haml',
      namespace: ca.unspace     // <--- lookie here
    });
    
Now you can write:

    ca.unspace.VestamentsView = Backbone.View.extend({ ... });

    magic_controller
      .display('vestaments', {
        route: '/vestaments/:colour',
        view: true
      });
  
Some folks are big fans of point-free syntax and anonymous functions. Faux digs your groove, too:

    magic_controller
      .display('vestaments', {
        route: '/vestaments/:colour',
        clazz: SomeViewClass.extend({ ... })
      });
      
And even:

    magic_controller
      .display('vestaments', {
        route: '/vestaments/:colour',
        clazz: {
          // equivalent to Backbone.View.extend({ ... })
        }
      });
      
...more to come about AJAX queries and using models...
      
*Faux and its documentation is still a work in progress. Faux was conceived on August 19, 2010 as "Roweis." A remark by Jeremy Ashkenas that we were creating a "Faux Server API" led to its new name.*

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