/**
 * Bilingual UI strings (PRD §5.10 — English / Hindi, instant switch, no reload).
 *
 * NOTE: Final translated copy is a separate copywriting deliverable (PRD scope
 * note, §5.10). The strings below are PROVISIONAL structural labels so the
 * toggle mechanism is real and testable; replace with approved copy at launch.
 * Any key missing from `hi` falls back to `en`, so the UI never shows a blank.
 */

export type Lang = "en" | "hi";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
];

type Dict = Record<string, string>;

const en: Dict = {
  "app.name": "Digital Kabootar",
  "app.tagline": "Letters of gratitude to the martyrs of Kargil",

  "nav.home": "Home",
  "nav.write": "Write a letter",
  "nav.directory": "Martyr Directory",
  "nav.gallery": "Gallery",
  "nav.admin": "Admin",

  "home.counterLabel": "letters dispatched",
  "home.writeCta": "Write a letter",
  "home.recent": "Recent letters",
  "home.browse": "Browse the Martyr Directory",
  "home.featuredTitle": "Messages to our heroes",
  "featured.eyebrow": "To our heroes",

  "write.title": "Write a letter",
  "write.chooseMartyr": "Choose a martyr to write to",
  "write.searchMartyr": "Search by name, state, or regiment",
  "write.selected": "Writing to",
  "write.change": "Change",
  "write.message": "Your message",
  "write.messagePlaceholder": "Write your words of gratitude…",
  "write.writerName": "Your name",
  "write.organization": "Organisation",
  "write.age": "Age",
  "write.email": "Email",
  "write.writerState": "Your state",
  "write.optional": "optional",
  "write.submit": "Send letter",
  "write.sending": "Sending…",
  "write.successApproved": "Your letter has been sent and is now in the gallery.",
  "write.successPending":
    "Thank you. Your letter has been received and will appear once a moderator approves it.",
  "write.charsLeft": "characters left",

  "directory.title": "Martyr Directory",
  "directory.filterState": "Filter by state",
  "directory.allStates": "All states",
  "directory.search": "Search martyrs",
  "directory.noResults": "No martyrs found.",
  "directory.viewProfile": "View profile",
  "directory.writeToThem": "Write to them",

  "martyr.about": "About",
  "martyr.lettersTab": "Letters",
  "martyr.noLetters": "No letters yet. Be the first to write.",
  "martyr.rank": "Rank",
  "martyr.regiment": "Regiment",
  "martyr.state": "Native state",
  "martyr.age": "Age",
  "martyr.date": "Date of martyrdom",
  "martyr.award": "Gallantry award",
  "martyr.placeholderWarning":
    "Unverified placeholder record — not a real person. Replace with verified data before launch.",

  "gallery.title": "Gallery",
  "gallery.loadMore": "Load more",
  "gallery.noLetters": "No approved letters yet.",
  "gallery.search": "Search by writer or martyr name",
  "gallery.filterMartyr": "Filter by martyr",
  "gallery.allMartyrs": "All martyrs",

  "admin.title": "Moderation dashboard",
  "admin.login": "Admin login",
  "admin.password": "Password",
  "admin.signIn": "Sign in",
  "admin.signOut": "Sign out",
  "admin.queue": "Queue",
  "admin.approve": "Approve",
  "admin.reject": "Reject",
  "admin.bulkApprove": "Approve selected",
  "admin.bulkReject": "Reject selected",
  "admin.exportCsv": "Export CSV",
  "admin.selectAll": "Select all",
  "admin.status": "Status",
  "admin.allStatuses": "All statuses",
  "admin.flaggedFor": "Flagged for",
  "admin.stats": "Statistics",
  "admin.approvalRate": "Approval rate",
  "admin.submissions": "Submissions",

  "common.loading": "Loading…",
  "common.error": "Something went wrong. Please try again.",
  "common.pending": "Pending",
  "common.approved": "Approved",
  "common.rejected": "Rejected",
  "common.by": "by",
};

