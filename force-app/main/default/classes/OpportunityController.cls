public with sharing class OpportunityController {
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

  /*  @AuraEnabled
    public static void sendEmail(Id opportunityId) {
        Opportunity opp = [SELECT Name, Owner.Email FROM Opportunity WHERE Id = :opportunityId LIMIT 1];
        if (opp != null) {
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(new String[] { opp.Owner.Email });
            mail.setSubject('Opportunity Update');
            mail.setPlainTextBody('Opportunity ' + opp.Name + ' has been updated.');
            Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
        } else {
            throw new AuraHandledException('Opportunity not found.');
        }
    }*/

    @AuraEnabled
public static void sendEmail(Id opportunityId, List<Id> contentVersionIds) {
   system.debug('ids'+contentVersionIds);
    Opportunity opp = [SELECT Name, Owner.Email FROM Opportunity WHERE Id = :opportunityId LIMIT 1];
    
    if (opp != null) {
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setToAddresses(new String[] { opp.Owner.Email });
        mail.setSubject('Opportunity Update');
        mail.setPlainTextBody('Opportunity ' + opp.Name + ' has been updated.');

        // Prepare email attachments
        List<Messaging.EmailFileAttachment> attachments = new List<Messaging.EmailFileAttachment>();

        // Query ContentVersion records
        List<ContentVersion> contentVersions = [SELECT Id, Title, VersionData FROM ContentVersion WHERE Id IN :contentVersionIds];
        
        for (ContentVersion contentVersion : contentVersions) {
            Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
            attachment.setFileName(contentVersion.Title);
            attachment.setBody(contentVersion.VersionData);
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

}

