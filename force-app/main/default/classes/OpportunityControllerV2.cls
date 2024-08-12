public with sharing class OpportunityControllerV2 {
    @AuraEnabled
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
        Map<Id, Account> accMap= New Map<Id, Account> ([SELECT Email__c, Emails_to_CC__c, Emails_to_BCC__c FROM Account WHERE Id = :selectedAccountIds]);
        List<String> emailAddresses = new List<String>();
        List<String> ccAddresses = new List<String>();
        List<String> bccAddresses = new List<String>();
        for (Account acc : accMap.values()) {
            if (acc.Email__c != null) {
                emailAddresses.add(acc.Email__c);
            }
            if (acc.Emails_to_CC__c != null) {
                ccAddresses.add(acc.Emails_to_CC__c);
            }
            if (acc.Emails_to_BCC__c != null) {
                bccAddresses.add(acc.Emails_to_BCC__c);
            }
        }
        
        if (opp != null) {
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(emailAddresses );
            mail.setCcAddresses(ccAddresses);
            mail.setBccAddresses(bccAddresses);
            mail.setSubject('This is a Test Lenders Submission!');
            // Create a plain text body with new lines
            String body = 'Dear Recipient,\n\n';
            body += 'Please see the attached submission with supporting documentation for review.\n\n';
            body += 'Submission Notes:\n\n';
            body += '\nBest regards,\nAdmin 1800BizFund,\nFunding Admin  ';
            mail.setPlainTextBody(body);
    
            // Prepare email attachments
            List<Messaging.EmailFileAttachment> attachments = new List<Messaging.EmailFileAttachment>();
    
            // Query ContentVersion records
            List<ContentVersion> contentVersions = [SELECT Id, Title, VersionData, FileType FROM ContentVersion WHERE Id IN :contentVersionIds];
            Map<String, String> fileTypeExtensionMap = new Map<String, String>{
                'EXCEL_X' => '.xlsx',
                'WORD_X' => '.docx',
                'POWER_POINT_X' => '.pptx',
                'PDF' => '.pdf',
                'TEXT' => '.txt',
                'JPEG' => '.jpg',
                'PNG' => '.png',
                'GIF' => '.gif',
                'MP4' => '.mp4',
                'ZIP' => '.zip',
                'CSV' => '.csv',
                'RTF' => '.rtf'
            };
            
            for (ContentVersion cv : contentVersions) {
                Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
                attachment.setFileName(cv.Title + (fileTypeExtensionMap.containsKey(cv.FileType) ? fileTypeExtensionMap.get(cv.FileType) : ''));
                attachment.setBody(cv.VersionData);
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
    @AuraEnabled
    public static void createSubmissions(Id opportunityId, List<Id> selectedAccountIds) {
        system.debug('opp: '+opportunityId);
        system.debug('accs: '+selectedAccountIds);
        try {
            // Query accounts to get required details
            List<Account> accs = new List<Account>([
                SELECT Id, Email__c
                FROM Account
                WHERE Id IN :selectedAccountIds
            ]);

            List<Submission__c> submissions = new List<Submission__c>();

            for (Account acc : accs) {
                Submission__c submission = new Submission__c();
                submission.Opportunity__c = opportunityId;
                submission.Lender__c = acc.Id;
                submission.Email__c = acc.Email__c;
                    //Notes__c = acc.Notes__c
                submissions.add(submission);
            }

            if (!submissions.isEmpty()) {
                insert submissions;
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error creating submissions: ' + e.getMessage());
        }
    }

}
