 import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
 import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
 import { ContentSubmission } from "@/components/creator/ContentSubmission";
 
 export default function MyContent() {
   return (
     <div className="flex min-h-screen bg-background">
       <DashboardSidebar type="creator" />
 
       <main className="flex-1 ml-64 p-8">
         <DashboardHeader
           title="My Content"
           subtitle="Submit and track your campaign content"
         />
 
         <ContentSubmission />
       </main>
     </div>
   );
 }