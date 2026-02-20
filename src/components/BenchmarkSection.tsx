import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

const trainingData = [
  { name: "NeuroCore", time: 12, fill: "hsl(190, 95%, 55%)" },
  { name: "PyTorch", time: 35, fill: "hsl(220, 15%, 30%)" },
  { name: "TensorFlow", time: 42, fill: "hsl(220, 15%, 25%)" },
];

const memoryData = [
  { name: "NeuroCore", usage: 180, fill: "hsl(190, 95%, 55%)" },
  { name: "PyTorch", usage: 420, fill: "hsl(220, 15%, 30%)" },
  { name: "TensorFlow", usage: 510, fill: "hsl(220, 15%, 25%)" },
];

const BenchmarkSection = () => {
  return (
    <section id="benchmarks" className="py-32">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Benchmark <span className="gradient-text">Results</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Head-to-head comparison on MNIST training (batch=32, 10 epochs).
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            className="glass rounded-2xl p-8"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold mb-6 text-foreground">Training Time (seconds)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trainingData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 13 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="time" radius={[0, 8, 8, 0]} barSize={32}>
                  {trainingData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            className="glass rounded-2xl p-8"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold mb-6 text-foreground">Memory Usage (MB)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={memoryData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 13 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="usage" radius={[0, 8, 8, 0]} barSize={32}>
                  {memoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BenchmarkSection;
