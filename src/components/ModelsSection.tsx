import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const models = [
  { name: "ANN", full: "Artificial Neural Network", desc: "Fully connected feedforward networks with configurable depth and width. Supports batch normalization and dropout." },
  { name: "CNN", full: "Convolutional Neural Network", desc: "2D convolutions with pooling, stride, and padding control. Ideal for image classification and feature extraction." },
  { name: "RNN", full: "Recurrent Neural Network", desc: "LSTM and GRU cells for sequential data. Supports bidirectional and multi-layer configurations." },
  { name: "Transformer", full: "Transformer Architecture", desc: "Multi-head self-attention with positional encoding. Built for NLP tasks and sequence-to-sequence modeling." },
];

const ModelsSection = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section id="models" className="py-32">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Supported <span className="gradient-text">Models</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From simple perceptrons to full transformer architectures.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {models.map((m) => (
            <motion.div
              key={m.name}
              className="glass rounded-2xl p-6 cursor-pointer hover:glow-box transition-all duration-300"
              onClick={() => setExpanded(expanded === m.name ? null : m.name)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              layout
            >
              <div className="text-2xl font-bold gradient-text mb-1">{m.name}</div>
              <div className="text-sm text-muted-foreground mb-3">{m.full}</div>
              <AnimatePresence>
                {expanded === m.name && (
                  <motion.p
                    className="text-sm text-secondary-foreground leading-relaxed"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {m.desc}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="text-xs text-muted-foreground mt-3">
                {expanded === m.name ? "Click to collapse" : "Click to expand"}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModelsSection;
