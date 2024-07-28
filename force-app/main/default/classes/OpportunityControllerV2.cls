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

    @AuraEnabled(cacheable=true)
    public static List<Account> getFilteredAccounts(Decimal creditScore) {
        try {
            // Get the record type ID for the 'Lenders' record type
            Id lendersRecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Lenders').getRecordTypeId();

            return [
                SELECT Id, Name, Minumum_Credit_Score__c, Minumum_Monthly_Deposit_Amount__c, Restricted_Industries__c
                FROM Account
                WHERE Minumum_Credit_Score__c <= :creditScore
                AND RecordTypeId = :lendersRecordTypeId
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
