import { motion } from "framer-motion";
import { Zap, Brain, Monitor, Package, Bot, Microscope } from "lucide-react";

const features = [
  { icon: Zap, title: "3x Faster Performance", desc: "Optimized C++ kernels outperform Python-based frameworks on training and inference." },
  { icon: Brain, title: "Autodiff Engine", desc: "Automatic differentiation with computational graph for seamless backpropagation." },
  { icon: Monitor, title: "GPU Acceleration", desc: "Native CUDA support for parallel tensor operations on NVIDIA hardware." },
  { icon: Package, title: "Model Serialization", desc: "Save and load trained models with a compact binary format." },
  { icon: Bot, title: "AutoML Logic", desc: "Automated hyperparameter search and architecture selection for optimal performance." },
  { icon: Microscope, title: "Transformer Support", desc: "Full attention mechanism with multi-head attention and positional encoding." },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 relative">
      <div className="gradient-mesh absolute inset-0 pointer-events-none" />
      <div className="container mx-auto px-6 relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Built for <span className="gradient-text">Performance</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Every component is engineered from scratch in C++ for maximum speed and minimal overhead.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="group glass rounded-2xl p-6 hover:glow-box transition-all duration-300 cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
