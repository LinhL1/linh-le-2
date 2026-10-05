import { motion } from "framer-motion";

import { communityIntro, events } from "@/data/events";
import EventPostcard from "@/components/EventPostcard";

const CommunitySection = () => {
  return (
    <section id="community" className="py-32">
      <div className="max-w-6xl mx-auto px-6">

        {/* Section label + divider */}
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <p className="editorial-label mb-4">03 — Community</p>
          <div className="editorial-divider mb-12" />
        </motion.div>

        {/* Heading + intro */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <h2 className="section-heading text-foreground mb-6">
            Community & <em>Events</em>
          </h2>
          <p className="text-muted-foreground max-w-xl mb-16">
            {communityIntro}
          </p>
        </motion.div>

        {/* Postcard gallery */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {events.map((event, i) => (
            <motion.div
              key={event.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <EventPostcard event={event} />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default CommunitySection;
