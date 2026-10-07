import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProjectCarousel from "@/components/ProjectCarousel";
import { projects, type Project } from "@/data/projects";

const categories: { key: Project["category"]; title: string }[] = [
  { key: "personal", title: "Personal" },
  { key: "hackathon", title: "Hackathon" },
  { key: "other", title: "Other" },
];

const AllProjects = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="pt-10 pb-32">
        <div className="max-w-6xl mx-auto px-6">

          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} />
              Back to home
            </Link>
          </motion.div>

          {/* Section label + divider */}
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
          </motion.div>

          {/* Heading */}
          <motion.h2
            className="section-heading text-foreground mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            All <em className="text-sage">Projects</em>
          </motion.h2>

          {/* Three carousels side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-8">
            {categories.map((cat, i) => {
              const categoryProjects = projects.filter((p) => p.category === cat.key);

              return (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: 0.1 * i }}
                >
                  <h3 className="font-display text-xl md:text-3xl text-foreground mb-8">
                    {cat.title}
                  </h3>
                  <ProjectCarousel
                    projects={categoryProjects}
                    imageScaleClassName="scale-[1.85] md:scale-[1.7] md:group-hover:scale-[1.78]"
                  />
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AllProjects;
