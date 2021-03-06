// TODO Reflow layout on screen orientation change. http://favo.eu/2010/07/detecting-ipad-orientation-using-javascript/

var App = Em.Application.create({

    ready: function() {
        this._super();
        console.log("init");
        if (window.forge) {
            console.log("forge");
            App.CONFIG = App.forge.CONFIG;
            App.ajax = window.forge.ajax;
            // Attach Catalyst Debugger
            if (App.CONFIG.debug) {
                console.log("debug");
                //document.write(unescape('%3Cscript src="https://trigger.io/catalyst/target/target-script-min.js#035E0F0A-8E48-43F2-A593-1FF44B43C61D"%3E%3C/script%3E'));
            }
        }
        App.itemsController.loadItems();

        var v = App.ItemListView.create();
        this.set('mainView', v);

        v.append();
    }

});

App.ajax = $.ajax;

App.utils = SC.Object.create({
    layoutArray: [6,6,3,6,3,3,3,6],
    current: 0,
    nextColumn: function() {
        var current = this.get('current');
        var ary = this.get('layoutArray');
        var next = (current + 1) % ary.length;
        console.log(next);
        this.set('current', next);
        return ary[current];
    }
});

App.hashTools = SC.Object.create({

    hash: function (str) {
        var hash = 0;
        if (str.length == 0) return hash;
        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    },

    randomGuid: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

});
App.browser = {};
App.browser.CONFIG = {
    debug: true,
    alfresco: {
        username: 'admin',
        password: 'admin',
        host: 'home.sala.us',
        port: 8080,
        protocol: 'http',
        service_base_path: '/alfresco/s', // use the form '/alfresco/service
        site_name: 'acme',
        content_folder: 'News', // Folder name under the corresponding site docLib
        content_model: 'cm:content'
    },
    proxy:{
        enabled: true,
        endpoint: '/_proxy/'
    }
};
App.forge = {};
// Perform a "deep" copy of the browser config object.
App.forge.CONFIG = $.extend(true,{}, App.browser.CONFIG);
App.forge.CONFIG.alfresco.port = 80;
App.forge.CONFIG.proxy =  {
        enabled: false,
        endpoint: '/_proxy/'
};

App.CONFIG = App.browser.CONFIG;

App.ajax = $.ajax;

/*
 * Datastore and Model Declarations
 * Eventually, we'll use Ember Data, but it doesn't currently support "hasOne" relationships.
 */
App.models = {};

App.models.Item = Em.Object.extend({
    data: {}, // Raw data object used to populate model instance.

    id: function() {
        return this.get('data').node.nodeRef;
    }.property('data').cacheable(),

    dateValue: function() {
        return this.get('data').node.properties['cm:modified']['value'];
    }.property('data').cacheable(),

    name: function() {
        return this.get('data').node.properties['cm:name'];
    }.property('data').cacheable(),

    title: function() {
        return this.get('data').node.properties['cm:title'];
    }.property('data').cacheable(),

    description: function() {
        return this.get('data').node.properties['cm:description'];
    }.property('data').cacheable(),

    _content: "",

    contentUrl: function() {
        return this.get('data').node.contentURL;
    }.property('data').cacheable(),

    contentBody: function() {
        if (this.get('_content') === "") {
            var alf = App.CONFIG.alfresco;
            var proxy = App.CONFIG.proxy;
            var prefix = proxy.enabled ? proxy.endpoint : '';

            //var login = (alf.username && alf.password) ? alf.username + ':' + alf.password + '@' : '';
            var login = "";

            var contentUrl = this.get('contentUrl');

            var url = prefix + alf.protocol + '://' + login + alf.host + ':' + alf.port + alf.service_base_path + contentUrl;

            var _self = this;

            App.ajax({
                url: url,
                crossDomain: true,
                username: alf.username,
                password: alf.password,
                dataType: 'html',
                success: function(data){
                    _self.set('_content', data);
                }
            });
        }

        return this.get('_content');
    }.property('_content', 'data').cacheable()

});

// An ArrayController subclasses ArrayProxy but doesn't actually add any functionality. Used here to mark a controller.
App.itemsController  = Em.ArrayController.create({

    content: [],

    loadItems: function() {

        var alf = App.CONFIG.alfresco;
        var proxy = App.CONFIG.proxy;
        var prefix = proxy.enabled ? proxy.endpoint : '';

        //var login = (alf.username && alf.password) ? alf.username + ':' + alf.password + '@' : '';
        var login = "";
        var url = prefix + alf.protocol + '://' + login + alf.host + ':' + alf.port + alf.service_base_path + '/slingshot/doclib2/doclist/' + alf.content_model + '/site/' + alf.site_name +
            "/documentLibrary/" + alf.content_folder;

        var _self = this;

        $.ajax({
            url: url,
            crossDomain: true,
            username: alf.username,
            password: alf.password,
            dataType: 'json',
            success: function(data){

                //console.log('Fetched Items: '+data.items.length);

                for (var i=0; i< data.items.length; i++) {
                    _self.pushObject(App.models.Item.create({data: data.items[i]}));
                }
            }
        });

    } // end loadItems()

});

