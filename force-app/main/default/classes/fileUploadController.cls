public with sharing class fileUploadController {

    @AuraEnabled(cacheable=true)
    public static List<ContentVersion> getFilesForRecord(Id recordId) {
        return [
            SELECT Id, Title, ContentSize, Type__c, ContentDocumentId 
            FROM ContentVersion 
            WHERE FirstPublishLocationId = :recordId
        ];
        
    }
}
