public with sharing class OpportunityController {
    @AuraEnabled(cacheable=true)
    public static Opportunity getOpportunityInfo(Id opportunityId) {
        try {
            Opportunity opp = [
                SELECT Id, Name, StageName, CloseDate, Amount, ExpectedRevenue, Type, Owner.Name
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
    }
}

