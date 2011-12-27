### Login:
    GET http://localhost:8080/alfresco/s/api/login?u=admin&pw=admin&format=json

### Sites:
    GET http://localhost:8080/alfresco/s/api/sites

### DocLib Containers:
    GET http://localhost:8080/alfresco/s/slingshot/doclib/containers/acme

### Filtered Doclist:
    GET http://127.0.0.1:8080/share/service/components/documentlibrary/data/doclist/all/site/acme/documentLibrary/?filter=path&size=50&pos=1&sortAsc=true&sortField=cm%3Aname&view=browse&noCache=1318784482363

### Images Folder:
    GET http://127.0.0.1:8080/share/service/components/documentlibrary/data/doclist/all/site/acme/documentLibrary/Images?filter=path&size=50&pos=1&sortAsc=true&sortField=cm%3Aname&view=browse&noCache=1318784792554