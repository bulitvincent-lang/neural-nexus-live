import { createContext, useContext, useEffect, useMemo } from "react";

/** Four markets only: English (default), French, Spanish, German. */
export const LANGS = [
  { id: "en", label: "English", short: "EN" },
  { id: "fr", label: "Français", short: "FR" },
  { id: "es", label: "Español", short: "ES" },
  { id: "de", label: "Deutsch", short: "DE" },
] as const;

export type Lang = (typeof LANGS)[number]["id"];

type Dict = Record<string, string>;

const en: Dict = {
  "nav.preview": "Preview the orb",
  "nav.connect": "Connect my AI",

  "hero.eyebrow": "Neural Orb",
  "hero.title1": "See your AI",
  "hero.title2": "live and work.",
  "hero.sub":
    "A silent sphere on your desktop. It breathes when your AI thinks, glows when it searches, gathers when it answers. No words, no dashboard.",
  "hero.download": "Download for {platform}",
  "hero.try": "Try the orb now",
  "hero.tryNote": "in your browser",
  "hero.soon":
    "The app for macOS, Windows and Linux is coming very soon. In the meantime the live preview above runs right here.",
  "hero.firstRun":
    "First launch: Windows shows \"Windows protected your PC\" — click More info, then Run anyway. On macOS, right-click the app and choose Open. This happens because the app is new, not yet certified by Microsoft or Apple.",
  "hero.howto": "How to connect your AI in three steps",

  "f1.title": "No interface",
  "f1.body":
    "No text, no menu, no chart. Just a living sphere floating above your work.",
  "f2.title": "The real rhythm of your AI",
  "f2.body":
    "When it thinks, searches or answers, the sphere reacts accordingly — and never invents.",
  "f3.title": "One-click setup",
  "f3.body": "You simply pick your AI on first launch. Everything else happens on its own.",
  "f4.title": "Privacy first",
  "f4.body":
    "Your messages, answers and files never leave your computer. Only the rhythm of activity is used.",

  "connect.title": "Connect your AI",
  "connect.intro":
    "You keep using ChatGPT, Claude, Gemini or Copilot exactly as before. The sphere simply comes alive alongside you.",
  "connect.download": "Download the companion",
  "connect.pending": "The companion will be downloadable here as soon as the app ships",
  "connect.s1.t": "Download the companion",
  "connect.s1.b": "A single file. Unzip it, it creates a Neural Orb Connector folder.",
  "connect.s2.t": "Open your browser's add-ons page",
  "connect.s2.b": "Browser menu, then Extensions. Turn on developer mode at the top of the page.",
  "connect.s3.t": "Pick the folder",
  "connect.s3.b": "Click \u201cLoad unpacked\u201d and select the folder you downloaded. Done.",
  "connect.privacy.t": "Your conversations stay yours",
  "connect.privacy.b":
    "The companion never reads your messages, the answers, your files or your conversations. It only watches the rhythm of activity — starting, running, finished — and passes it to the app on your computer. Nothing goes online.",

  "onb.q": "Which AI do you use?",
  "onb.qsub": "Pick one. You can add others later.",
  "onb.detected": "AI activity is already detected.",
  "onb.connected": "{ai} is connected",
  "onb.connecting": "Connecting {ai}",
  "onb.keepUsing": "Keep using {ai} as usual — the sphere follows.",
  "onb.lastStep": "One last step, only once: add the browser companion.",
  "onb.addCompanion": "Add the browser companion",
  "onb.help": "Need help? Everything is explained in three pictures at",
  "onb.launch": "Launch {ai} as usual — the connection happens by itself.",
  "onb.change": "Change AI",
  "onb.see": "See my sphere",
  "onb.finish": "Finish",

  "set.myAis": "My AIs",
  "set.connected": "Connected",
  "set.idle": "Idle",
  "set.connect": "Connect",
  "set.addCompanion": "Add the browser companion",
  "set.appearance": "Appearance",
  "set.size": "Size",
  "set.intensity": "Intensity",
  "set.transparency": "Transparency",
  "set.app": "Application",
  "set.startup": "Start with my computer",
  "set.always": "Always visible",
  "set.power": "Power saving mode",
  "set.close": "Close",
  "set.language": "Language",
};

