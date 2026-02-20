import { motion } from "framer-motion";
import { Github, Star, GitFork } from "lucide-react";

const GitHubSection = () => {
  return (
    <section id="github" className="py-32">
      <div className="container mx-auto px-6">
        <motion.div
          className="glass rounded-3xl p-12 sm:p-16 text-center max-w-3xl mx-auto glow-box"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <Github className="w-16 h-16 text-foreground mx-auto mb-6" />
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Open <span className="gradient-text">Source</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            NeuroCore is free and open source. Contribute, star, or fork — every bit helps.
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 glass rounded-full px-5 py-2">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">2.4k stars</span>
            </div>
            <div className="flex items-center gap-2 glass rounded-full px-5 py-2">
              <GitFork className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">380 forks</span>
            </div>
          </div>

          <a
            href="#"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            <Github className="w-5 h-5" />
            View on GitHub
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default GitHubSection;
