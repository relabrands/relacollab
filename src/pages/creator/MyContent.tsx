import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { ContentSubmission } from "@/components/creator/ContentSubmission";

export default function MyContent() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="creator" />
      <MobileNav type="creator" />

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
        <DashboardHeader
          title="Mi Contenido"
          subtitle="Envía y rastrea el contenido de tus campañas"
        />

        <ContentSubmission />
      </main>
    </div>
  );
}