const fr: Dict = {
  "nav.preview": "Aperçu de la sphère",
  "nav.connect": "Connecter mon IA",

  "hero.eyebrow": "Neural Orb",
  "hero.title1": "Voyez votre IA",
  "hero.title2": "vivre et travailler.",
  "hero.sub":
    "Une sphère silencieuse sur votre bureau. Elle respire quand votre IA réfléchit, s'illumine quand elle cherche, se rassemble quand elle répond. Aucun mot, aucun tableau de bord.",
  "hero.download": "Télécharger pour {platform}",
  "hero.try": "Essayer la sphère maintenant",
  "hero.tryNote": "dans le navigateur",
  "hero.soon":
    "L'application pour macOS, Windows et Linux arrive très bientôt. En attendant, l'aperçu ci-dessus fonctionne directement ici.",
  "hero.howto": "Comment connecter votre IA en trois étapes",

  "f1.title": "Aucune interface",
  "f1.body":
    "Pas de texte, pas de menu, pas de graphique. Seulement une sphère vivante posée au-dessus de votre travail.",
  "f2.title": "Le rythme réel de votre IA",
  "f2.body":
    "Quand elle réfléchit, cherche ou répond, la sphère s'anime en conséquence — sans jamais inventer.",
  "f3.title": "Installation en un clic",
  "f3.body":
    "Vous choisissez simplement votre IA au premier lancement. Tout le reste se fait tout seul.",
  "f4.title": "Respect de votre vie privée",
  "f4.body":
    "Vos messages, réponses et fichiers ne quittent jamais votre ordinateur. Seul le rythme d'activité est utilisé.",

  "connect.title": "Connecter votre IA",
  "connect.intro":
    "Vous continuez à utiliser ChatGPT, Claude, Gemini ou Copilot exactement comme d'habitude. La sphère se met simplement à vivre en même temps que vous.",
  "connect.download": "Télécharger le connecteur",
  "connect.pending":
    "Le connecteur sera téléchargeable ici dès la sortie de l'application",
  "connect.s1.t": "Téléchargez le connecteur",
  "connect.s1.b": "Un seul fichier. Décompressez-le, il crée un dossier Neural Orb Connector.",
  "connect.s2.t": "Ouvrez la page des modules de votre navigateur",
  "connect.s2.b":
    "Menu du navigateur, puis Extensions. Activez le mode développeur en haut de la page.",
  "connect.s3.t": "Choisissez le dossier",
  "connect.s3.b":
    "Cliquez sur « Charger le dossier décompressé » et sélectionnez le dossier téléchargé. Terminé.",
  "connect.privacy.t": "Vos conversations restent les vôtres",
  "connect.privacy.b":
    "Le connecteur ne lit jamais vos messages, les réponses, vos fichiers ni vos conversations. Il observe uniquement le rythme de l'activité — début, en cours, terminé — et le transmet à l'application installée sur votre ordinateur. Rien ne part sur Internet.",

  "onb.q": "Quelle IA utilisez-vous ?",
  "onb.qsub": "Choisissez-en une. Vous pourrez en ajouter d'autres plus tard.",
  "onb.detected": "Une activité IA est déjà détectée.",
  "onb.connected": "{ai} est connecté",
  "onb.connecting": "Connexion de {ai}",
  "onb.keepUsing": "Continuez à utiliser {ai} normalement : la sphère suit.",
  "onb.lastStep": "Une dernière étape, une seule fois : ajoutez le connecteur navigateur.",
  "onb.addCompanion": "Ajouter le connecteur navigateur",
  "onb.help": "Besoin d'aide ? Tout est expliqué en trois images sur",
  "onb.launch": "Lancez {ai} comme d'habitude : la connexion se fait toute seule.",
  "onb.change": "Changer d'IA",
  "onb.see": "Voir ma sphère",
  "onb.finish": "Terminer",

  "set.myAis": "Mes IA",
  "set.connected": "Connecté",
  "set.idle": "En veille",
  "set.connect": "Connecter",
  "set.addCompanion": "Ajouter le connecteur navigateur",
  "set.appearance": "Apparence",
  "set.size": "Taille",
  "set.intensity": "Intensité",
  "set.transparency": "Transparence",
  "set.app": "Application",
  "set.startup": "Démarrer avec l'ordinateur",
  "set.always": "Toujours visible",
  "set.power": "Mode économie d'énergie",
  "set.close": "Fermer",
  "set.language": "Langue",
};

