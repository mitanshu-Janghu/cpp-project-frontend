import { motion } from "framer-motion";

const steps = [
  { label: "Tensor", desc: "N-dimensional array engine" },
  { label: "Graph", desc: "Computational graph builder" },
  { label: "Layers", desc: "Dense, Conv, RNN, Attention" },
  { label: "Trainer", desc: "Training loop & batching" },
  { label: "Optimizer", desc: "SGD, Adam, RMSProp" },
  { label: "Save", desc: "Model serialization" },
];

const ArchitectureSection = () => {
  return (
    <section id="architecture" className="py-32 relative">
      <div className="gradient-mesh absolute inset-0 pointer-events-none" />
      <div className="container mx-auto px-6 relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Engine <span className="gradient-text">Architecture</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A clean pipeline from raw tensors to saved models.
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              className="flex items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="glass rounded-2xl p-5 text-center min-w-[130px] hover:glow-box transition-all duration-300">
                <div className="text-base font-semibold text-foreground">{step.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{step.desc}</div>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden sm:block text-primary mx-2 text-xl">→</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
