;(function ($, undefined) {
  
  window.Faux || (window.Faux = {});
  
  window.Faux.Controller = (function () {

    var default_step_names = [
  
      // Inspects the element associated with a handler and infers parameters from it.
      'get_params',
  
      // Performs an action, and as a side-effect initializes the `data` parameter for all subsequent
      // steps to contains ome sort of action result.
      //
      // Roughly speaking, Faux handlers either primarily dispolay something or primarily perfom 
      // an action that changes the applicatrion's state. Those that primarily display things usually
      // perform some sort of query during their `fetch_data` step, such as sending a `GET`
      // request to a server and putting the result inhto `data. Those that primarily perfom an 
      // action usually `POST` a resource to a server and place the result into `data`.
      // 
      // Besides defining `fetch_data` directly, you can use one of the short-cut methods
      // `gets`, `posts`, `puts`, or `deletes` to write this step.
      'fetch_data',
    
      // Transforms or "maps" the data from one form to another. Useful when a server
      // provides data in an idiosyncratic or inconvenient form. For example, if a server
      // is returning a list of models as an array, you can use `transform` as a convenient
      // place to transform `data.model_list` from `[model_1, model_2, ... model_n]` to
      // `{ models: [model_1, model_2, ... model_n] }`, which would make it easier to integrate
      // with Backbone.js
      'transform',
    
      // Displays something by manipulating the page's DOM. You can write your own function to do
      // anything you want, but in practice this step usually renders the `data` as locals in a
      // partial.
      //
      // If you are using Backbone, this step can also be used to instantiate a Backbone view and
      // then tell the view to `.render()` itself.
      'display',
    
      // Tells the browser to change the location, invoking another action. The default behaviour 
      // uses Sammy's `HashLocationProxy` to change the hash (and thus the location for the purposes 
      // of bookmarking and the back button), however Sammy can be configured to use a different
      // proxy, in which case a different handler will be invoked but the browser's location will
      // not change.
      //
      // Typically, a handler either displays or redirects but not both. For that reason, there are 
      // two different convenience methods for declaring a handler: `.display(...)` declares a
      // handler that by default displays a partial and does not perform a redirection, and
      // `.action(...)` declares a handler that by default does not display anything but does
      // perform a redirection.
      'redirect'
    //
    ];
      
      // So-called "Macros"
      // ---
      //
      // The following 'macros' write handler steps for you. Each one is a single
      // config property and a function that takes a handler and the value of that config property.
      // if you supply a value for that property, the 'macro' function will be invoked
      // and is expected to perturb the handler as a side-effect.
      //
      // Naturally, you can write your own macros. You can define them across your application:
      //
      //     $.sammy('.body', function() {
      //       this.use(Faux('MyApp', { 
      //         macros: {
      //           part_number: function (handler, num) { ... }
      //         },
      //         ...
      //       }));
      //     });
      //
      // And thereafter, use them in your declarations:
      //
      //     Faux.MyApp
      //       .action(
      //         route: '/increase_inventory',
      //         part_number: 42,
      //       );
      //
      // The macros listed here are the defaults built into Faux.
      //
      // p.s. Yes, 'macro' is an improper term. The longer and more precise expression
      // is 'a function-writing-function', which is a kind of Higher Order Function ("HOF").
      var default_macros = {
        
        // **Display**
        //
        // The `partial` macro writes a `display` step that uses a tenplate of
        // some type (e.g. Haml) to display the `data`.
        partial: function (handler, partial_value) {
          if (partial_value) {
            
            window.Faux.Controller.partial_cache || (window.Faux.Controller.partial_cache = {});
            var partial_cache = window.Faux.Controller.partial_cache;
            
            /* TODO; Meld into options */
            if (partial_value && handler.config.partial_suffix && !partial_value.match(/\.[^\/]+$/)) {
              partial_value = partial_value + handler.config.partial_suffix;
            }
            else window.console && console.log('config:',handler.config,' for '+partial_value);
            
            /* window.console && console.log('pre-fetching ' + partial_value); */
            /* TODO: options */
            if (handler.config.prefetch_partials) {
              $.ajax({
                url: partial_value,
                cache: false,
                dataType: 'text',
                success: function (template, textStatus, XMLHttpRequest) {
                  partial_cache[partial_value] = Haml(template);
                }
              });
            }
            
            handler.step_functions.display = _compose(handler.step_functions.display, function (data, roweis, callback) {
              if (partial_cache[partial_value]) {
                callback(data, roweis);
              }
              else {
                window.console && console.log(handler.config.name + ' is fetching ' + partial_value + ' on the fly for data',data,'and roweis',roweis);
                $.ajax({
                  url: partial_value,
                  cache: false,
                  dataType: 'text',
                  success: function (template, textStatus, XMLHttpRequest) {
                    partial_cache[partial_value] = Haml(template);
                    callback(data, roweis);
                  }
                });
              }
            });
            
            handler.step_functions.display = _compose(handler.step_functions.display, function (data, roweis, callback) {
              window.console && console.log('data for '+partial_value, data,'and roweis',roweis);
              var content = (roweis && roweis.view) ? partial_cache[partial_value].call(roweis.view, data) : partial_cache[partial_value](data);
              /* window.console && console.log(handler.config.name + ' is rendering ',data,' with fetched ' + partial_value); */
              if (handler.config.renders) {
                /* window.console && console.log('rendering '+handler.config.updates+' for ' + handler.config.name); */
                roweis.renders || (roweis.renders = $(handler.config.renders));
              }
              else if (handler.config.updates) {
                /* window.console && console.log('updating '+handler.config.updates+' for ' + handler.config.name); */
                roweis.renders || (roweis.renders = $(handler.config.updates));
              }
              else roweis.renders || (roweis.renders = handler.controller.$element());
              $(roweis.renders)
                .ergo(function (el) {
                  el
                    .empty()
                    .append(content)
                    ;
                  handler.controller.trigger('after_display', data, roweis);
                });
              callback(data, roweis);
            });
          }
          return handler;
        },
        
        // A simple macro for setting the title of the browser window
        // when rendering the view. Only works for handlers that have a route!
        title: function (handler, title_value) {
          if (handler.config.route) {
            var title_fn;
            if ('function' === typeof(title_value)) {
              title_fn = title_value;
            }
            else if ('function' === title_value.toFunction) {
              title_fn = title_value.toFunction();
            }
            else if (_.isString(title_value)) {
              title_fn = function () {
                return title_value;
              };
            }
            handler.step_functions.display = _compose(handler.step_functions.display,
              function (data) {
                var new_title = title_fn(data);
                if (_.isString(new_title)) {
                  document.title = new_title;
                }
              }
            );
          }
          return handler;
        },
        
        // A simple macro for defining a redirection instead of a partial
        redirects_to: function (handler, redirection_value) {
          handler.step_functions.redirect = _compose(handler.step_functions.redirect,
            function (data, roweis, callback) {
              var redirect;
              if (_.isString(redirection_value) && redirection_value.match(/^\//)) {
                redirect = redirection_value;
              }
              else if (_.isString(redirection_value) && redirection_value.match(/^#\//)) {
                redirect = redirection_value.substring(1);
              }
              else if (_.isFunction(redirection_value)) {
                try {
                  redirect = redirection_value.call(handler, data);
                }
                catch (err) {
                  window.console && console.log(err, " attempting to redirect via ", redirection_value);
                }
              }
              if (redirect) {
                var interpolations = _(redirect.match(/[*:][a-zA-Z_]\w*/g) || []).map(function (i) {
                  return i.substring(1);
                });
                var in_params = data || {};
                var out_params = _(interpolations).foldl(function (acc, param) {
                  in_params[param] && (acc[param] = in_params[param]);
                  return acc;
                }, {});
                handler.controller.setInterpolatedLocation(redirect,out_params);
              }
              callback(data, roweis);
            }
          );
        },
        
        // Sets the current location hash to this handler's route, useful for 
        // cases where one handler delegates to another and you want the appearance
        // of a redirect, or when you want to call a handler as a function.
        //
        // Special rule: 'true' means use the handler's interpolated route.
        // The implication is that if you declare a handler using _display and
        // give it a route, you can redirect to that faux page simply by calling
        // the handler (with optional parameters, of course).
        location: function (handler, location_value) {
          if (location_value) {
            handler.step_functions.redirect = _compose(handler.step_functions.redirect, function (data) {
              var new_location;
              if (_.isString(location_value)) {
                new_location = _internal_interpolate(location_value, data);
              }
              else if (true === location_value && handler.config.route) {
                new_location = _internal_interpolate(handler.config.route, data);
              }
              if (new_location) {
                handler.controller.saveLocation(new_location);
                /* window.console && console.log('saved location of '+new_location+' given '+handler.config.route); */
              }
            });
          }
        },
        
        // **"Unobtrusive" Handlers**
        //
        // Many handlers are associated with a route. Some are associated with a DOM
        // selector: They are invoked if an element matching their selector is put into
        // the DOM by another display.
        //
        // The handlers are called *unobtrusive handlers*, and there are three key config
        // parameters that control them:
        //
        // First, a selector must be provided with `renders`, such as `renders:
        // '.customers.list'`. This selector is applied against the DOM, if any elements
        // match, the unobtrusive handler is triggered. Whatever it displays through
        // its partial will replace the contents of the selected element. `renders` is
        // not a macro.
        //
        // Second, the typical style is to configure them with
        // `route: false` to make sure that they cannot be invoked from setting the
        // location hash. `route` isn't a macro either.
        //
        // Third, there is a very limited facility for parameterizing an unobtrusive
        // handler by extracting parameters from the element's `id` and/or CSS classes,
        // using the `infers` macro. `infers` writes a handler step that examines the
        // `id` and `class` attributes of the handlers `$element()` to infer parameters.
        //
        // Nota Bene: `MATCHER.lastIndex` needs to be explicitly set because IE will maintain the index unless NULL is returned,
        // which means that with two consecutive routes that contain params, the second set 
        // of params will not be found and end up in splat instead of params. Explanation
        // [here](https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/RegExp/lastIndex).
        infers: function (handler, value) {
          if (value) {
            var MATCHER = /:([\w\d]+)/g;
            var REPLACER = "(.+)";
            var inferences = _.map(_.isArray(value) ? value : [value], function (inf) {
              return inf.replace('.','\\.')
            });
            var inferer = _.foldl(inferences,
              function (fn, inference) {
                MATCHER.lastIndex = 0;
                var param_names = [];
                while ((inference_match = MATCHER.exec(inference)) !== null) {
                  param_names.push(inference_match[1]);
                }
                var inference_regexp = new RegExp("^" + inference.replace(MATCHER, REPLACER) + "$");
                return function (attr) {
                  var bindings = fn(attr);
                  if ((attr_match = inference_regexp.exec(attr)) !== null) {
                    attr_match.shift();
                    _.each(attr_match, function (value, index) {
                      var name = param_names[index];
                      bindings[name] = value;
                    });
                  }
                  return bindings;
                };
              },
              function (attr) { return {}; }
            );
            handler.step_functions.get_params = _compose(handler.step_functions.get_params, 
              function (data, roweis) {
                var el = (roweis && roweis.renders) || handler.controller.$element();
                var attrs = _.map(el.attr('class').split(' '), function (str) { return '.' + str; });
                if (!!el.attr('id')) {
                  attrs.push( '#' + el.attr('id') );
                }
                var inferred_bindings = _.foldl(attrs, 
                  function (bindings, attr) {
                    return $.extend(bindings, inferer(attr));
                  },
                  {}
                );
                $.extend(true, data, inferred_bindings);
              }
            );
            return handler;
          }
          
        },
        
        // **Backbone.js**
        //
        // If you install `backbone.js`, you can then define Faux handlers that display a
        // backbone view.  The style is to define the view in a separate class, and you tell
        // Faux to use it with a `backbone` declaration, something like:
        //
        //     controller.display('my_view_handler', {
        //       route: '/fubar',
        //       clazz: MyBackboneViewClazz,
        //       view: {
        //         model: a_function_returning_a_model_for_the_view
        //       }
        //     });
        view: function (handler, view_class_extensions) {
          
          if (view_class_extensions) {
          
            var clazz;
            
            if (is_view_clazz(handler.config.clazz)) {
              clazz = handler.config.clazz;
            }
            else if (handler.config.clazz) {
              clazz = Backbone.View.extend(handler.config.clazz); // define extensions on the fly
            }
            else {
              // view class by convention
              var name = handler.config.name;
              var pseudo_class_name;
              if (name) {
                var pseudo_class_name = classCase(name);
                if (is_plural(pseudo_class_name)) {
                  pseudo_class_name = singular(pseudo_class_name) + 'CollectionView';
                }
                else pseudo_class_name = pseudo_class_name + 'View';
                clazz = (handler.config.namespace && handler.config.namespace[pseudo_class_name]) || window[pseudo_class_name];
              }
              /* 
                if (clazz) {
                  window.console && console.log('Found ' + pseudo_class_name);
                }
                else window.console && console.log('Lost ' + pseudo_class_name); 
              */
              clazz || (clazz = Backbone.View); // default
            }
        
            // this is what Faux would do if there was no backbone view involved
            var old_declared_roweis_render_fn = handler.step_functions.display || function (data, roweis) {};
        
            // now write a new function
            handler.step_functions.display = function (data, outer_roweis) {
                    window.console && console.log('data',data,'roweis',outer_roweis);
              // that initializes the parameters for the backbone view
              var view_constructor_parameters = view_initialization(data, outer_roweis);
          
              // and extracts locals for rendering
              var locals = view_constructor_parameters.model || data;
              
              var extension = {
                roweis: {
                  /*TODO: Implement `before_render` and `after_render`*/
                  render: function (view, optional_callback) {
                    var inner_roweis = $.extend({}, outer_roweis, {
                      view: view,
                      renders: view.el
                    });
                    window.console && console.log('locals',locals,'roweis',inner_roweis);
                    old_declared_roweis_render_fn(locals, inner_roweis, optional_callback || (function () {}));
                    return this;
                  }
                }
              };
              
              if (!declares_a_render_method(clazz)) {
                var fns = (handler.config.before_render || [])
                  .concat(
                    declares_a_before_render_method(clazz) ? [clazz.prototype.before_render] : []
                  )
                  .concat([
                    function (optional_callback) {
                      this.roweis.render(this, optional_callback);
                    }
                  ])
                  .concat(
                    declares_an_after_render_method(clazz) ? [clazz.prototype.after_render] : []
                  )
                  .concat(
                    handler.config.after_render || []
                  );
                extension.render = _(fns).foldr(function (callback, fn) {
                  var callbackable = callbackable_without_args(fn);
                  return function () {
                    var view = this;
                    callbackable.call(this, function () { callback.call(view); }); };
                }, function () {});
              }
          
              // and that extends the view clazz
              var extended_view_clazz = clazz.extend(extension);
          
              // now create an instance of the view
              var view_instance = new extended_view_clazz(view_constructor_parameters);
          
              // and tell it to render itself
              view_instance.render();
          
            };
          
          }
          
          function callbackable_without_args (fn) {
            return fn.length === 1 ? fn : function (callback) { fn.call(this); callback.call(this); };
          }
          
          function is_view_clazz (clazz) {
            return clazz && clazz.prototype && clazz.prototype.initialize;
          }
          
          function tag_selector (options) {
            var sel = options.tagName || '';
            options.id && (sel = sel + '#' + options.id);
            options.className && (sel = sel + '.' + options.className.split(' ').join('.'));
            if (sel) return sel;
          }
        
          function classCase( s ) {
            return jQuery.trim(s)
              .replace( /([\s_\\\/]+)([a-z])/g, function(t,a,b) { return b.toUpperCase(); } )
              .replace( /^(\w)(\w+)$/, function (t,a,b) { return a.toUpperCase() + b; } );
          }
        
          function is_plural (s) {
            return s[s.length-1] === 's';
          }
        
          function singular (s) {
            if (s.match(/ies$/)) {
              return s.slice(0,pseudo_class_name.length-3);
            }
            else if (s.match(/xen$/)) {
              return s.slice(0,pseudo_class_name.length-2);
            }
            else if (s.match(/s$/)) {
              return s.slice(0,pseudo_class_name.length-1);
            }
            else return s;
          }
        
          function declares_a_render_method (view_clazz) {
            return (view_clazz.prototype.render !== Backbone.View.prototype.render);
          };
        
          function declares_a_before_render_method (view_clazz) {
            return !!view_clazz.prototype.before_render;
          };
        
          function declares_an_after_render_method (view_clazz) {
            return !!view_clazz.prototype.after_render;
          };
          
          // The parameters for the view constructor are limited to `model` if
          // you supply a model or model function, and `el`, which is inferred
          // from Faux.
          function view_initialization (data, roweis) {
            var options = $.extend({}, _mapper_to_fn(view_class_extensions)(data));
            delete options.roweis; /* probably deprecated!!! */
          
            // compute the element
            if (_.isUndefined(options.el)) {
              options.el = handler.controller.$element()
              roweis && roweis.renders && (options.el = $(roweis.renders));
              var selector = tag_selector(options);
              selector &&  (options.el = options.el.find(selector));
            }
            else window.console && console.log(handler.config.name+' defines options.el');
          
            /* window.console && console.log('options for model initialization', options, 'and original data',data); */
        
            return options;
          };
        
        }
        
      }
      
      // This code writes one macro for each verb. Thus, when you write something like
      // `posts: '/fu/bar'`, Faux turns this into a function that does and AJAX `POST`
      // during the `fetch_data` step.
      _.each(_verb_inflections(), function (verb) {
        default_macros[verb] = function (handler, value) {
          var fetch_data_fn = function (path, destination, data, roweis, callback) {
            var server_route = _internal_interpolate(path, data);
            var host_partial_path = server_route.match(/^\//) ? server_route : '/' + server_route;
            var full_url = handler.controller.roweis.host + host_partial_path;
            var actuals = $.extend({}, data);
            delete actuals.roweis;
            var ap = _hash(actuals);
            /* window.console && console.log(handler.config.name + ' is ajaxing ' + full_url + ' with:', ap); */
            var request_object = {
              error: function(xhr, textStatus, errorThrown) {
                window.console && console.log('Error from '+full_url+":", xhr);
                var propagate = true;
                var code = xhr.status;
                var responseObj;
                try {
                  responseObj = (xhr.responseText ? JSON.parse(xhr.responseText) : {});
                }
                catch (error) {
                  responseObj = (xhr.responseText ? { responseText: xhr.responseText }: {});
                }
                var error_params = {
                  params: ap,
                  code: code,
                  handler: handler,
                  data: data,
                  xhr: xhr,
                  response: responseObj,
                  textStatus: textStatus,
                  errorThrown: errorThrown,
                  stopPropagation: function () { propagate = false; },
                };
                if (handler.error_handlers[code]) {
                  window.console && console.log('handling ' + code + ' in the handler');
                  handler.error_handlers[code](error_params);
                }
                if (propagate && handler.controller.roweis.handlers[code]) {
                  window.console && console.log('handling ' + code + ' in the controller');
                  handler.controller.roweis.handlers[code](data);
                }
              },
              url: full_url,
              type: _present_tense(verb),
              cache: false,
              etc: {
                handler: handler
              },
              data: ap,
              success: function (data_from_server, textStatus, xhr) {
                data || (data = {});
                data[destination] = data_from_server;
                callback(data, roweis);
              }
            };
            $.ajax(request_object);
          };
          if (typeof(value) === 'string') {
            handler.step_functions.fetch_data = _compose(handler.step_functions.fetch_data,
              function (data, roweis, callback) {
                fetch_data_fn(value, 'server_data', data, roweis, callback);
              }
            );
          }
          else if (typeof(value) === 'object') {
            handler.step_functions.fetch_data = _.foldl(_.keys(value),
              function (old_action, destination) {
                return _compose(old_action, function (data, roweis, callback) {
                  fetch_data_fn(value[destination], destination, data, roweis, callback);
                });
              },
              handler.step_functions.fetch_data
            );
          }
        }
      });
  
      // Defining a New Handler
      // ---
      
      // The generic function for defining a new handler from a configuration.
      //
      // This function is called by certain convenience methods we will add
      // to Sammy's application object.
      var _define_handler = function (controller, config) {
        
        // **Construct the handler object**
        //
        // We are going to build a handler function and decorate it with a metric
        // fuckload of attributes. Those might come in handy for adavcend instrocpection
        // after the fact, and we have a pipe dream that handlers will be rewritten one day.
        // but, one thing at a time.
        //
        // The extra attributes are namespaced under `roweis`, just in case
        // we define something that clashes with some other property associated with functions.
        // The most interesting attribute is `fn`, which is the function that actually does the
        // handling of the function.
        var handler = $.extend(
          function (data, roweis) {
            return handler.roweis.fn(data, roweis);
          },
          {
            roweis: {
              fn: _noop(),
              controller: controller,
              config: config,
              step_names: controller.roweis.step_names,
              step_functions: {},
              error_handlers: {}
            }
          }
        );
        
        // **Extract ajax error handlers**
        for (var code in config) {
          if (config.hasOwnProperty(code) && !isNaN(code)) {
            handler.roweis.error_handlers[code] = config[code];
          }
        }
        
        // **Handler steps**
        //
        // By default, the handler has the same steps as the controller, which has the default steps.
        // They can be overridden at any level, including within a scope.
        if (config.step_names) {
          handler.roweis.step_names = config.step_names;
        }
        
        // Copy the named steps from the config to the handler
        _.each(handler.roweis.step_names, function (step_name) {
          if (!_.isUndefined(config[step_name])) {
            handler.roweis.step_functions[step_name] = _compose(handler.roweis.step_functions[step_name], config[step_name]);
          }
        });
        
        // **"Macro" Expansion**
        //
        // As described above, each "macro" is a property and a function
        // that takes the handler and value of the property as parameters.
        //
        // It is expected to perturb the handler appropriately. This is where
        // most of the handler's action steps get written. Some of them are going to
        // be composed with steps written in config.
        var macros_to_expand = $.extend({}, controller.roweis.default_macros, controller.roweis.macros || {}, config.macros || {});
        _.each(_.keys(macros_to_expand), function (macro_key) {
          var value = handler.roweis.config[macro_key];
          if (!_.isUndefined(value)) {
            macros_to_expand[macro_key](handler.roweis, value);
          }
        });
        
        // **Aspect-Oriented Handlers**
        //
        // You can define a `before_` or `after_` function for each of the action steps,
        // and Faux will mix it into the step. You could write the whole
        // thing yourself, but an advantage of this system is that you can let Faux
        // use convention to write the main step while you do additional customization
        // with a `before_` or `after_` step. For example:
        //
        //     .display('bmx_bikes', {
        //       gets: '/bikes/bmx/',
        //       after_fetch_data: function (data) {
        //         return { 
        //           models: data.server_data, 
        //           size: data.server_data.length
        //         };
        //       }
        //     });
        _.each(handler.roweis.step_names, function (step_name) {
          _.each(['before_'+step_name, 'after_'+step_name], function (expanded_step_name) {
            _([ config[expanded_step_name] ]).chain()
              .flatten()
              .each(function (advice) {
                if (!_.isUndefined(advice)) {
                  handler.roweis[expanded_step_name] = _compose(handler.roweis[expanded_step_name] || _noop(), advice);
                }
              });
          })
        });
        
        _.each(handler.roweis.step_names, function (step_name) {
          if (_.isFunction(handler.roweis.step_functions[step_name])) {
            if (_.isFunction(handler.roweis['before_' + step_name])) {
              handler.roweis.step_functions[step_name] = _compose(handler.roweis['before_' + step_name], handler.roweis.step_functions[step_name]);
            }
            if (_.isFunction(handler.roweis['after_' + step_name])) {
              handler.roweis.step_functions[step_name] = _compose(handler.roweis.step_functions[step_name], handler.roweis['after_' + step_name]);
            }
          }
        });
        
        // **Composing the handler function**
        //
        // We compose `handler.roweis.fn` out of the individual
        // step functions. `handler` delegates to this function, so
        // in effect we are redefining `handler`.
        handler.roweis.fn = (function () {
          var step_names_in_use = _.select(handler.roweis.step_names, function (step_name) { 
            return _.isFunction(handler.roweis.step_functions[step_name]); 
          });
          
          var actual_handler = _.foldr(step_names_in_use,
            (function (callback, step_name) {
              var callbackized_step_fn = _callbackable(handler.roweis.step_functions[step_name]);
              return function (data, roweis) {
                callbackized_step_fn(data, roweis, callback);
              };
            }), 
            (function (data, roweis) { /* nada */ })
          );
          return function (data, roweis) {
            return actual_handler(data || {}, roweis || {});
          };
        })();

        return handler;
      
      };

      // The generic function for installing a new handler into its controller. 
      // It binds the object to the appropriate 
      // [Sammy events](http://code.quirkey.com/sammy/docs/events.html) so that the handler
      // is invoked when the appropriate route (if any) is invoked or the appropriate 
      // element is attached to the DOM.
      //
      // (It could be a method on `handler.roweis`, but the concept of re-installing
      // a handler will have to wait for an architecture involing uninstalling a handler
      // from any existing bindings. So for now, it's a helper function.)
      //
      // *TODO: Make it a handler function after all, not because it should be re-installable,
      //        but because then we can use macros to define new ways to install handlers.*
      var _install_handler = function(handler) {
        var config = handler.roweis.config;
        var controller = handler.roweis.controller;
        
        //
        // triggering a handler through a route
        if (config.route) {
          /* window.console && console.log('configuring a route of '+config.route+' for '+config.name); */
          controller.route(config.route, config.name, (function () {
            var route = config.route; 
            var param_names = []; 
            var SINGLE_PARAM_MATCHER = /:([\w\d]+)/g;
            while ((match = SINGLE_PARAM_MATCHER.exec(route)) !== null) { 
              param_names.push(match[1]); 
              route = route.replace(':' + match[1],'xxxxx'); 
            }; 
            var SPLAT_MATCHER = /\*([\w\d\/]+)$/g;
            if ((match = SPLAT_MATCHER.exec(route)) !== null) { 
              param_names.push(match[1]); 
              route = route.replace(':' + match[1],'xxxxx'); 
            };
            /* window.console && console.log('binding ' + config.route + ' for ' + config.name + ' with params [' + param_names.join(', ') + ']' ); */
            return function () {
              /* window.console && console.log('invoking '+config.name+" with",arguments); */
              var params = {};
              for (var i = 0; i < arguments.length && i < param_names.length; ++i) {
                params[param_names[i]] = arguments[i];
              }
              /* window.console && console.log('triggered ' + config.route + ' for ' + config.name + ' with param names ',param_names); */
              handler(params, { renders: controller.$element() });
            };
          })());
        }
        
        var updater_fn;
        
        //
        // triggering a handler unobtrusively
        //
        if (config.renders) {
          updater_fn = function (data, roweis) {
            data || (data = {});
            roweis || (roweis = {});
            var new_data;
            
            $(roweis.renders)
              .find(config.renders)
                .each(function (index, dom_el) {
                  new_data || (new_data = $.extend(true, {}, data));
                  handler(new_data, { renders: $(dom_el) });
                })
                ;
          };
        }
        else updater_fn = handler;
        
        if (_.isArray(config.events)) {
          _(config.events).each(function (event_name) {
            controller.bind(event_name, updater_fn);
          });
        }
        
        //
        // triggering a handler through an AJAX error status
        //
        if (config.code && !isNaN(config.code) && config.route) {
          controller.bind(config.code, function (event, error_data) {
            window.console && console.log(config.code + 'triggered! redirecting to ' + config.route);
            controller.setInterpolatedLocation(config.route, error_data.data);
          })
        }
        
        // Add the handler to the controller in the `.roweis` scope
        if (_.isString(config.name)) {
          controller.roweis.handlers[config.name] || (controller.roweis.handlers[config.name] = handler);
          if (config.name.match(/^\w[\w\d_]*$/)) {
            if (_.isUndefined(controller[config.name])) {
              controller[config.name] = handler;
            }
            else window.console && console.log(config.name + ' is already a method name in the controller. Duplicate definition?');
          }
          else window.console && console.log(config.name + ' is not a suitable method name, therefore it is not being added to the controller');
        }
        
        return handler;
        
      };


    
      // Additonal methods added to every controller
      // ---
      
      // **Methods for defining and installing handlers**
      
      // The core method for defining a new handler that renders something in the DOM.
      var _display = function (name, optional_config) {
        _install_handler(
          _define_handler(this, 
            this.roweis.with_controller_defaults(
              _mix_in_optional_parameters_and_conventions(this, name, optional_config, 
                { 
                  method: 'get',
                  location: true,
                  redirect: false 
                }
              )
            )
          )
        );
        return this;
      };
    
      // The core method for defining a new handler that performs an action and then
      // redirects to a display, a client-side implementation of the
      // [Post-Redirect-Get](https://secure.wikimedia.org/wikipedia/en/wiki/Post/Redirect/Get)
      // ("PRG") pattern.
      var _action = function (name, optional_config) {
        _install_handler(
          _define_handler(this, 
            this.roweis.with_controller_defaults(
              _mix_in_optional_parameters_and_conventions(this, name, optional_config, 
                { 
                  method: 'post', 
                  updates: false,
                  view: false,
                  partial: false
                }
              )
            )
          )
        );
        return this;
      };
    
      // Binding an arbitrary function to an error instead of a handler.
      var _error = function(code, handler_fn) {
        var handler =  _define_handler(this, this.roweis.with_controller_defaults({ 
          name: '' + code,
          route: false, 
          updates: false,
          view: false,
          partial: false
        }));
        handler.roweis.fn = handler_fn;
        _install_handler(handler);
        return this;
      };
           
      // **Methods for establishing scopes**
      //
      // In Faux, scopes establish tenmporary defaults. A simple
      // case might be something like this:
      //
      //     controller
      //       .begin({ 
      //         gets_home_path: '/bikes',
      //         partial: 'bikes'
      //       })
      //         .display({
      //           gets: '',
      //           partial: 'plural'
      //         })
      //         .display({
      //           gets: ':part_number',
      //           partial: 'singular'
      //         })
      //         .end()
      //       ;
      //
      // `begin` establishes a scope and `end` ends it. Within the scope,
      // `gets` has a home path, so our two faux-pages get their data from the
      // server using `GET /bikes` and `GET /bikes/42`. Likewise, there is a home
      // path for partials, so the partials used to display our faux pages will
      // be `/bikes/plural.haml` and `/bikes/singular.haml`.
      
      var _begin = function(config) {
        this.roweis.config_stack.push(config);
        return this;
      };
      
      var _end = function() {
        if (this.roweis.config_stack.length > 0) {
          this.roweis.config_stack.pop();
          return this;
        }
        else {
          window.console && console.log('error, "end" unmatched with "use."');
        }
      };
      
      var _scope = function(config, fn) {
        return this
          .begin(config)
          .K(fn)
          .end()
          ;
      };
      
      // The method for forcibly setting the window location
      var _setInterpolatedLocation = function(path, optional_data) {
        if (optional_data) {
          path = _fully_interpolated(path, optional_data);
        }
        if (path.match(/^\//)) {
          window.location.hash = path;
        }
        else window.location = path;
      };
      
      var _initialize = function (options) {
        var this_controller = this;
        options || (options = {});
        this.roweis = {
          element_selector: 'body',
          step_names: default_step_names,
          default_macros: default_macros,
          error_handlers: {},
          host: '',
          handlers: {},
          config_stack: [{
            paths: ['route', 'partial', 'get']
          }],
          macros: {},
          /* TODO: Kill this */
          with_controller_defaults: function (config) {
            var out = $.extend(true, {}, config);
            // **Update config with application defaults**
      
            // and a default DOM selector to update
            if (undefined === out.updates) {
              out.updates = out.renders || this.root_element_selector;
            }
            return out;
          }
        };
        
        _(options).each(function (value, key) {
          if (_.isUndefined(this_controller.roweis[key])) {
            this_controller.roweis.config_stack[0][key] = value;
          }
          else this_controller.roweis[key] = value;
        });
        this.roweis.root_element_selector = this.roweis.updates || this.roweis.element_selector || 'body';
        _.extend(this, Backbone.Events);
        return this;
      };
      
      // A class for the controller
      var clazz = Backbone.Controller.extend({
        $element: function () {
          return $(this.roweis.element_selector);
        },
        display: _display,
        action: _action,
        begin: _begin,
        end: _end,
        scope: _scope,
        error: _error,
        setInterpolatedLocation: _setInterpolatedLocation,
        initialize: _initialize,
        K: function (fn) {
          fn(this);
          return this;
        },
        T: function (fn) {
          return fn(this);
        }
      });
        
    // Place the external interpolation helper function into
    // the `Faux` scope.
    Faux.fully_interpolated = _fully_interpolated;
  
    return clazz;

  })();
  
  // Readability Helpers
  // ---
  //
  // These helper give you options for making your declarations more readable.
  
  // Really simple inflection conversion, allows you to write either `get: '/foo/bar'` or
  // `gets: '/foo/bar'` when defining handlers.
  function _present_tense (verb) {
    return verb.match(/^get/) ? 'get' : (
      verb.match(/^post/) ? 'post' : (
      verb.match(/^put/) ? 'put' : (
      verb.match(/^del/) ? 'delete' : (verb)
    )));
  };
  
  // **Continuation Passing Style**
  //
  // We've fallen into Javascript's ghastly habit of 
  // [reinventing CPS](http://matt.might.net/articles/by-example-continuation-passing-style/).
  //
  // Faux chains functions together using CPS. There are lots of places where
  // functions are chained together. The most obvious is the "handler steps" described above: Each
  // step is chained using CPS. This allows Faux to do sensible things when doing something asynchronously.
  // 
  // You may not expect something to be asynchronous, but any call to a server
  // is AJAX, and therefore asynchronous by default. That includes any rendering of a partial, since the
  // partial may need to be fetched from the server using AJAX.
  
  // the test for noop
  function _is_noop (fn) {
    return (_.isFunction(fn) && fn.roweis && fn.roweis.is_noop);
  }
  
  function _callbackable (handler) {
    if (_.isUndefined(handler) || _is_noop(handler)) {
      return _noop();
    }
    /* temporary fix to use ONLY the { foo: function (data) { ... } } syntax */
    if (!_.isFunction(handler)) {
      var handler = _mapper_to_fn(handler);
    }
    if (handler.length > 2) {
      /* the handler takes data, roweis, and a callback. we trust it to do the right thing. */
      return handler;
    }
    else if (handler.length <= 2) {
      /* the handler takes data and roweis, but no callback. */
      return function (data, roweis, callback) {
        return callback(handler(data, roweis) || data, roweis);
      }
    }
    else window.console && console.log('WTF!?', handler);
  };
  
  // Composes two functions through CPS, converting them into _callbackables
  // in the process
  function _compose (x, y) {
    if (_. isUndefined(y) || y.is_noop) {
      return _callbackable(x);
    }
    else if (_. isUndefined(x) || x.is_noop) {
      return _callbackable(y);
    }
    else return function (data, roweis, callback) {
      _callbackable(x)(data, roweis, function (data2) {
        _callbackable(y)(data2, roweis, callback);
      })
    };
  };
  
  // creates a simple hash of an object, suitable for sending some json
  // snarfed from [http://github.com/quirkey/sammy](http://github.com/quirkey/sammy)
  function _hash (object) {
    var json = {};
    $.each(object, function(k,v) {
      if ('function' !== typeof(v)) {
        json[k] = v;
      }
    });
    return json;
  };
  
  function _extend (full_stack) {
    var out = _.foldl(full_stack, function (acc,hash) { return jQuery.extend(acc,hash); }, {});
    for (var prop in out) {
      if (out.hasOwnProperty(prop)) {
        var prop_stack = _(full_stack).chain()
          .pluck(prop)
          .reject(_.isUndefined)
          .value();
        if (true === out[prop]) {
          /* that's the value */
        }
        else if (_(prop_stack).any(function (prop) { return false === prop; })) {
          out[prop] = false;
          /* window.console && console.log('ixnayed ',prop_stack); */
        }
        else if (prop.match(/^before_/)) {
          out[prop] = prop_stack;
        }
        else if (prop.match(/^after_/)) {
          out[prop] = prop_stack.reverse();
        }
        else if (_(out.paths).include(prop) && _(prop_stack).any(_.isString)){
          /* this could be a join, but we're leaving room for customization */
          out[prop] =  _(prop_stack).chain()
            .select(_.isString)
            .reject(_.isEmpty)
            .value()
            .join('/');
          
          /* 'route' === prop && window.console && console.log(out['route']+' from ',prop_stack); */
        }
      }
    }
    /* out.location && window.console && console.log('in:',full_stack,'out:',out,'for'+out.route); */
    return out;
  }
        
  // The `.display(...)` and `.action(...)` methods both ultimately work with a hash called `config`
  // that configures a new handler for Sammy. This function provides you with a lot of flexibility when
  // declaring the hash. That in turn makes for mroe readable declarations. For example, you could
  // write:
  //
  //     .display({ name: 'fu', partial: 'bar' });
  //
  // However, the name doesn't really stand out. That matters, because by convention the name serves as a
  // default. So while this is legal, you can also write:
  //
  //     .display('fu', { partial: 'bar' });
  //
  // Placing the name first as its own parameter ames it more obvious. In really simple cases, you can even write:
  //
  //     .display('foo');
  //
  // There are usually default configuration options. These could be mixed in by writing:
  //
  //      .action('bar', $.extend(, some_defaults, { /* my config */ });
  //
  // But again this de-emphasizes the configuration you are writing. So instead, you can write:
  //
  //     .action('bar', { /* my config */ }, some_defaults);
  //
  // Or:
  //
  //     .action({ /* my config */ }, some_defaults);
  //
  // Read on for more of its special cases and logic.
  function _mix_in_optional_parameters_and_conventions (controller, name, optional_config, local_defaults) {  
    /*TODO: Extract to a hash of default behaviours so that we can write our own*/
    
    if (_.isString(name)) {
      name_hash = { name: name };
    }
    else if ('number' === typeof(name)) {
      name_hash = { code: name, name: name.toString() };
    }
    
    optional_config || (optional_config = {});
    local_defaults  || (local_defaults  = {});
    
    var config = $.extend({}, local_defaults, optional_config, name_hash);
    
    // First, missing configurations
      
    // The definition of a new handler is driven by the configuration
    // parameters you supply. But we value convention over configuration, so
    // what follows are a metric fuckload of special cases.
    
    // Many conventions rely on each handler having a unique name within the
    // application. Faux doesn't enforce that names be unique, but it does
    // take a shot at guessing the name if you don't supply one.
    //
    // `.gets`, `.posts` and so on are all declarations that the `fetch_data`
    // goes to a server for some `data`. The first rule is that if you don't supply
    // a name and you do supply a server path, the name of the handler will be the
    // server path.
    //
    // Nota bene: remember that `_mix_in_optional_parameters_and_conventions` lets you write either
    // `.action('doSomething', { ... })` or `.action({ name: 'doSomething', ... })` as
    // you prefer.
    if (_.isUndefined(config.name)) {
      var verb = _.detect(_verb_inflections(), function (v) { return _.isString(config[v]); });
      if (verb) {
        config.name = config[verb];
      }
    }
    
    // `config.route` is the route used by Sammy to trigger the application. If you don't 
    // supply a route, Faux guess it as the name. Some additional massaging below takes
    // care of the hash and root path, so if you write `.display('bravado')`, you are getting
    // a route of `#bravado` by convention.
    //
    // Also note that we very deliberately test for whether you have defined a route, not
    // for truthiness. Under certain circumstances you may wish to have a handler that
    // cannot be triggered with a location. When that is the case, you can write
    // `.display('stealth', { route: false, ... })` and no route will be configured
    // by convention.
    if (_.isUndefined(config.route) && config.name) {
      config.route = config.name;
    }
    
    // `config.partial` is the partial path to a partial used by Sammy to display `data`. 
    // If you don't supply it, Faux guess it as the name. Some additional massaging below takes
    // care of a root path and default suffix using scopes and application defaults, path, so 
    // if you write `.display('bravado')`, you could be getting a partial of 
    // `/partials/bravado.haml` by convention.
    if (_.isUndefined(config.partial)) {
      config.partial = config.name;
    }
    
    // `config.events` is an array of events that fire the handler.
    if (_.isUndefined(config.events)) {
      config.events = [];
      // By default, the name of a handler is its default event
      if (config.name) {
        config.events.push(config.name);
      }
      // By default, specifying `config.renders` makes an unobtrusive handler
      if (config.renders) {
        config.events.push('after_display');
        config.events.push('run');
      }
    }
    
    // `config.view` is true if we want a veiw class. `config.clazz` explicitly provides
    // the class. If the class is explictly provided, no need to write `view: true`
    if (_.isUndefined(config.view) && config.clazz) {
      config.view = true;
    }
    
    // second, extend historically
    
    var full_stack = _.clone(controller.roweis.config_stack)
    full_stack.push(config);
    config = _extend(full_stack);
    
    // third, modification
    
    // next we deal with certain conventions. One is that if there is a config
    // parameter called `foo`, then the parameter `foo_home_path` has special
    // significance: the value for `foo` is actually `config.foo_home_path + '/' + config.foo`.
    //
    // We call this a prefix, and it is very useful in conjucntion with scopes.
    //
    // This is generalized: There is a set of parameter suffixes and separators defined as
    // a hash:
    var prefixes = {
      '_home_path': '/'
    };
    for (var prop in config) {
      /*TODO: Mix in `foo_suffix`*/
      
      var val = config[prop];
      if (config.hasOwnProperty(prop) && val) {
        _(prefixes).each(function (separator, suffix) {
          if (config[prop+suffix]) {
            if (_.isString(val)) {
              config[prop] = [config[prop+suffix], val].join(separator);
            }
            else if ('object' === typeof(val)) {
              for (var inner_prop in val) {
                if (val.hasOwnProperty(inner_prop) && _.isString(val[inner_prop])) {
                  val[inner_prop] = [config[prop+suffix], val[inner_prop]].join(separator);
                }
              }
            }
          }
        });

      }
    }
    
    // Finally, a special case that routes should start with `/`
    if (_.isString(config.route) && !config.route.match(/^\//)) {
      config.route = '/' + config.route;
    }
    
    return config;
  };
    
  function _fully_interpolated () {
    var hash_path = _fully_interpolated.arguments[0];
    var data = {};
    for (var i = 1; i < _fully_interpolated.arguments.length; ++i) {
      $.extend(true, data, arguments[i]);
    }
    $.each(hash_path.match(/[*:][a-zA-Z_]\w*/g) || [], function(i, parameter) {
      var parameter_name = parameter.substring(1);
      var parameter_value = data[parameter_name];
      delete data[parameter_name];
      hash_path = hash_path.replace(parameter, parameter_value);
    });
    var params = [];
    $.each(data, function (parameter_name, parameter_value) { 
      if ('etc' != parameter_name && data.hasOwnProperty(parameter_name) && (parameter_value || 0 === parameter_value)) {
        params.push(encodeURIComponent(parameter_name) + '=' + encodeURIComponent(parameter_value));
      }
    })
    return _.compact([
      hash_path,
      _.compact(params).join('&')
    ]).join('?')
  };
  
  function _internal_interpolate (fn_or_path, data, optional_data) {
    var fn;
    if (_.isString(fn_or_path) && fn_or_path.match(/^(#|\/)/)) {
      fn = function () { return fn_or_path; };
    }
    else if (_.isFunction(fn_or_path)) {
      fn = fn_or_path;
    }
    else if (_.isFunction(fn_or_path.toFunction)) {
      fn = fn_or_path.toFunction();
    }
    var path = fn.call(this, data, optional_data);
    var transformed_path = path;
    /* TODO: replace with a fold */
    $.each(path.match(/\:[a-zA-Z_]\w*/g) || [], function(i, parameter) {
      var parameter_name = parameter.substring(1);
      var parameter_value = data[parameter_name] || (data.server_data && data.server_data[parameter_name]);
      transformed_path = transformed_path.replace(parameter, parameter_value);
    });
    $.each(path.match(/\*[a-zA-Z_]\w*$/g) || [], function(i, splat_parameter) {
      var parameter_name = splat_parameter.substring(1);
      var parameter_value = data[parameter_name] || (data.server_data && data.server_data[parameter_name]);
      transformed_path = transformed_path.replace(splat_parameter, parameter_value);
    });
    return transformed_path;
  };
  
  // This function works very much like `$.extend(true, ...)`. It was written for the worst
  // of all possible reasons, because I didn't know you could pass `true` to `$.extend(...)`
  // to perform a recursive extension.
  function _meld () {
    var args = _.compact(arguments);
    if (args.length == 0) {
      return;
    }
    else if (args.length == 1) {
      return args[0];
    }
    else if (_.every(args, _.isArray)) {
      return _.foldl(args, function (x,y) { return x.concat(y); }, []);
    }
    else if (_.some(args, function (obj) { return typeof(obj) !== 'object'; })) {
      return args[args.length - 1];
    }
    else return _.foldl(args,
      function (extended, obj) {
        for (var i in obj) {
          if (obj.hasOwnProperty(i)) {
            extended[i] = _meld(extended[i], obj[i]);
          }
        }
        return extended;
      }, 
      {}
    );
  };
  
  // A mapper is a function that maps a data object into another data object.
  // Mappers can also perform actions for side-effects. If a mapper doesn't
  // return a new data object, the original is returned.
  //
  // Mappers come up in several places, most notably when a programmer explicitly
  // writes step advice, e.g. `after_fetch_data: function (data) { ... }`.
  // Obviously, a mapper can be a single function taking one argument. Mappers
  // can also be an entity with a `.toFunction` method or a hash describing the
  // resulting object. In the case of a hash, each element must either be
  // a value or a function. If it's a function, it is called with the data object as
  // a parameter to determine the value at that key.
  function _mapper_to_fn (mapper) {
    if (_.isFunction(mapper)) {
      return mapper;
    }
    else if (_.isFunction(mapper.toFunction)) {
      return mapper.toFunction();
    }
    else if (true === mapper || false === mapper || _.isUndefined(mapper)) {
      return I;
    }
    else {
      return function (data) {
        var result = {};
        
        _(mapper).each(function (value, name) {
          if (_.isFunction(value) && 1 === value.length) {
            result[name] = value.call(this, data);
          }
          else if (value && _.isFunction(value.toFunction)) {
            var fn = value.toFunction();
            if (1 === fn.length) {
              result[name] = fn(data);
            }
            else (window.console && console.log('error, ' + value + ' is incorrectly configured'));
          }
          else if (value) {
            result[name] = value;
          }
        });
        
        return result;
      };
    }
    
  };
  
  // The identity function
  function I (data) { return data; };
  
  // The inflections you can use for the various verbs. It's written as a function so that it can be placed at the bottom of the file.
  function _verb_inflections () { return ['get', 'gets', 'post', 'posts', 'put', 'puts', 'delete', 'deletes']; };
  
  // a handy noop function, the equivalent of I in CPS
  function _noop () {
    var noop;
    noop || (noop = function (data, roweis, callback) { return callback(data, roweis); });
    noop.roweis || (noop.roweis = {is_noop: true});
    return noop;
  };

})(jQuery);

// **License Terms**
/*
The MIT License

Copyright (c) 2010 Reginald Braithwaite and Unspace Interactive

http://reginald.braythwayt.com
http://unspace.ca

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

Portions of this code are also (c) Aaron Quint and others

http://github.com/quirkey/sammy

*/