const es: Dict = {
  "nav.preview": "Ver la esfera",
  "nav.connect": "Conectar mi IA",

  "hero.eyebrow": "Neural Orb",
  "hero.title1": "Mira tu IA",
  "hero.title2": "vivir y trabajar.",
  "hero.sub":
    "Una esfera silenciosa en tu escritorio. Respira cuando tu IA piensa, brilla cuando busca y se recoge cuando responde. Sin palabras, sin paneles.",
  "hero.download": "Descargar para {platform}",
  "hero.try": "Probar la esfera ahora",
  "hero.tryNote": "en el navegador",
  "hero.soon":
    "La aplicación para macOS, Windows y Linux llega muy pronto. Mientras tanto, la vista previa de arriba funciona aquí mismo.",
  "hero.howto": "Cómo conectar tu IA en tres pasos",

  "f1.title": "Sin interfaz",
  "f1.body": "Sin texto, sin menús, sin gráficos. Solo una esfera viva sobre tu trabajo.",
  "f2.title": "El ritmo real de tu IA",
  "f2.body":
    "Cuando piensa, busca o responde, la esfera reacciona en consecuencia, sin inventar nada.",
  "f3.title": "Instalación en un clic",
  "f3.body": "Solo eliges tu IA al primer inicio. El resto se hace solo.",
  "f4.title": "Privacidad primero",
  "f4.body":
    "Tus mensajes, respuestas y archivos nunca salen de tu ordenador. Solo se usa el ritmo de actividad.",

  "connect.title": "Conecta tu IA",
  "connect.intro":
    "Sigues usando ChatGPT, Claude, Gemini o Copilot exactamente igual. La esfera simplemente cobra vida contigo.",
  "connect.download": "Descargar el complemento",
  "connect.pending":
    "El complemento se podrá descargar aquí en cuanto se publique la aplicación",
  "connect.s1.t": "Descarga el complemento",
  "connect.s1.b": "Un solo archivo. Descomprímelo y creará una carpeta Neural Orb Connector.",
  "connect.s2.t": "Abre la página de extensiones de tu navegador",
  "connect.s2.b":
    "Menú del navegador y luego Extensiones. Activa el modo de desarrollador arriba.",
  "connect.s3.t": "Elige la carpeta",
  "connect.s3.b":
    "Pulsa «Cargar descomprimida» y selecciona la carpeta descargada. Listo.",
  "connect.privacy.t": "Tus conversaciones siguen siendo tuyas",
  "connect.privacy.b":
    "El complemento nunca lee tus mensajes, las respuestas, tus archivos ni tus conversaciones. Solo observa el ritmo de la actividad — empieza, en curso, terminado — y lo envía a la aplicación de tu ordenador. Nada sale a Internet.",

  "onb.q": "¿Qué IA usas?",
  "onb.qsub": "Elige una. Podrás añadir más después.",
  "onb.detected": "Ya se detecta actividad de IA.",
  "onb.connected": "{ai} está conectado",
  "onb.connecting": "Conectando {ai}",
  "onb.keepUsing": "Sigue usando {ai} como siempre: la esfera te acompaña.",
  "onb.lastStep": "Un último paso, solo una vez: añade el complemento del navegador.",
  "onb.addCompanion": "Añadir el complemento del navegador",
  "onb.help": "¿Necesitas ayuda? Todo está explicado en tres imágenes en",
  "onb.launch": "Abre {ai} como siempre: la conexión se hace sola.",
  "onb.change": "Cambiar de IA",
  "onb.see": "Ver mi esfera",
  "onb.finish": "Terminar",

  "set.myAis": "Mis IA",
  "set.connected": "Conectado",
  "set.idle": "En espera",
  "set.connect": "Conectar",
  "set.addCompanion": "Añadir el complemento del navegador",
  "set.appearance": "Apariencia",
  "set.size": "Tamaño",
  "set.intensity": "Intensidad",
  "set.transparency": "Transparencia",
  "set.app": "Aplicación",
  "set.startup": "Iniciar con el ordenador",
  "set.always": "Siempre visible",
  "set.power": "Modo de ahorro de energía",
  "set.close": "Cerrar",
  "set.language": "Idioma",
};

