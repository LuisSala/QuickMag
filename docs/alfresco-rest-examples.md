### Login:
`    GET http://localhost:8080/alfresco/s/api/login?u=admin&pw=admin&format=json
`
### Sites:
`    GET http://localhost:8080/alfresco/s/api/sites
`
### DocLib Containers:
`    GET http://localhost:8080/alfresco/s/slingshot/doclib/containers/acme
`
### Documents in a given folder:
`    GEThttp://localhost:8080/alfresco/s/slingshot/doclib2/doclist/cm:content/site/acme/documentLibrary/News
`
### Getting a specific documents' content using the contentUrl property from above:
`    GET http://localhost:8080/alfresco/s/api/node/content/workspace/SpacesStore/3a2f5a53-7511-40bc-9cd4-cb9301b63bb1/Alfresco%204%20Delivers%20Cloud-Scale%20Performance%2c%20Social%20Publishing%20and%20Consumer-Like%20UI.html
`