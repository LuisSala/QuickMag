var App = Em.Application.create({

    ready: function() {
        this._super();
        App.itemsController.loadItems();

        var v = App.ItemListView.create();
        this.set('mainView', v);

        v.append();

    }

});

App.CONFIG = {
    alfresco: {
        username: 'admin',
        password: 'admin',
        host: 'x.local',
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

            var login = (alf.username && alf.password) ? alf.username + ':' + alf.password + '@' : '';

            var contentUrl = this.get('contentUrl');

            var url = prefix + alf.protocol + '://' + login + alf.host + ':' + alf.port + alf.service_base_path + contentUrl;

            var _self = this;

            $.ajax(url,{
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

        var login = (alf.username && alf.password) ? alf.username + ':' + alf.password + '@' : '';

        var url = prefix + alf.protocol + '://' + login + alf.host + ':' + alf.port + alf.service_base_path + '/slingshot/doclib2/doclist/' + alf.content_model + '/site/' + alf.site_name +
            "/documentLibrary/" + alf.content_folder;

        var _self = this;

        $.ajax(url,{
            username: alf.username,
            password: alf.password,
            dataType: 'json',
            success: function(data){

                console.log('Fetched Items: '+data.items.length);

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
        v.show();
    }
});

window.EmExt = {};

// TODO Prevent swipe/scrolling of background list when modal is shown.
EmExt.ModalView = Em.View.extend({
    elementInserted: false,

    init: function(){
        this._super();
        this.modal({
            backdrop: 'static'
        });
    },

    didInsertElement: function(){
        this.set('elementInserted', true)
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
    click: function() {
        App.itemModalViewController.showView(this.get('content'));
    },
    // TODO Consider using Press gestures instead.
    tapEnd: function(recognizer){
        Em.Logger.log("Tap!");
        this.click();
    }
});

App.ItemListView = Em.View.extend({
    templateName: 'item-list',

    // Apply the masonry layout once the element is inserted into the DOM.
    didInsertElement: function() {
        var e = this.$();

        console.log("masonry: "+e.attr('id'));
        e.masonry({
            columnWidth: 200
        });
    } // end didInsertElement()
});