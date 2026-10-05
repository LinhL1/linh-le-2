import { motion } from "framer-motion";
import Postcard from "./Postcard";
import { contact, socials } from "@/data/profile";

const ContactSection = () => {
  return (
    <section id="contact" className="py-32">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <p className="editorial-label mb-4">05 — Contact</p>
          <div className="editorial-divider mb-12" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Left: heading + blurb + socials */}
          <motion.div
            className="md:col-span-6"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <h2 className="section-heading text-foreground mb-8">
              Let's <em className="text-sage dark:text-butter/80">chit-chat</em>
            </h2>
            <p className="font-body text-lg text-muted-foreground leading-relaxed max-w-md mb-10">
              {contact.blurb}
            </p>

            <div className="space-y-8">
              <div>
                <p className="editorial-label mb-2">Email</p>
                <a
                  href={`mailto:${contact.email}`}
                  className="font-display text-2xl text-foreground hover:text-muted-foreground transition-colors"
                >
                  {contact.email}
                </a>
              </div>
              <div>
                <p className="editorial-label mb-2">Socials</p>
                <div className="space-y-2">
                  {socials.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      className="block font-display text-2xl text-foreground hover:text-muted-foreground hover:translate-x-1 transition-all duration-200"
                    >
                      {social.name} →
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Postcard */}
          <motion.div
            className="md:col-span-6 flex items-start"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Postcard />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;