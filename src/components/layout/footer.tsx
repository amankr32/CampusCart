import Link from "next/link";
// import { Linkedin, Youtube, Mail } from "lucide-react";

// const socialLinks = [
//   { href: "https://linkedin.com", label: "LinkedIn", icon: Linkedin },
//   { href: "https://youtube.com", label: "YouTube", icon: Youtube },
//   { href: "mailto:hello@ptubazar.com", label: "Email", icon: Mail },
// ];

const columns = [
  {
    title: "Marketplace",
    links: [
      { href: "/browse", label: "Browse listings" },
      { href: "/sell", label: "Start selling" },
      { href: "/how-it-works", label: "How it works" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/safety", label: "Safety on campus" },
      { href: "/contact", label: "Contact us" },
      { href: "/faq", label: "FAQs" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "Our story" },
      { href: "/guidelines", label: "Community guidelines" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-white mt-auto">
      <div className="max-w-(--breakpoint-xl) mx-auto px-4 lg:px-12 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-[var(--brand-orange)] text-white font-display font-bold text-xs">
                PB
              </span>
              <div className="flex flex-col leading-none">
                <span className="font-display font-bold text-base">
                  Campus Cart
                </span>
                <span className="text-[10px] text-black/40">
                  Only for IKGPTU Students
                </span>
              </div>
            </div>
            <p className="text-sm text-black/60 max-w-[220px] mb-4">
              A trusted marketplace built by and for IK Gujral Punjab
              Technical University students.
            </p>
            
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-display font-semibold text-sm mb-3">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-black/60 hover:text-[var(--brand-orange)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-black/50">
            &copy; {new Date().getFullYear()} Campus Cart. All rights reserved.
          </p>
          <p className="text-xs text-black/50">
            Made with <span className="text-[var(--brand-orange)]">❤</span> by
            IKGPTU Students
          </p>
        </div>
      </div>
    </footer>
  );
}
