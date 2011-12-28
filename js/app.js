var App = Em.Application.create();

App.CONFIG = {
    alfresco: {
        username: 'admin',
        password: 'admin',
        host: 'localhost',
        port: 8080,
        protocol: 'http',
        service_base_path: '/alfresco/s',
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
 *
 */
App.models = {};

// The following is not required until DS.hasOne is implemented.
/*
App.models.Property = DS.Model.extend({
    name: DS.attr('string',{key: 'cm:name'}),
    title: DS.attr('string',{key: 'cm:title'}),
    description: DS.attr('string', {key: 'cm:description'}),
    contentURL: DS.attr('string'),
    dateValue: function() {
        return this.get('cm:modified').value;
    }.property().cacheable()
});

App.models.Node = DS.Model.extend({
    primaryKey: 'nodeRef',
    properties: DS.hasMany(App.models.Property, {embedded: true})
});
*/

App.models.Item = DS.Model.extend({
    primaryKey: 'webdavUrl'
});

App.adapter = DS.Adapter.create({
    findQuery: function(store, type, query, modelArray) {
        var alf = App.CONFIG.alfresco;
        var proxy = App.CONFIG.proxy;
        var prefix = proxy.enabled ? proxy.endpoint : '';

        var login = (alf.username && alf.password) ? alf.username + ':' + alf.password + '@' : '';

        var url = prefix + alf.protocol + '://' + login + alf.host + ':' + alf.port + alf.service_base_path + '/slingshot/doclib2/doclist/' + alf.content_model + '/site/' + alf.site_name +
            "/documentLibrary/" + alf.content_folder;

        $.getJSON(url, function(data){
            console.log(data.items);
            modelArray.load(data.items);
        });

    }
});

App.store = DS.Store.create({
    adapter: 'App.adapter'
});

/*
 * Views
 */
App.MyView = Em.View.extend({
  mouseDown: function() {
    window.alert("hello world!");
  }
});
