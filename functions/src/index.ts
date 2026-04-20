import * as admin from "firebase-admin";

admin.initializeApp();

// Export email notification functions
export {
    sendVisitScheduledEmail,
    sendNewMessageEmail,
    sendApplicationReceivedEmail,
    onInstagramTokenExpired,
} from "./email/notifications";
