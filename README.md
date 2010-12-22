Faux
===

*Use convention over configuration to implement your views and controllers in the browser*.

Faux is a Javascript utility for building [Single Page Interface][spi] applications using the [Backbone][b] library's models, views, and controllers. Faux isn't a framework: Faux doesn't ask you to learn a new, non-portable abstraction in lieu of using MVC (we actually call it MVP, but [that's another story][mvp]). Instead, Faux provides you with a very simple DSL for declaring view classes and wiring them up to a controller that implements client-side routes.

Faux applications strongly resemble traditional server-side client applications. They are route-centric. While a server application might have routes like `http://prestidigitation.unspace.ca/spells/` or `http://prestidigitation.unspace.ca/ingredients/42`, Faux applications have faux-routes like `http://prestidigitation.unspace.ca/#/spells/` and `http://prestidigitation.unspace.ca/#/ingredients/42`.

This approach is not a one-size-fits-all for writing SPI applications. Some SPI applications are extremely simple and don't need the support for events and interaction that views provide. A framework like [Sammy][s] might be a good choice. Some applications are small but need some support for interaction. Using Backbone directly might be the best choice, as this [example][todo] shows. Many client-side applications ought to feature rich and varied interaction that doesn't revolve around routes. You might want to roll your own framework on top of Backbone or jump right into a more sophisticated tool like [Sproutcore][sprout].

Our bet is that Faux is a good choice for broad but shallow applications, applications with lots of functions that break neatly down into "pages," but fairly straightforward interactions on each page. For these applications, you may want to provide users with the benefits of a web interface they already understand: bookmarkable, back-buttonable locations. We're also betting that  a declarative syntax for defining the skeleton of your application is easier to maintain than a collection of classes wired together in an ad hoc fashion, so much so that if Faux isn't for you, you'll probably end up rolling something similar for yourself that is closely tailored to your needs.
	
---

Stay tuned for more writing! [Aanand Prasad][aanand] and [Jamie Gilgen][jamie] are responsible for the Good, [Reg Braithwaite][raganwald] is hogging the blame for both the Bad and the Ugly.

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