const de: Dict = {
  "nav.preview": "Sphäre ansehen",
  "nav.connect": "Meine KI verbinden",

  "hero.eyebrow": "Neural Orb",
  "hero.title1": "Sieh deine KI",
  "hero.title2": "leben und arbeiten.",
  "hero.sub":
    "Eine stille Sphäre auf deinem Desktop. Sie atmet, wenn deine KI denkt, leuchtet, wenn sie sucht, und sammelt sich, wenn sie antwortet. Keine Worte, kein Dashboard.",
  "hero.download": "Für {platform} herunterladen",
  "hero.try": "Sphäre jetzt ausprobieren",
  "hero.tryNote": "im Browser",
  "hero.soon":
    "Die App für macOS, Windows und Linux kommt sehr bald. Bis dahin läuft die Vorschau oben direkt hier.",
  "hero.howto": "So verbindest du deine KI in drei Schritten",

  "f1.title": "Keine Oberfläche",
  "f1.body": "Kein Text, kein Menü, kein Diagramm. Nur eine lebendige Sphäre über deiner Arbeit.",
  "f2.title": "Der echte Rhythmus deiner KI",
  "f2.body":
    "Wenn sie denkt, sucht oder antwortet, reagiert die Sphäre entsprechend — und erfindet nie etwas.",
  "f3.title": "Einrichtung mit einem Klick",
  "f3.body": "Du wählst beim ersten Start einfach deine KI. Alles andere passiert von selbst.",
  "f4.title": "Privatsphäre zuerst",
  "f4.body":
    "Deine Nachrichten, Antworten und Dateien verlassen deinen Computer nie. Nur der Aktivitätsrhythmus wird genutzt.",

  "connect.title": "Deine KI verbinden",
  "connect.intro":
    "Du nutzt ChatGPT, Claude, Gemini oder Copilot genau wie bisher. Die Sphäre wird einfach mit dir lebendig.",
  "connect.download": "Begleiter herunterladen",
  "connect.pending":
    "Der Begleiter steht hier zum Download bereit, sobald die App erscheint",
  "connect.s1.t": "Lade den Begleiter herunter",
  "connect.s1.b": "Eine einzige Datei. Entpacke sie, es entsteht ein Ordner Neural Orb Connector.",
  "connect.s2.t": "Öffne die Erweiterungsseite deines Browsers",
  "connect.s2.b":
    "Browsermenü, dann Erweiterungen. Aktiviere oben den Entwicklermodus.",
  "connect.s3.t": "Wähle den Ordner",
  "connect.s3.b":
    "Klicke auf „Entpackt laden“ und wähle den heruntergeladenen Ordner. Fertig.",
  "connect.privacy.t": "Deine Gespräche bleiben deine",
  "connect.privacy.b":
    "Der Begleiter liest nie deine Nachrichten, Antworten, Dateien oder Gespräche. Er beobachtet nur den Rhythmus der Aktivität — Start, läuft, fertig — und gibt ihn an die App auf deinem Computer weiter. Nichts geht ins Internet.",

  "onb.q": "Welche KI nutzt du?",
  "onb.qsub": "Wähle eine. Weitere kannst du später hinzufügen.",
  "onb.detected": "KI-Aktivität wird bereits erkannt.",
  "onb.connected": "{ai} ist verbunden",
  "onb.connecting": "{ai} wird verbunden",
  "onb.keepUsing": "Nutze {ai} wie gewohnt — die Sphäre folgt.",
  "onb.lastStep": "Ein letzter Schritt, nur einmal: füge den Browser-Begleiter hinzu.",
  "onb.addCompanion": "Browser-Begleiter hinzufügen",
  "onb.help": "Hilfe nötig? Alles wird in drei Bildern erklärt auf",
  "onb.launch": "Starte {ai} wie gewohnt — die Verbindung entsteht von selbst.",
  "onb.change": "KI wechseln",
  "onb.see": "Meine Sphäre ansehen",
  "onb.finish": "Fertig",

  "set.myAis": "Meine KIs",
  "set.connected": "Verbunden",
  "set.idle": "Bereit",
  "set.connect": "Verbinden",
  "set.addCompanion": "Browser-Begleiter hinzufügen",
  "set.appearance": "Aussehen",
  "set.size": "Größe",
  "set.intensity": "Intensität",
  "set.transparency": "Transparenz",
  "set.app": "Anwendung",
  "set.startup": "Mit dem Computer starten",
  "set.always": "Immer sichtbar",
  "set.power": "Energiesparmodus",
  "set.close": "Schließen",
  "set.language": "Sprache",
};

const DICTS: Record<Lang, Dict> = { en, fr, es, de };
const KEY = "neural-orb.lang.v1";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: string, v?: Record<string, string>) => string };

const I18nContext = createContext<Ctx | null>(null);

function translate(lang: Lang, key: string, vars?: Record<string, string>) {
  const raw = DICTS[lang][key] ?? en[key] ?? key;
  return vars
    ? raw.replace(/\{(\w+)\}/g, (_, n: string) => vars[n] ?? `{${n}}`)
    : raw;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // English only.
  const lang: Lang = "en";

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = "en";
  }, []);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang: () => {}, t: (k, v) => translate("en", k, v) }),
    [],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  return { lang: "en", setLang: () => {}, t: (k, v) => translate("en", k, v) };
}

