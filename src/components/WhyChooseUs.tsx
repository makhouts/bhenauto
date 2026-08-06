import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle, Trophy, Wrench } from "lucide-react";
import premiumImg from "@/assets/premium.webp";
import mechanicImg from "@/assets/mechanic.webp";
import dealImg from "@/assets/deal.webp";
import type { WhyChooseUsDict } from "@/lib/dictionaries";

const FEATURE_IMAGES = [premiumImg, mechanicImg, dealImg] as const;
const FEATURE_ICONS = [CheckCircle, Wrench, Trophy] as const;

export default function WhyChooseUs({ lang, dict }: { lang: string; dict: WhyChooseUsDict }) {
  return (
    <section className="bg-[#111116] py-20 text-white sm:py-28 lg:py-32">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="grid min-w-0 grid-cols-1 gap-8 border-b border-white/15 pb-12 lg:grid-cols-12 lg:items-end">
          <div className="min-w-0 lg:col-span-7">
            <p className="brand-kicker mb-5">{dict.sectionLabel}</p>
            <h2 className="brand-section-title max-w-4xl text-white">{dict.sectionTitle}</h2>
          </div>
          <p className="min-w-0 max-w-xl text-sm leading-7 text-white/65 lg:col-span-5 lg:justify-self-end lg:text-base">
            {dict.sectionSubtitle}
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 lg:grid-cols-12">
          {dict.cards.map((card, index) => {
            const Icon = FEATURE_ICONS[index];
            const image = FEATURE_IMAGES[index];
            const columnClass = index === 0 ? "lg:col-span-5" : index === 1 ? "lg:col-span-4" : "lg:col-span-3";
            return (
              <article key={card.tag} className={`group min-w-0 border-b border-white/15 py-8 lg:border-b-0 lg:border-r lg:px-8 lg:py-12 first:lg:pl-0 last:lg:border-r-0 last:lg:pr-0 ${columnClass}`}>
                <div
                  className="relative w-full overflow-hidden bg-white/5"
                  style={{ aspectRatio: index === 0 ? "5 / 4" : index === 1 ? "4 / 5" : "4 / 3" }}
                >
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className={`${index === 2 ? "object-cover object-[58%_center]" : "object-cover"} grayscale-[25%] transition duration-500 group-hover:grayscale-0 group-hover:scale-[1.02]`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <div className="absolute left-0 top-0 flex size-12 items-center justify-center bg-[#d91c1c] text-white">
                    <Icon size={19} strokeWidth={1.7} />
                  </div>
                  <span className="absolute bottom-4 left-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/80">0{index + 1} — {card.tag}</span>
                </div>

                <div className="pt-6">
                  {index === 2 && <p className="mb-2 font-headings text-5xl font-bold leading-none text-[#d91c1c]">15+</p>}
                  <h3 className="font-headings text-3xl font-semibold uppercase leading-none tracking-tight text-white sm:text-4xl" style={{ whiteSpace: "pre-line" }}>
                    {card.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-white/60">{card.body}</p>
                  <Link href={`/${lang}${card.href}`} className="mt-6 inline-flex min-h-11 items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white hover:text-[#d91c1c]">
                    {card.cta} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