// Provisional Hindi. Final copy supplied separately (PRD §5.10).
const hi: Dict = {
  "app.name": "डिजिटल कबूतर",
  "app.tagline": "करगिल के शहीदों को कृतज्ञता के पत्र",

  "nav.home": "मुख्य पृष्ठ",
  "nav.write": "पत्र लिखें",
  "nav.directory": "शहीद निर्देशिका",
  "nav.gallery": "गैलरी",
  "nav.admin": "प्रशासन",

  "home.counterLabel": "पत्र भेजे गए",
  "home.writeCta": "पत्र लिखें",
  "home.recent": "हाल के पत्र",
  "home.browse": "शहीद निर्देशिका देखें",
  "home.featuredTitle": "हमारे वीरों के नाम संदेश",
  "featured.eyebrow": "हमारे वीरों के नाम",

  "write.title": "पत्र लिखें",
  "write.chooseMartyr": "पत्र लिखने के लिए एक शहीद चुनें",
  "write.searchMartyr": "नाम, राज्य या रेजिमेंट से खोजें",
  "write.selected": "किसे लिख रहे हैं",
  "write.change": "बदलें",
  "write.message": "आपका संदेश",
  "write.messagePlaceholder": "अपनी कृतज्ञता के शब्द लिखें…",
  "write.writerName": "आपका नाम",
  "write.organization": "संस्था",
  "write.age": "आयु",
  "write.email": "ईमेल",
  "write.writerState": "आपका राज्य",
  "write.optional": "वैकल्पिक",
  "write.submit": "पत्र भेजें",
  "write.sending": "भेजा जा रहा है…",
  "write.successApproved": "आपका पत्र भेज दिया गया है और अब गैलरी में है।",
  "write.successPending":
    "धन्यवाद। आपका पत्र प्राप्त हो गया है और अनुमोदन के बाद दिखाई देगा।",
  "write.charsLeft": "अक्षर शेष",

  "directory.title": "शहीद निर्देशिका",
  "directory.filterState": "राज्य से छाँटें",
  "directory.allStates": "सभी राज्य",
  "directory.search": "शहीद खोजें",
  "directory.noResults": "कोई शहीद नहीं मिला।",
  "directory.viewProfile": "प्रोफ़ाइल देखें",
  "directory.writeToThem": "उन्हें पत्र लिखें",

  "martyr.about": "परिचय",
  "martyr.lettersTab": "पत्र",
  "martyr.noLetters": "अभी कोई पत्र नहीं। पहला पत्र आप लिखें।",
  "martyr.rank": "पद",
  "martyr.regiment": "रेजिमेंट",
  "martyr.state": "गृह राज्य",
  "martyr.age": "आयु",
  "martyr.date": "शहादत की तिथि",
  "martyr.award": "वीरता पुरस्कार",
  "martyr.placeholderWarning":
    "असत्यापित प्लेसहोल्डर रिकॉर्ड — वास्तविक व्यक्ति नहीं। लॉन्च से पहले सत्यापित डेटा से बदलें।",

  "gallery.title": "गैलरी",
  "gallery.loadMore": "और देखें",
  "gallery.noLetters": "अभी तक कोई अनुमोदित पत्र नहीं।",
  "gallery.search": "लेखक या शहीद के नाम से खोजें",
  "gallery.filterMartyr": "शहीद से छाँटें",
  "gallery.allMartyrs": "सभी शहीद",

  "admin.title": "मॉडरेशन डैशबोर्ड",
  "admin.login": "प्रशासन लॉगिन",
  "admin.password": "पासवर्ड",
  "admin.signIn": "साइन इन",
  "admin.signOut": "साइन आउट",
  "admin.queue": "कतार",
  "admin.approve": "स्वीकृत करें",
  "admin.reject": "अस्वीकार करें",
  "admin.bulkApprove": "चयनित स्वीकृत करें",
  "admin.bulkReject": "चयनित अस्वीकार करें",
  "admin.exportCsv": "CSV निर्यात",
  "admin.selectAll": "सभी चुनें",
  "admin.status": "स्थिति",
  "admin.allStatuses": "सभी स्थितियाँ",
  "admin.flaggedFor": "किसलिए चिह्नित",
  "admin.stats": "आँकड़े",
  "admin.approvalRate": "स्वीकृति दर",
  "admin.submissions": "प्रस्तुतियाँ",

  "common.loading": "लोड हो रहा है…",
  "common.error": "कुछ गड़बड़ हुई। कृपया पुनः प्रयास करें।",
  "common.pending": "लंबित",
  "common.approved": "स्वीकृत",
  "common.rejected": "अस्वीकृत",
  "common.by": "द्वारा",
};

const DICTS: Record<Lang, Dict> = { en, hi };

/** Translate a key, falling back to English, then to the key itself. */
export function translate(lang: Lang, key: string): string {
  return DICTS[lang]?.[key] ?? en[key] ?? key;
}
