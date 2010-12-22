Faux
===

*Use convention over configuration to implement your views and controllers in the browser*.

Faux is a Javascript utility for building [Single Page Interface][spi] applications using the [Backbone][b] library's models, views, and controllers. Faux isn't a framework: [Faux doesn't ask you to learn a new, non-portable abstraction][wicmajsp] in lieu of using MVC (we actually call it MVP, but [that's another story][mvp]). Instead, Faux provides you with a very simple DSL for declaring view classes and wiring them up to a controller that implements client-side routes.

Faux applications strongly resemble traditional server-side client applications. They are route-centric. While a server application might have routes like `http://prestidigitation.unspace.ca/spells/` or `http://prestidigitation.unspace.ca/ingredients/42`, Faux applications have faux-routes like `http://prestidigitation.unspace.ca/#/spells/` and `http://prestidigitation.unspace.ca/#/ingredients/42`.

This approach is not a one-size-fits-all for writing SPI applications. Some SPI applications are extremely simple and don't need the support for events and interaction that views provide. A framework like [Sammy][s] might be a good choice. Some applications are small but need some support for interaction. Using Backbone directly might be the best choice, as this [example][todo] shows. Many client-side applications ought to feature rich and varied interaction that doesn't revolve around routes. You might want to roll your own framework on top of Backbone or jump right into a more sophisticated tool like [Sproutcore][sprout].

Our bet is that Faux is a good choice for broad but shallow applications, applications with lots of functions that break neatly down into "pages," but fairly straightforward interactions on each page. For these applications, you may want to provide users with the benefits of a web interface they already understand: bookmarkable, back-buttonable locations. We're also betting that  a declarative syntax for defining the skeleton of your application is easier to maintain than a collection of classes wired together in an ad hoc fashion, so much so that if Faux isn't for you, you'll probably end up rolling something similar for yourself that is closely tailored to your needs.

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
      .display('robe')
      .display('hat');

You can take control over the finer details by overriding Faux's defaults using a hash of options. Here are some examples:

    magic_controller
      .display('spellbook', {
        route: '/spells'
      })
      .display('robe', {
        partial: 'vestaments/robe'
      })
      .display('hat', {
        title: 'pointy headgear'
      });

*Faux was conceived on August 19, 2010*

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
[mvp]:  http://github.com/raganwald/homoiconic/blob/master/2010/10/vc_without_m.md#readme
[todo]: http://documentcloud.github.com/backbone/examples/todos/index.html
[sprout]: http://www.sproutcore.com/
[wicmajsp]: http://raganwald.posterous.com/why-i-call-myself-a-javascript-programmer "Why I Call Myself a Javascript Programmer"
[k]: https://github.com/raganwald/JQuery-Combinators