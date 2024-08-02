public with sharing class fileUploadController {

    @AuraEnabled(cacheable=true)
    public static List<String> getTypePicklistValues() {
        List<String> picklistValues = new List<String>();
        Schema.DescribeFieldResult fieldResult = ContentVersion.Type__c.getDescribe();
        List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();

        for (Schema.PicklistEntry entry : picklistEntries) {
            picklistValues.add(entry.getValue());
        }
        return picklistValues;
    }

    @AuraEnabled(cacheable=true)
    public static List<ContentVersion> getFilesForRecord(Id recordId) {
        return [
            SELECT Id, Title, ContentSize, Type__c, ContentDocumentId 
            FROM ContentVersion 
            WHERE FirstPublishLocationId = :recordId
        ];
    }

    @AuraEnabled
    public static void updateFileType(Id contentVersionId, String type) {
        ContentVersion contentVersion = [SELECT Id, Type__c FROM ContentVersion WHERE Id = :contentVersionId LIMIT 1];
        contentVersion.Type__c = type;
        update contentVersion;
    }
}
