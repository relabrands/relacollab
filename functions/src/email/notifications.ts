import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const getVisitScheduledEmail = (data: {
  creatorName: string;
  brandName: string;
  campaignTitle: string;
  visitDate: string;
  visitTime: string;
  location: string;
  duration: number;
  contentDeadline: string;
}) => ({
  subject: `📅 Visit Scheduled: ${data.campaignTitle}`,
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .detail { margin: 15px 0; padding: 15px; background: white; border-radius: 8px; }
          .label { font-weight: bold; color: #667eea; margin-bottom: 5px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ Your Visit Has Been Scheduled!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${data.creatorName}</strong>,</p>
            <p>Great news! Your visit for <strong>${data.campaignTitle}</strong> has been automatically scheduled with ${data.brandName}.</p>
            
            <div class="detail">
              <div class="label">📅 Date & Time</div>
              <div>${data.visitDate} at ${data.visitTime}</div>
            </div>
            
            <div class="detail">
              <div class="label">📍 Location</div>
              <div>${data.location}</div>
            </div>
            
            <div class="detail">
              <div class="label">⏱️ Duration</div>
              <div>${data.duration} minutes</div>
            </div>
            
            <div class="detail">
              <div class="label">📝 Content Deadline</div>
              <div>${data.contentDeadline}</div>
            </div>
            
            <p>Need to reschedule? Just message the brand through the platform.</p>
            
            <a href="https://relacollab.com/creator/schedule" class="button">View My Schedule</a>
          </div>
        </div>
      </body>
    </html>
  `,
});

const getNewMessageEmail = (data: {
  recipientName: string;
  senderName: string;
  campaignTitle: string;
  messagePreview: string;
}) => ({
  subject: `💬 New message from ${data.senderName}`,
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .message { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 New Message</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${data.recipientName}</strong>,</p>
            <p>You have a new message from <strong>${data.senderName}</strong> regarding <strong>${data.campaignTitle}</strong>.</p>
            
            <div class="message">
              "${data.messagePreview}"
            </div>
            
            <a href="https://relacollab.com/messages" class="button">Reply Now</a>
          </div>
        </div>
      </body>
    </html>
  `,
});

const getApplicationReceivedEmail = (data: {
  brandName: string;
  creatorName: string;
  campaignTitle: string;
  creatorEmail: string;
}) => ({
  subject: `🎉 New Application for ${data.campaignTitle}`,
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 New Creator Application!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${data.brandName}</strong>,</p>
            <p><strong>${data.creatorName}</strong> has applied to your campaign <strong>${data.campaignTitle}</strong>!</p>
            
            <p>Review their profile and approve them to start the collaboration.</p>
            
            <a href="https://relacollab.com/brand/matches" class="button">Review Application</a>
          </div>
        </div>
      </body>
    </html>
  `,
});

// Cloud Function: Send visit scheduled email
export const sendVisitScheduledEmail = functions.firestore
  .document("visitSchedules/{scheduleId}")
  .onCreate(async (snap, context) => {
    const visitData = snap.data();

    try {
      // Fetch creator info
      const creatorDoc = await admin.firestore().doc(`users/${visitData.creatorId}`).get();
      const creatorData = creatorDoc.data();

      // Fetch campaign info
      const campaignDoc = await admin.firestore().doc(`campaigns/${visitData.campaignId}`).get();
      const campaignData = campaignDoc.data();

      // Fetch brand info
      const brandDoc = await admin.firestore().doc(`users/${campaignData?.brandId}`).get();
      const brandData = brandDoc.data();

      if (!creatorData?.email) {
        console.log("Creator email not found");
        return;
      }

      const emailTemplate = getVisitScheduledEmail({
        creatorName: creatorData.displayName || "Creator",
        brandName: brandData?.displayName || "Brand",
        campaignTitle: campaignData?.name || "Campaign",
        visitDate: new Date(visitData.scheduledDate).toLocaleDateString(),
        visitTime: visitData.scheduledTime,
        location: `${visitData.location.address}, ${visitData.location.city}`,
        duration: visitData.duration,
        contentDeadline: new Date(visitData.contentDeadline).toLocaleDateString(),
      });

      await resend.emails.send({
        from: "RELA Collab <notifications@relacollab.com>",
        to: creatorData.email,
        ...emailTemplate,
      });

      console.log(`Visit scheduled email sent to ${creatorData.email}`);
    } catch (error) {
      console.error("Error sending visit scheduled email:", error);
    }
  });

// Cloud Function: Send new message notification
export const sendNewMessageEmail = functions.firestore
  .document("messages/{messageId}")
  .onCreate(async (snap, context) => {
    const messageData = snap.data();

    // Only send email for user messages, not system messages
    if (messageData.type !== "text") return;

    try {
      // Get collaboration to find recipient
      const collabDoc = await admin.firestore().doc(`applications/${messageData.collaborationId}`).get();
      const collabData = collabDoc.data();

      if (!collabData) return;

      // Determine recipient based on sender role
      const recipientId = messageData.senderRole === "brand"
        ? collabData.creatorId
        : collabData.brandId;

      const recipientDoc = await admin.firestore().doc(`users/${recipientId}`).get();
      const recipientData = recipientDoc.data();

      if (!recipientData?.email) return;

      // Get campaign info
      const campaignDoc = await admin.firestore().doc(`campaigns/${collabData.campaignId}`).get();
      const campaignData = campaignDoc.data();

      const emailTemplate = getNewMessageEmail({
        recipientName: recipientData.displayName || "User",
        senderName: messageData.senderName,
        campaignTitle: campaignData?.name || "Campaign",
        messagePreview: messageData.text.substring(0, 100),
      });

      await resend.emails.send({
        from: "RELA Collab <notifications@relacollab.com>",
        to: recipientData.email,
        ...emailTemplate,
      });

      console.log(`New message email sent to ${recipientData.email}`);
    } catch (error) {
      console.error("Error sending new message email:", error);
    }
  });

// Cloud Function: Send application received notification to brand
export const sendApplicationReceivedEmail = functions.firestore
  .document("applications/{applicationId}")
  .onCreate(async (snap, context) => {
    const appData = snap.data();

    try {
      // Fetch campaign
      const campaignDoc = await admin.firestore().doc(`campaigns/${appData.campaignId}`).get();
      const campaignData = campaignDoc.data();

      if (!campaignData) return;

      // Fetch brand
      const brandDoc = await admin.firestore().doc(`users/${campaignData.brandId}`).get();
      const brandData = brandDoc.data();

      // Fetch creator
      const creatorDoc = await admin.firestore().doc(`users/${appData.creatorId}`).get();
      const creatorData = creatorDoc.data();

      if (!brandData?.email) return;

      const emailTemplate = getApplicationReceivedEmail({
        brandName: brandData.displayName || "Brand",
        creatorName: creatorData?.displayName || "Creator",
        campaignTitle: campaignData.name,
        creatorEmail: creatorData?.email || "",
      });

      await resend.emails.send({
        from: "RELA Collab <notifications@relacollab.com>",
        to: brandData.email,
        ...emailTemplate,
      });

      console.log(`Application notification sent to ${brandData.email}`);
    } catch (error) {
      console.error("Error sending application notification:", error);
    }
  });