App.itemModalViewController = Em.Object.create({
    view: null,

    showView: function (content) {
        var v = this.get('view');
        if (!v) {
            v = App.ItemModalView.create();
            this.set('view', v);
            v.append();
        }
        v.set('content', content);
        App.get('mainView').fadeOut();
        v.show();
    },

    hideView: function(){
        App.get('mainView').fadeIn();
    }
});

window.EmExt = {};

// TODO Prevent swipe/scrolling of background list when modal is shown.
EmExt.ModalView = Em.View.extend({
    elementInserted: false,

    init: function(){
        this._super();
        this.modal({
            //backdrop: 'static'
        });

    },

    didInsertElement: function(){
        this.set('elementInserted', true);

        // This is an attempt to attach event handlers for 'shown' and 'hidden' to disable scrolling.
        // http://jsbin.com/ikuma4/2/edit#source
        // http://stackoverflow.com/questions/3656592/programmatically-disable-scrolling
        /*
        var _self = this;
        this.$().bind('shown', function(){
            var top = $(window).scrollTop();
            var left = $(window).scrollLeft();

            var e = _self.$();
            console.log('shown '+top+':'+left);
            $('body').css('overflow', 'hidden');
            $(window).scroll(function(){
                $(this).scrollTop(top).scrollLeft(left);
            });
        });
        this.$().bind('hidden', function(){
            console.log('hidden');
            $('body').css('overflow', 'auto');
            $(window).unbind('scroll');
        });
        */
        this.$().bind('hide', function(){
           App.itemModalViewController.hideView();
        });
    },

    toggle: function(){
        this.modal('toggle');
    },

    show: function(){
        this.modal('show');
    },

    hide: function(){
        this.modal('hide');
    },

    modal: function(cmd) {
        var elementId = '#'+this.get('elementId');
        // We recursively delay execution until the next RunLoop tick to make sure the element has been inserted into the DOM. Otherwise, calling a modal method will fail.
        // TODO Find a better way to defer execution of the modal function.
        var _self = this;
        if (_self.get('elementInserted')) {
            console.log(elementId);
            $(elementId).modal(cmd);
        } else {
            Em.run.next(function(){
                _self.modal(cmd);
            });
        }

    }
});

/*
 * Views
 */


App.ItemModalView = EmExt.ModalView.extend({
    classNames: ['modal', 'hide', 'fade'],
    templateName: 'item-modal'

});

// TODO Be more discriminating with touches (eg. tell apart a scroll/swipe from a tap.
App.ItemSummaryView = Em.View.extend({
    classNameBindings:['columnType', 'selected'],
    selected: false,

    columnType: function() {
        //var next = 'col'+((Math.abs(App.hashTools.hash(this.getPath('content.id')) % 3)+2));
        //var next = 'span'+((Math.abs(App.hashTools.hash(this.getPath('content.id')) % 3)+1)*3);
        //var next = 'span'+App.utils.nextColumn();
        var next='span5';
        return next;
    }.property('content').cacheable(),
    didInsertElement: function() {
        var parentEl = this.get('parentView').$();
        var myEl = this.$();
        parentEl.masonry('appended', myEl);

    },

    click: function() {
        App.itemModalViewController.showView(this.get('content'));
    },
    // TODO Consider using Press gestures instead.
    pressOptions: {
        pressPeriodThreshold: 100
    },
    touchStart: function(){
        this.set('selected', true);
        var self = this;
        window.setTimeout(function(){
            self.set('selected', false);
        }, 100);
        return true;
    },

    pressEnd: function(recognizer){
        this.set('selected', false);
        this.click();
    }
});


App.ItemListView = Em.View.extend({
    templateName: 'item-list',
    classNames:['item-list centered'],
    // Apply the masonry layout once the element is inserted into the DOM.

    fadeOut: function() {
        this.$().css('opacity', 0);
        var _self = this;
        setTimeout(function(){_self.set('isVisible', false)},500);
    },

    fadeIn: function() {
        this.set('isVisible', true);
        // Force Masonry to refresh/reanimate, important if orientation changes while modal is open;
        this.$().masonry('reload');
        var _self = this;
        setTimeout(function(){_self.$().css('opacity', 1)},500);

    },

    didInsertElement: function() {
        var e = this.$();
        // Leaving isAnimated as 'false' means that faster CSS transitions defined in style/less will be used.
        e.masonry({
            itemSelector: '.item',
            isAnimated: false,
            isFitWidth: true,
            columnWidth: 10,
            animationOptions: {
                duration: 200 // These apply only if isAnimated is enabled
            }
        });
    } // end didInsertElement()
});
