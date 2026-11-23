import { CLAUSES, TEXT, type Lang } from "@/lib/terms";

export function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-neutral-300 p-1" role="group" aria-label="Language">
      {(["en", "ar"] as const).map((l) => (
        <button key={l} type="button" onClick={() => onChange(l)}
          className={`min-h-10 rounded-md px-4 text-sm font-semibold ${lang === l ? "bg-neutral-900 text-white" : ""}`}>
          {l === "en" ? "English" : "العربية"}
        </button>
      ))}
    </div>
  );
}

export default function TermsView({ lang }: { lang: Lang }) {
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}
      className="max-h-[50vh] space-y-3 overflow-y-auto rounded-xl border border-neutral-300 bg-neutral-50 p-4 text-sm leading-relaxed">
      <p className="font-semibold">{TEXT.termsImportant[lang]}</p>
      <h3 className="text-base font-bold">{TEXT.termsTitle[lang]}</h3>
      <p>{TEXT.termsIntro[lang]}</p>
      {CLAUSES.map((c, i) => (
        <section key={i}>
          <h4 className="font-semibold text-red-700">{i + 1}. {c[lang][0]}</h4>
          <p>{c[lang][1]}</p>
        </section>
      ))}
      <p className="font-semibold">{TEXT.termsFooter[lang]}</p>
    </div>
  );
}
