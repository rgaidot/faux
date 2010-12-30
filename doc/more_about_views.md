More About Views
===

**a little more about convention over configuration when declaring views**
      
We know it's a question of taste, but if you like convention over configuration, you can also write:

    VestamentsView = Backbone.View.extend({ ... });

    magic_controller
      .display('vestaments', {
        route: '/vestaments/:colour'
      });
      
If you don't specify a `clazz` but Faux can find a view class that is named after your method, Faux will use it. That works for methods that look like they're singular or plural:

    ThaumaturgyView = Backbone.View.extend({ ... });

    magic_controller
      .display('thaumaturgy', { ... ); // infers clazz: ThaumaturgyView

There's another special case for method names that look like plurals:

    SpellCollectionView = Backbone.View.extend({ ... });
    
    magic_controller
      .display('spells', { ... }); // infers clazz: SpellCollectionView if it can't find SpellsView first
      
If you don't want a view class, you can always insist:

    magic_controller
      .display('something', {
        clazz: false
      });

We're not big fans of global namespace clutter. If you feel the same way, start like this:

    window.ca || (window.ca = {});
    window.ca.unspace || (window.ca.unspace = {});

    magic_controller = new Faux.Controller({ 
      element_selector: '.base',
      partial: 'hamljs',
      partial_suffix: '.haml',
      namespace: ca.unspace     // <--- lookie here
    });
    
And now you can write:

    ca.unspace.VestamentsView = Backbone.View.extend({ ... });

    magic_controller
      .display('vestaments', {
        route: '/vestaments/:colour'
      });
  
Some folks are big fans of point-free syntax and anonymous functions. Faux digs your groove, too:

    magic_controller
      .display('vestaments', {
        route: '/vestaments/:colour',
        clazz: {
          // equivalent to Backbone.View.extend({ ... })
        }
      });