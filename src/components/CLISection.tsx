import { motion } from "framer-motion";

const CLISection = () => {
  return (
    <section className="py-32 relative">
      <div className="gradient-mesh absolute inset-0 pointer-events-none" />
      <div className="container mx-auto px-6 relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            CLI <span className="gradient-text">Interface</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Train, evaluate, and export models from the command line.
          </p>
        </motion.div>

        <motion.div
          className="max-w-3xl mx-auto space-y-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="glass-strong rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full" style={{ background: "hsl(45, 80%, 50%, 0.6)" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "hsl(140, 60%, 45%, 0.6)" }} />
              <span className="text-xs text-muted-foreground ml-3 code-font">terminal</span>
            </div>
            <div className="p-6 code-font text-sm leading-relaxed">
              <div className="text-muted-foreground">$ Train a CNN on MNIST</div>
              <div className="mt-2">
                <span className="text-primary">$</span>{" "}
                <span className="text-foreground">./neurocore train --model cnn --dataset mnist --epochs 10</span>
              </div>
              <div className="mt-3 text-muted-foreground">
                [INFO] Loading dataset: mnist (60,000 samples)<br />
                [INFO] Model: CNN (3 conv layers, 2 dense)<br />
                [INFO] Device: CUDA (RTX 4090)<br />
                <span className="text-primary">Epoch 1/10 ━━━━━━━━━━ loss: 0.342 acc: 89.2%</span><br />
                <span className="text-primary">Epoch 10/10 ━━━━━━━━━━ loss: 0.021 acc: 99.1%</span><br />
                [INFO] Model saved → models/cnn_mnist.bin
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50">
              <span className="text-xs text-muted-foreground code-font">example.cpp</span>
            </div>
            <div className="p-6 code-font text-sm leading-relaxed">
              <span className="text-muted-foreground">// GPU tensor creation</span>
              <br />
              <span className="text-primary">Tensor</span>{" "}
              <span className="text-foreground">x</span>
              <span className="text-muted-foreground">(</span>
              <span className="text-foreground">{"{"}</span>
              <span className="text-accent">32</span>
              <span className="text-foreground">, </span>
              <span className="text-accent">784</span>
              <span className="text-foreground">{"}"}</span>
              <span className="text-muted-foreground">, </span>
              <span className="text-foreground">device=</span>
              <span className="text-accent">"gpu"</span>
              <span className="text-muted-foreground">);</span>
              <br /><br />
              <span className="text-muted-foreground">// Forward pass</span>
              <br />
              <span className="text-primary">auto</span>{" "}
              <span className="text-foreground">y = model.forward(x);</span>
              <br />
              <span className="text-foreground">y.backward();</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CLISection;
