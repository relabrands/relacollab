import { Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Instagram,
  ShieldCheck,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Asegúrate de tener una cuenta de Creator o Empresa en Instagram",
    description:
      "La API de Meta solo permite obtener métricas de cuentas profesionales. Si tu cuenta es personal, deberás cambiarla antes de conectar.",
    tips: [
      "Ve a tu perfil de Instagram → Configuración → Cuenta.",
      'Selecciona "Cambiar a cuenta profesional".',
      "Escoge la categoría que mejor describe tu contenido.",
      "Selecciona Creator o Empresa según corresponda.",
    ],
    note: "Una cuenta personal no podrá conectarse. Este cambio es gratuito y puedes revertirlo cuando quieras.",
    noteType: "warning" as const,
  },
  {
    number: "02",
    title: "Vincula tu cuenta de Instagram a una Página de Facebook",
    description:
      "La API de Meta requiere que tu Instagram esté vinculado a una Página de Facebook. Si no tienes una, puedes crearla gratis.",
    tips: [
      'En Instagram, ve a Configuración → Cuenta → "Cuenta vinculada a Facebook".',
      "Inicia sesión en tu Facebook cuando se te solicite.",
      "Selecciona la Página de Facebook que deseas vincular (o crea una nueva).",
      "Confirma la vinculación.",
    ],
    note: "Sin este paso, la conexión con RELA Collab no funcionará. La Página de Facebook puede estar completamente vacía, solo necesitas tenerla.",
    noteType: "info" as const,
  },
  {
    number: "03",
    title: 'Presiona "Conectar Instagram" en RELA Collab',
    description:
      'En tu perfil de creador en RELA Collab, ve a la sección "Conexiones Sociales" y presiona el botón Conectar Instagram.',
    tips: [
      "Se abrirá primero una ventana explicando el proceso.",
      'Presiona "Empezar" para continuar.',
      "Serás redirigido al flujo de autenticación de Facebook/Meta.",
    ],
    note: "RELA Collab nunca verá ni almacenará tu contraseña. Todo el proceso es manejado directamente por Meta.",
    noteType: "success" as const,
  },
  {
    number: "04",
    title: "Inicia sesión en Facebook y selecciona tu cuenta",
    description:
      "Se abrirá la pantalla de autenticación oficial de Meta. Aquí deberás iniciar sesión con el Facebook que tiene tu Página vinculada al Instagram.",
    tips: [
      "Escribe tu correo y contraseña de Facebook.",
      "Si ya estás logueado en el navegador, se saltará este paso automáticamente.",
      "Selecciona la Página de Facebook que está vinculada a tu Instagram.",
    ],
  },
  {
    number: "05",
    title: "Autoriza los permisos solicitados",
    description:
      "Meta te mostrará una lista de permisos que RELA Collab solicita para poder leer tus métricas. Todos son de solo lectura.",
    tips: [
      "instagram_basic — ver tu perfil y publicaciones.",
      "instagram_manage_insights — ver tus métricas de audiencia y alcance.",
      "pages_show_list — ver las páginas de Facebook asociadas.",
      "pages_read_engagement — leer estadísticas de la página.",
    ],
    note: "Nunca solicitamos permisos para publicar, enviar mensajes ni modificar tu cuenta. Solo leemos métricas.",
    noteType: "success" as const,
  },
  {
    number: "06",
    title: "¡Listo! Tu cuenta está conectada",
    description:
      "Serás redirigido de vuelta a RELA Collab y tu cuenta de Instagram aparecerá como conectada. Tus métricas comenzarán a sincronizarse.",
    tips: [
      "Verás tu usuario de Instagram y el estado \"Connected\" en tu perfil.",
      "Las marcas podrán ver tus métricas al revisar tu perfil.",
      "La conexión dura aproximadamente 60 días y te notificaremos si expira.",
    ],
    note: "Si algo sale mal, asegúrate de haber completado los pasos 1 y 2 correctamente y vuelve a intentarlo.",
    noteType: "info" as const,
  },
];

const faqs = [
  {
    q: "¿Por qué necesito conectar Facebook si tengo Instagram?",
    a: "La API oficial de Meta (la empresa dueña de Instagram) requiere que las cuentas de Instagram profesionales estén vinculadas a una Página de Facebook para poder acceder a métricas avanzadas. Esto es un requisito técnico de Meta, no de RELA Collab.",
  },
  {
    q: "¿RELA Collab puede publicar en mi cuenta?",
    a: "No. Solo solicitamos permisos de lectura de métricas. No tenemos ni pedimos permisos para publicar, comentar, enviar mensajes ni modificar tu cuenta en ninguna forma.",
  },
  {
    q: "¿Qué pasa si mi cuenta de Instagram es personal?",
    a: "Las cuentas personales no tienen acceso a la API de Meta, por lo que no podrán conectarse. Deberás cambiarla a una cuenta de Creator o Empresa (es gratuito) antes de conectar.",
  },
  {
    q: "¿Cuánto dura la conexión?",
    a: "El token de acceso de Meta dura aproximadamente 60 días. Antes de que expire, te enviaremos un correo recordándote que debes reconectar tu cuenta para mantener tus métricas actualizadas.",
  },
  {
    q: "¿Puedo desconectar mi cuenta en cualquier momento?",
    a: "Sí. En tu perfil de RELA Collab, dentro de la sección Conexiones Sociales, puedes presionar el botón Desconectar en cualquier momento. También puedes revocar los permisos directamente desde la configuración de tu Facebook.",
  },
];

export default function HowToConnectInstagram() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-16 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
          <ChevronRight className="w-4 h-4" />
          <span>Centro de Ayuda</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Conectar Instagram</span>
        </div>

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#E1306C]/10 text-[#E1306C] px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Instagram className="w-4 h-4" />
            Guía de Conexión
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Cómo conectar tu cuenta de Instagram
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Sigue estos pasos para vincular tu Instagram a RELA Collab de forma segura y acceder a todas las oportunidades de colaboración con marcas.
          </p>
        </div>

        {/* Security Trust Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 p-4 bg-muted/30 rounded-2xl border border-border/50">
          <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm text-muted-foreground text-center">
            <strong className="text-foreground">Conexión 100% segura.</strong> Usamos exclusivamente la API oficial de Meta. Nunca almacenamos tu contraseña ni tenemos acceso para publicar en tu cuenta.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/3840px-Meta_Platforms_Inc._logo.svg.png"
              alt="Meta"
              className="h-4 w-auto object-contain opacity-60"
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-6">
              {/* Step number + connector */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E1306C] to-[#bc1888] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border mt-3" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <h2 className="text-xl font-bold mb-2">{step.title}</h2>
                <p className="text-muted-foreground mb-4">{step.description}</p>

                <ul className="space-y-2 mb-4">
                  {step.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>

                {step.note && (
                  <div
                    className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                      step.noteType === "warning"
                        ? "bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
                        : step.noteType === "success"
                        ? "bg-green-50 border border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300"
                        : "bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300"
                    }`}
                  >
                    {step.noteType === "warning" ? (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{step.note}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold">Preguntas Frecuentes</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-5 rounded-xl border border-border bg-muted/20">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-[#E1306C]/5 to-[#bc1888]/5 border border-[#E1306C]/20">
          <Instagram className="w-8 h-8 text-[#E1306C] mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">¿Listo para conectar tu cuenta?</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Ve a tu perfil de creador y presiona "Conectar Instagram".
          </p>
          <Link
            to="/creator/profile"
            className="inline-flex items-center gap-2 bg-[#E1306C] hover:bg-[#C13584] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Ir a mi perfil
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
