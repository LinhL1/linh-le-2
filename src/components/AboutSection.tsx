import { motion } from "framer-motion";
import { useState } from "react";
import myPhoto from "@/assets/me.jpg";
import closedEnvelope from "@/assets/closed_envelope.png";
import openEnvelope from "@/assets/open_envelope.png";
import { bio, funFact, stats } from "@/data/profile";

const AboutSection = () => {
  const [envelopeOpen, setEnvelopeOpen] = useState(false);

  return (
    <section id="about" className="py-32">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <p className="editorial-label mb-4">01 — About</p>
          <div className="editorial-divider mb-12" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* Left column — photo + postcard + envelope */}
          <motion.div
            className="md:col-span-5"
            initial={{ opacity: 0, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <h2 className="font-display section-heading text-foreground mb-10">
              A bit <em className="text-sage dark:text-butter/80">about me</em>
            </h2>

            {/* Photo + overlapping postcard */}
            <div className="relative mx-auto md:mx-0 w-2/3 mb-20">
              {/* Decorative frame */}
              <div className="absolute mt-8 -left-4 w-full h-full border border-foreground/20" />

              {/* Photo */}
              <div className="w-full mt-10 aspect-[3/4] bg-card border border-border overflow-hidden">
                <img
                  src={myPhoto}
                  alt="Linh Le"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Postcard — lower-right, partially over the photo */}
              <div
                className="absolute -bottom-20 -right-6 w-[95%] z-10"
                style={{
                  border: "1px solid hsl(var(--border))",
                  padding: "4px",
                  boxShadow: "4px 4px 0 hsl(var(--border))",
                  backgroundColor: "hsl(var(--card))",
                  borderRadius: "2px",
                }}
              >
                <div style={{
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--card))",
                  padding: "14px 16px 16px 16px",
                  borderRadius: "1px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <span style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", fontFamily: "inherit" }}>
                      Fun Fact
                    </span>
                  </div>
                  <div style={{ height: "1px", backgroundColor: "hsl(var(--border))", marginBottom: "12px" }} />
                  <p className="font-display text-xl text-foreground mb-1">
                    I'm also a <em className="text-sage dark:text-butter/80">florist</em>
                  </p>
                  <p className="font-body text-xs leading-relaxed text-muted-foreground">
                    {funFact.body}
                  </p>
                </div>
              </div>
            </div>

            {/* Envelope button — below the photo+postcard */}
            <a
              href={funFact.link}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-20 w-52 h-44 cursor-pointer mx-auto md:mx-0 -translate-y-8 block"
              onMouseEnter={() => setEnvelopeOpen(true)}
              onMouseLeave={() => setEnvelopeOpen(false)}
            >
              <img
                src={closedEnvelope}
                alt="Closed envelope"
                className={`absolute inset-0 w-full h-full object-contain ${envelopeOpen ? "hidden" : ""}`}
              />
              <img
                src={openEnvelope}
                alt="Open envelope"
                className={`absolute inset-0 w-full h-full object-contain ${envelopeOpen ? "" : "hidden"}`}
              />
            </a>
            <p className="editorial-label text-center md:text-left -mt-4 md:ml-12">Take a peek</p>

          </motion.div>

          {/* Right column — bio + stats */}
          <motion.div
            className="md:col-span-7 space-y-6"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <em className="text-foreground font-display text-3xl">{bio.headline}</em>
            {bio.paragraphs.map((paragraph) => (
              <p key={paragraph} className="font-body text-lg leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}

            <div className="grid grid-cols-2 gap-8 pt-6">
              {stats.map((item) => (
                <div key={item.label}>
                  <p className="editorial-label mb-1">{item.label}</p>
                  <p className="font-display text-2xl text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;
