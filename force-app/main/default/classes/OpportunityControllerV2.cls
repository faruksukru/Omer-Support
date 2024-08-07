public with sharing class OpportunityControllerV2 {
    @AuraEnabled(cacheable=true)
    public static Opportunity getOpportunityInfo(Id opportunityId) {
        try {
            Opportunity opp = [
                SELECT Id, Name, StageName, CloseDate, Amount, ExpectedRevenue, Type, Owner.Name, Credit_Score__c
                FROM Opportunity
                WHERE Id = :opportunityId
                LIMIT 1
            ];
            return opp;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

   @AuraEnabled
    public static void sendEmail(Id opportunityId, List<Id> contentVersionIds, List<Id> selectedAccountIds) {
       system.debug('filesids'+contentVersionIds);
       system.debug('acountids'+selectedAccountIds);
        Opportunity opp = [SELECT Name, Owner.Email FROM Opportunity WHERE Id = :opportunityId LIMIT 1];
        //Account accs = [SELECT Email FROM Account WHERE Id = :selectedAccountIds];
        Map<Id, Account> accMap= New Map<Id, Account> ([SELECT Email__c FROM Account WHERE Id = :selectedAccountIds]);
        List<String> emailAddresses = new List<String>();
        for (Account acc : accMap.values()) {
            if (acc.Email__c != null) {
                emailAddresses.add(acc.Email__c);
            }
        }
        
        if (opp != null) {
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(emailAddresses );
            mail.setSubject('Opportunity Update');
            mail.setPlainTextBody('Opportunity ' + opp.Name + ' has been updated.');
    
            // Prepare email attachments
            List<Messaging.EmailFileAttachment> attachments = new List<Messaging.EmailFileAttachment>();
    
            // Query ContentVersion records
            List<ContentVersion> contentVersions = [SELECT Id, Title, VersionData, FileType FROM ContentVersion WHERE Id IN :contentVersionIds];
            
            for (ContentVersion cv : contentVersions) {
                Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
                attachment.setFileName(cv.Title + '.' + cv.FileType);
                attachment.setBody(cv.VersionData);
                attachment.setContentType('application/' + cv.FileType.toLowerCase());
                attachments.add(attachment);
            }
            
            // Set attachments to the email
            mail.setFileAttachments(attachments);
            
            // Send the email
            Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
        } else {
            throw new AuraHandledException('Opportunity not found.');
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Account> getAllLenders() {
        try {
            Id lendersRecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Lenders').getRecordTypeId();
            return [
                SELECT Id, Name, Minumum_Credit_Score__c, Minumum_Monthly_Deposit_Amount__c, Restricted_Industries__c
                FROM Account
                WHERE RecordTypeId = :lendersRecordTypeId
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    

    @AuraEnabled
    public static void updateOpportunityStage(Id opportunityId, String newStage) {
        try {
            Opportunity opp = [SELECT Id, StageName FROM Opportunity WHERE Id = :opportunityId LIMIT 1];
            if (opp != null) {
                opp.StageName = newStage;
                update opp;
            } else {
                throw new AuraHandledException('Opportunity not found.');
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
