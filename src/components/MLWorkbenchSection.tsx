import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Database,
  Download,
  FileDown,
  FileSpreadsheet,
  Orbit,
  Sparkles,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type CandidateResult = {
  name: string;
  train_metric: number;
  validation_metric: number;
};

type DownloadResult = {
  label: string;
  path: string;
};

type TrainResponse = {
  ok: boolean;
  run_id: string;
  task: string;
  metric_name: string;
  maximize_metric: boolean;
  best_model: string;
  best_metric: number;
  dataset: {
    samples: number;
    features: number;
    target_size: number;
    classification: boolean;
    feature_names: string[];
    class_names: string[];
  };
  candidates: CandidateResult[];
  loss_history: number[];
  downloads: DownloadResult[];
  error?: string;
};

type DatasetPreview = {
  samples: number;
  featureNames: string[];
  targetName: string;
  rows: Array<Record<string, number | string>>;
  scatter: Array<Record<string, number | string>>;
  targetDistribution: Array<{ name: string; value: number }>;
  regressionTrend: Array<{ index: number; value: number }>;
};

type ColumnKind = "numeric" | "categorical" | "mixed" | "empty";

type ColumnProfile = {
  name: string;
  role: "feature" | "target";
  kind: ColumnKind;
  missing: number;
  unique: number;
  outliers: number;
  min?: number;
  max?: number;
};

type CorrelationCell = {
  row: string;
  column: string;
  value: number;
};

type PairPlot = {
  xKey: string;
  yKey: string;
  points: Array<{ x: number; y: number; label: string }>;
};

type DatasetAnalysis = {
  missingCells: number;
  missingRate: number;
  duplicateRows: number;
  duplicateRate: number;
  numericFeatureNames: string[];
  columnProfiles: ColumnProfile[];
  outlierColumns: Array<{ name: string; count: number }>;
  imbalance: {
    warning: boolean;
    majorityLabel: string;
    minorityLabel: string;
    ratio: number;
  } | null;
  qualityScore: number;
  qualityLabel: string;
  correlationCells: CorrelationCell[];
  pairPlots: PairPlot[];
};

type DatasetArtifacts = {
  preview: DatasetPreview | null;
  analysis: DatasetAnalysis | null;
};

const CHART_COLORS = ["#6ed9c5", "#f4b66a", "#93b9ff", "#ff8a8a", "#b7f07b"];

const parseCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const toNumeric = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const quantile = (values: number[], ratio: number) => {
  if (!values.length) return 0;
  const position = (values.length - 1) * ratio;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return values[lower];
  const weight = position - lower;
  return values[lower] * (1 - weight) + values[upper] * weight;
};

const pearsonCorrelation = (left: number[], right: number[]) => {
  if (left.length !== right.length || left.length < 2) return 0;

  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;

  let numerator = 0;
  let leftVariance = 0;
  let rightVariance = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftDiff = left[index] - leftMean;
    const rightDiff = right[index] - rightMean;
    numerator += leftDiff * rightDiff;
    leftVariance += leftDiff * leftDiff;
    rightVariance += rightDiff * rightDiff;
  }

  const denominator = Math.sqrt(leftVariance * rightVariance);
  if (!Number.isFinite(denominator) || denominator <= 1e-8) return 0;
  return numerator / denominator;
};

const inferColumnKind = (values: string[]): ColumnKind => {
  const nonMissing = values.filter((value) => value.trim() !== "");
  if (!nonMissing.length) return "empty";

  let numericCount = 0;
  nonMissing.forEach((value) => {
    if (toNumeric(value) !== null) {
      numericCount += 1;
    }
  });

  if (numericCount === nonMissing.length) return "numeric";
  if (numericCount === 0) return "categorical";
  return "mixed";
};

const buildDatasetArtifacts = (csvText: string, hasHeader: boolean): DatasetArtifacts => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { preview: null, analysis: null };
  }

  const rows = lines.map(parseCsvLine);
  const firstDataIndex = hasHeader ? 1 : 0;
  const width = rows[firstDataIndex]?.length ?? 0;

  if (width < 2) {
    return { preview: null, analysis: null };
  }

  const consistent = rows.slice(firstDataIndex).every((row) => row.length === width);
  if (!consistent) {
    return { preview: null, analysis: null };
  }

  const columnNames = hasHeader
    ? rows[0].map((name, index) => name || `column_${index + 1}`)
    : Array.from({ length: width }, (_, index) => `column_${index + 1}`);

  const featureNames = columnNames.slice(0, -1).map((name, index) => name || `feature_${index + 1}`);
  const targetName = columnNames[width - 1] || "target";
  const dataRows = rows.slice(firstDataIndex);

  const parsedRows = dataRows.map((row, rowIndex) => {
    const record: Record<string, number | string> = { row: rowIndex + 1 };
    featureNames.forEach((featureName, featureIndex) => {
      const raw = row[featureIndex] ?? "";
      const numeric = toNumeric(raw);
      record[featureName] = numeric ?? raw;
    });
    record[targetName] = row[width - 1] ?? "";
    return record;
  });

  const targetValues = dataRows.map((row) => row[width - 1] ?? "");
  const targetDistributionMap = new Map<string, number>();
  targetValues.forEach((value) => {
    const key = value === "" ? "(missing)" : value;
    targetDistributionMap.set(key, (targetDistributionMap.get(key) ?? 0) + 1);
  });

  const targetDistribution = Array.from(targetDistributionMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  const numericTargets = targetValues.map((value) => toNumeric(value)).filter((value): value is number => value !== null);
  const isRegressionLike = numericTargets.length === targetValues.length;

  const numericFeatureNames = featureNames.filter((featureName, index) => {
    const values = dataRows.map((row) => row[index] ?? "");
    return inferColumnKind(values) === "numeric";
  });

  const scatterX = numericFeatureNames[0] ?? featureNames[0] ?? "feature_1";
  const scatterY = numericFeatureNames[1] ?? numericFeatureNames[0] ?? featureNames[1] ?? featureNames[0] ?? "feature_1";
  const scatter = parsedRows.slice(0, 48).map((row) => ({
    [scatterX]: Number(row[scatterX] ?? 0),
    [scatterY]: Number(row[scatterY] ?? 0),
    label: String(row[targetName]),
  }));

  const regressionTrend = isRegressionLike
    ? numericTargets.slice(0, 56).map((value, index) => ({ index: index + 1, value }))
    : [];

  const duplicateRows = dataRows.length - new Set(dataRows.map((row) => JSON.stringify(row))).size;
  const duplicateRate = dataRows.length ? duplicateRows / dataRows.length : 0;

  const columnProfiles: ColumnProfile[] = columnNames.map((name, columnIndex) => {
    const values = dataRows.map((row) => row[columnIndex] ?? "");
    const missing = values.filter((value) => value.trim() === "").length;
    const nonMissing = values.filter((value) => value.trim() !== "");
    const kind = inferColumnKind(values);

    let outliers = 0;
    let min: number | undefined;
    let max: number | undefined;

    if (kind === "numeric") {
      const numericValues = nonMissing
        .map((value) => toNumeric(value))
        .filter((value): value is number => value !== null)
        .sort((left, right) => left - right);

      if (numericValues.length) {
        min = numericValues[0];
        max = numericValues[numericValues.length - 1];
        const q1 = quantile(numericValues, 0.25);
        const q3 = quantile(numericValues, 0.75);
        const iqr = q3 - q1;
        const lowerFence = q1 - 1.5 * iqr;
        const upperFence = q3 + 1.5 * iqr;
        outliers = numericValues.filter((value) => value < lowerFence || value > upperFence).length;
      }
    }

    return {
      name,
      role: columnIndex === width - 1 ? "target" : "feature",
      kind,
      missing,
      unique: new Set(nonMissing).size,
      outliers,
      min,
      max,
    };
  });

  const missingCells = columnProfiles.reduce((sum, profile) => sum + profile.missing, 0);
  const missingRate = dataRows.length && columnNames.length
    ? missingCells / (dataRows.length * columnNames.length)
    : 0;

  const outlierColumns = columnProfiles
    .filter((profile) => profile.role === "feature" && profile.outliers > 0)
    .map((profile) => ({ name: profile.name, count: profile.outliers }))
    .sort((left, right) => right.count - left.count);

  const imbalance = !isRegressionLike && targetDistribution.length > 1
    ? (() => {
        const sorted = [...targetDistribution].sort((left, right) => right.value - left.value);
        const majority = sorted[0];
        const minority = sorted[sorted.length - 1];
        const ratio = minority.value > 0 ? majority.value / minority.value : Infinity;
        return {
          warning: ratio >= 1.8,
          majorityLabel: majority.name,
          minorityLabel: minority.name,
          ratio,
        };
      })()
    : null;

  const heatmapFeatures = numericFeatureNames.slice(0, 5);
  const correlationCells = heatmapFeatures.flatMap((rowName) => (
    heatmapFeatures.map((columnName) => {
      const rowIndex = featureNames.indexOf(rowName);
      const columnIndex = featureNames.indexOf(columnName);

      const pairs = dataRows
        .map((row) => [toNumeric(row[rowIndex] ?? ""), toNumeric(row[columnIndex] ?? "")] as const)
        .filter((pair): pair is readonly [number, number] => pair[0] !== null && pair[1] !== null);

      const left = pairs.map((pair) => pair[0]);
      const right = pairs.map((pair) => pair[1]);

      return {
        row: rowName,
        column: columnName,
        value: rowName === columnName ? 1 : pearsonCorrelation(left, right),
      };
    })
  ));

  const pairFeatureNames = numericFeatureNames.slice(0, 3);
  const pairPlots: PairPlot[] = [];
  for (let leftIndex = 0; leftIndex < pairFeatureNames.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < pairFeatureNames.length; rightIndex += 1) {
      const xKey = pairFeatureNames[leftIndex];
      const yKey = pairFeatureNames[rightIndex];
      const xColumn = featureNames.indexOf(xKey);
      const yColumn = featureNames.indexOf(yKey);

      const points = dataRows
        .slice(0, 48)
        .map((row) => {
          const x = toNumeric(row[xColumn] ?? "");
          const y = toNumeric(row[yColumn] ?? "");
          if (x === null || y === null) return null;

          return {
            x,
            y,
            label: String(row[width - 1] ?? ""),
          };
        })
        .filter((point): point is { x: number; y: number; label: string } => point !== null);

      pairPlots.push({ xKey, yKey, points });
    }
  }

  const mixedOrEmptyColumns = columnProfiles.filter((profile) => profile.kind === "mixed" || profile.kind === "empty").length;
  const outlierRate = dataRows.length && numericFeatureNames.length
    ? outlierColumns.reduce((sum, entry) => sum + entry.count, 0) / (dataRows.length * numericFeatureNames.length)
    : 0;

  let qualityScore = 100;
  qualityScore -= missingRate * 40;
  qualityScore -= duplicateRate * 25;
  qualityScore -= outlierRate * 25;
  qualityScore -= (mixedOrEmptyColumns / Math.max(1, columnProfiles.length)) * 15;
  if (imbalance?.warning) {
    qualityScore -= Math.min(16, (imbalance.ratio - 1.8) * 4.5);
  }
  if (dataRows.length < 25) {
    qualityScore -= 8;
  }
  qualityScore = Math.max(0, Math.min(100, Math.round(qualityScore)));

  const qualityLabel =
    qualityScore >= 88 ? "Excellent"
      : qualityScore >= 75 ? "Strong"
        : qualityScore >= 60 ? "Usable"
          : "Needs cleanup";

  return {
    preview: {
      samples: parsedRows.length,
      featureNames,
      targetName,
      rows: parsedRows.slice(0, 7),
      scatter,
      targetDistribution,
      regressionTrend,
    },
    analysis: {
      missingCells,
      missingRate,
      duplicateRows,
      duplicateRate,
      numericFeatureNames,
      columnProfiles,
      outlierColumns,
      imbalance,
      qualityScore,
      qualityLabel,
      correlationCells,
      pairPlots: pairPlots.slice(0, 3),
    },
  };
};

const formatMetric = (value: number) => {
  if (!Number.isFinite(value)) return "n/a";
  if (Math.abs(value) < 10) return value.toFixed(4);
  return value.toFixed(2);
};

const formatPercent = (value: number) => `${(value * 100).toFixed(value * 100 >= 10 ? 0 : 1)}%`;

const prettyName = (value: string) => {
  const labels: Record<string, string> = {
    logistic_regression: "Logistic Regression",
    linear_regression: "Linear Regression",
    decision_tree: "Decision Tree",
    random_forest: "Random Forest",
    knn: "KNN",
    naive_bayes: "Naive Bayes",
    svm: "SVM",
    svr: "SVR",
    gradient_boosting: "Gradient Boosting",
    xgboost_style: "XGBoost Style",
    lightgbm_style: "LightGBM Style",
    compact_ann: "Compact ANN",
    deep_ann: "Deep ANN",
  };

  return labels[value] ?? value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const supportsLossCurve = (modelName?: string | null) =>
  modelName === "compact_ann" || modelName === "deep_ann";

const isTrainedModelDownload = (item: DownloadResult) =>
  /trained_model\.(nn|json)$/i.test(item.path) || /model (weights|file)/i.test(item.label);

const isArchitectureDownload = (item: DownloadResult) =>
  /trained_model\.nn\.json$/i.test(item.path) || /architecture/i.test(item.label);

const heatColor = (value: number) => {
  const intensity = Math.min(1, Math.abs(value));
  if (value >= 0) {
    return `rgba(110, 217, 197, ${0.12 + intensity * 0.48})`;
  }
  return `rgba(255, 138, 138, ${0.12 + intensity * 0.48})`;
};

const compactLabel = (value: string, maxLength = 10) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");

const buildApiUrl = (path: string) =>
  API_BASE_URL ? `${API_BASE_URL}${path}` : path;

const absolutizeDownloadPath = (path: string) => {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return buildApiUrl(path.startsWith("/") ? path : `/${path}`);
};

const MLWorkbenchSection = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasHeader, setHasHeader] = useState(true);
  const [epochs, setEpochs] = useState(30);
  const [isTraining, setIsTraining] = useState(false);
  const [status, setStatus] = useState("Upload a CSV file to preview the data and train a model.");
  const [error, setError] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<DatasetPreview | null>(null);
  const [analysis, setAnalysis] = useState<DatasetAnalysis | null>(null);
  const [result, setResult] = useState<TrainResponse | null>(null);

  const lossChartData = useMemo(
    () => result?.loss_history.map((loss, index) => ({ epoch: index + 1, loss })) ?? [],
    [result],
  );

  const featureHeadline = preview?.featureNames.slice(0, 3).join(" • ") || "Awaiting dataset";
  const classSummary = result?.dataset.class_names.length
    ? result.dataset.class_names.join(", ")
    : preview?.targetDistribution.map((item) => item.name).slice(0, 4).join(", ");
  const trainedModelDownload = result?.downloads.find((item) => isTrainedModelDownload(item)) ?? null;
  const architectureDownload = result?.downloads.find((item) => isArchitectureDownload(item)) ?? null;
  const secondaryDownloads = result?.downloads.filter(
    (item) => !isTrainedModelDownload(item) && !isArchitectureDownload(item),
  ) ?? [];
  const topOutlierText = analysis?.outlierColumns.length
    ? analysis.outlierColumns.slice(0, 2).map((entry) => `${entry.name} (${entry.count})`).join(", ")
    : "No major outliers flagged";
  const missingValueText = analysis
    ? `${analysis.missingCells} cells missing (${formatPercent(analysis.missingRate)})`
    : "Pending";

  const parseTrainApiResponse = async (response: Response) => {
    const rawText = await response.text();

    if (!rawText.trim()) {
      throw new Error("The backend returned an empty response. Make sure the C++ server is running on port 5050.");
    }

    let payload: TrainResponse;
    try {
      payload = JSON.parse(rawText) as TrainResponse;
    } catch {
      throw new Error("The backend response was not valid JSON. Check that the C++ API is reachable and returning `/api/train` output.");
    }

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || `Training failed with status ${response.status}.`);
    }

    return {
      ...payload,
      downloads: payload.downloads.map((download) => ({
        ...download,
        path: absolutizeDownloadPath(download.path),
      })),
    };
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
    setError(null);

    if (!file) {
      setCsvText("");
      setPreview(null);
      setAnalysis(null);
      setStatus("Upload a CSV file to preview the data and train a model.");
      return;
    }

    const text = await file.text();
    setCsvText(text);
    const artifacts = buildDatasetArtifacts(text, hasHeader);
    setPreview(artifacts.preview);
    setAnalysis(artifacts.analysis);
    setStatus(`Loaded ${file.name}. Review the diagnostics and visuals, then launch training.`);
  };

  const handleHeaderToggle = (checked: boolean) => {
    setHasHeader(checked);
    if (csvText) {
      const artifacts = buildDatasetArtifacts(csvText, checked);
      setPreview(artifacts.preview);
      setAnalysis(artifacts.analysis);
    }
  };

  const handleTrain = async () => {
    if (!selectedFile || !csvText) {
      setError("Choose a CSV file first.");
      return;
    }

    setIsTraining(true);
    setError(null);
    setStatus("Sending your CSV to the C++ backend and ranking model candidates...");

    try {
      const response = await fetch(
        buildApiUrl(
          `/api/train?filename=${encodeURIComponent(selectedFile.name)}&header=${hasHeader ? "1" : "0"}&epochs=${encodeURIComponent(String(epochs))}`,
        ),
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
          },
          body: csvText,
        },
      );

      const payload = await parseTrainApiResponse(response);

      setResult(payload);
      setStatus(`Training complete. ${prettyName(payload.best_model)} is ready and all artifacts are downloadable.`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Training failed.";
      setError(message);
      setStatus("The run did not finish cleanly.");
    } finally {
      setIsTraining(false);
    }
  };

  const handlePdfExport = () => {
    if (!analysis || !preview) {
      setError("Load a CSV file first so the report has real data.");
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 44;
    const maxWidth = pageWidth - margin * 2;
    let y = 46;

    const addBlock = (title: string, lines: string[]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(title, margin, y);
      y += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      lines.forEach((line) => {
        const wrapped = doc.splitTextToSize(line, maxWidth) as string[];
        doc.text(wrapped, margin, y);
        y += wrapped.length * 13 + 6;
      });
      y += 8;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("NeuroCore Dataset Report", margin, y);
    y += 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`File: ${selectedFile?.name ?? "Uploaded CSV"}`, margin, y);
    y += 16;
    doc.text(`Rows: ${preview.samples}   Features: ${preview.featureNames.length}   Quality score: ${analysis.qualityScore}/100 (${analysis.qualityLabel})`, margin, y);
    y += 28;

    addBlock("Dataset Quality", [
      `${missingValueText}`,
      `${analysis.duplicateRows} duplicate rows detected (${formatPercent(analysis.duplicateRate)})`,
      analysis.outlierColumns.length
        ? `Outlier-heavy columns: ${analysis.outlierColumns.slice(0, 4).map((entry) => `${entry.name} (${entry.count})`).join(", ")}`
        : "Outlier summary: no major outlier-heavy columns were detected.",
      analysis.imbalance
        ? `Class balance: majority ${analysis.imbalance.majorityLabel}, minority ${analysis.imbalance.minorityLabel}, ratio ${analysis.imbalance.ratio.toFixed(2)}${analysis.imbalance.warning ? " (warning)" : ""}`
        : "Class balance: no classification imbalance warning triggered.",
    ]);

    addBlock("Column Types", analysis.columnProfiles.map((profile) => (
      `${profile.name} [${profile.role}] ${profile.kind}, missing ${profile.missing}, unique ${profile.unique}${profile.kind === "numeric" && profile.min !== undefined && profile.max !== undefined ? `, range ${formatMetric(profile.min)} to ${formatMetric(profile.max)}` : ""}`
    )));

    addBlock("Correlation Focus", analysis.correlationCells
      .filter((cell) => cell.row !== cell.column)
      .sort((left, right) => Math.abs(right.value) - Math.abs(left.value))
      .slice(0, 6)
      .map((cell) => `${cell.row} vs ${cell.column}: ${cell.value.toFixed(3)}`));

    if (result) {
      addBlock("Training Result", [
        `Best model: ${prettyName(result.best_model)}`,
        `Best ${result.metric_name}: ${formatMetric(result.best_metric)}`,
        `Task: ${result.task}`,
        `Candidates compared: ${result.candidates.length}`,
      ]);
    }

    doc.save(`${(selectedFile?.name ?? "dataset").replace(/\.csv$/i, "")}-report.pdf`);
  };

  return (
    <section id="workbench" className="relative overflow-hidden px-6 py-24 sm:py-28">
      <div className="absolute inset-0 premium-orbs opacity-90" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="premium-pill mx-auto">
            <Sparkles className="h-4 w-4 text-primary" />
            Training Studio
          </div>
          <h2 className="font-display mt-6 text-3xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-4xl">
            A single place for upload, training, and export.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            The workflow now includes live dataset diagnostics too: missing values, duplicates, data types, outliers, imbalance checks, correlation mapping, pair plots, and a downloadable PDF report.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-8 xl:grid-cols-[390px_minmax(0,1fr)]">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65 }}
          >
            <Card className="premium-panel overflow-hidden border-border/50">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[#f4b66a] to-[#92b8ff]" />
              <CardHeader className="relative space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="font-display flex items-center gap-3 text-xl tracking-tight sm:text-[1.65rem]">
                      <Upload className="h-6 w-6 text-primary" />
                      Upload & Train
                    </CardTitle>
                    <CardDescription className="mt-2 max-w-sm text-sm leading-7">
                      Upload a tabular CSV, inspect the dataset quality first, then let the backend rank models and export the winner.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="premium-file-drop">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-base font-semibold tracking-tight sm:text-lg">
                        {selectedFile?.name ?? "Choose your CSV"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFile ? `${Math.max(1, Math.round(selectedFile.size / 1024))} KB loaded` : "Numeric columns recommended"}
                      </p>
                    </div>
                  </div>
                  <Input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="mt-4 h-12 rounded-xl border-white/10 bg-black/20" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Epoch Budget</label>
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      value={epochs}
                      onChange={(event) => setEpochs(Number(event.target.value) || 30)}
                      className="h-12 rounded-xl border-white/10 bg-black/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.22em] text-muted-foreground">CSV Mode</label>
                    <label className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={hasHeader}
                        onChange={(event) => handleHeaderToggle(event.target.checked)}
                        className="h-4 w-4 accent-[hsl(var(--primary))]"
                      />
                      First row contains column names
                    </label>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="premium-mini-stat">
                    <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Rows</span>
                    <p className="font-display mt-2 text-lg font-semibold sm:text-xl">{preview?.samples ?? result?.dataset.samples ?? 0}</p>
                  </div>
                  <div className="premium-mini-stat">
                    <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Features</span>
                    <p className="font-display mt-2 text-lg font-semibold sm:text-xl">{preview?.featureNames.length ?? result?.dataset.features ?? 0}</p>
                  </div>
                  <div className="premium-mini-stat">
                    <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Quality</span>
                    <p className="font-display mt-2 text-sm sm:text-base font-semibold">
                      {analysis ? `${analysis.qualityScore}/100` : "Pending"}
                    </p>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="h-14 w-full rounded-2xl bg-gradient-to-r from-primary via-[#79d9c8] to-[#f4b66a] text-base font-semibold text-background shadow-[0_16px_50px_-16px_rgba(110,217,197,0.7)] transition-transform hover:scale-[1.01]"
                  onClick={handleTrain}
                  disabled={isTraining || !selectedFile}
                >
                  <BrainCircuit className="h-5 w-5" />
                  {isTraining ? "Training Run..." : "Train Best Model"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-2xl border-white/10 bg-black/20 text-foreground hover:bg-white/[0.06]"
                  onClick={handlePdfExport}
                  disabled={!analysis}
                >
                  <FileDown className="h-4 w-4" />
                  Export PDF Report
                </Button>

                <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-[0.24em] text-primary/80">Run Status</span>
                    <Orbit className={`h-4 w-4 ${isTraining ? "animate-spin text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{status}</p>
                  {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid min-w-0 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.65 }}
              className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.94fr)]"
            >
              <Card className="premium-panel min-w-0 border-border/50">
                <CardHeader>
                  <CardTitle className="font-display text-xl tracking-tight sm:text-2xl">Run Summary</CardTitle>
                  <CardDescription className="leading-7">
                    Key information for the current dataset, data quality, and selected winner.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                    <div className="premium-metric-card min-w-0">
                      <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Best Model</span>
                      <p className="font-display mt-2 break-words text-base font-semibold leading-tight tracking-tight sm:text-lg xl:text-xl">
                        {result ? prettyName(result.best_model) : "Not trained"}
                      </p>
                    </div>
                    <div className="premium-metric-card min-w-0">
                      <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        Best {result?.metric_name ?? "Metric"}
                      </span>
                      <p className="font-display mt-2 break-words text-base font-semibold tracking-tight sm:text-lg xl:text-xl">
                        {result ? formatMetric(result.best_metric) : "n/a"}
                      </p>
                    </div>
                    <div className="premium-metric-card min-w-0">
                      <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Task Type</span>
                      <p className="font-display mt-2 break-words text-base font-semibold capitalize tracking-tight sm:text-lg xl:text-xl">
                        {result?.task ?? "Pending"}
                      </p>
                    </div>
                    <div className="premium-metric-card min-w-0">
                      <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Quality Score</span>
                      <p className="font-display mt-2 break-words text-base font-semibold tracking-tight sm:text-lg xl:text-xl">
                        {analysis ? `${analysis.qualityScore}/100` : "n/a"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="summary-row">
                      <span>Dataset</span>
                      <span>{selectedFile?.name ?? "No file selected"}</span>
                    </div>
                    <div className="summary-row">
                      <span>Feature Signal</span>
                      <span>{featureHeadline}</span>
                    </div>
                    <div className="summary-row">
                      <span>Target Summary</span>
                      <span>{classSummary || "Pending"}</span>
                    </div>
                    <div className="summary-row">
                      <span>Missing Report</span>
                      <span>{missingValueText}</span>
                    </div>
                    <div className="summary-row">
                      <span>Outlier Summary</span>
                      <span>{topOutlierText}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="premium-panel min-w-0 border-border/50">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2 text-xl sm:text-2xl tracking-tight">
                    <Database className="h-5 w-5 text-primary" />
                    Export Package
                  </CardTitle>
                  <CardDescription>
                    The final trained model is surfaced first, followed by supporting files and a PDF dataset report.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {analysis ? (
                    <button
                      type="button"
                      className="premium-download"
                      onClick={handlePdfExport}
                    >
                      <div className="min-w-0">
                        <p className="font-display text-sm uppercase tracking-[0.22em] text-muted-foreground">
                          Report
                        </p>
                        <p className="mt-2 font-display text-base font-semibold tracking-tight">
                          PDF Quality Report
                        </p>
                        <p className="code-font mt-2 break-words text-[11px] text-muted-foreground">
                          Includes missing values, duplicates, data types, outliers, imbalance, and training summary.
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8">
                        <FileDown className="h-4 w-4 text-foreground" />
                      </div>
                    </button>
                  ) : null}

                  {result?.downloads.length ? (
                    <>
                      {trainedModelDownload ? (
                        <a href={trainedModelDownload.path} className="premium-download-primary" download>
                          <div className="min-w-0">
                            <p className="font-display text-sm uppercase tracking-[0.22em] text-primary/75">
                              Trained Model
                            </p>
                            <p className="mt-2 font-display text-base font-semibold tracking-tight sm:text-lg">
                              {trainedModelDownload.label}
                            </p>
                            <p className="code-font mt-2 truncate text-[11px] text-primary/70">
                              {trainedModelDownload.path}
                            </p>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                            <Download className="h-4 w-4 text-primary" />
                          </div>
                        </a>
                      ) : null}

                      {architectureDownload ? (
                        <a href={architectureDownload.path} className="premium-download" download>
                          <div className="min-w-0">
                            <p className="font-display text-sm uppercase tracking-[0.22em] text-muted-foreground">
                              Architecture
                            </p>
                            <p className="mt-2 font-display text-base font-semibold tracking-tight">
                              {architectureDownload.label}
                            </p>
                            <p className="code-font mt-2 truncate text-[11px] text-muted-foreground">
                              {architectureDownload.path}
                            </p>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8">
                            <Download className="h-4 w-4 text-foreground" />
                          </div>
                        </a>
                      ) : null}

                      {secondaryDownloads.length ? (
                        <div className="rounded-[1.35rem] border border-white/10 bg-black/15 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                            Supporting Files
                          </p>
                          <div className="mt-3 grid gap-2">
                            {secondaryDownloads.map((item) => (
                              <a key={item.path} href={item.path} className="premium-download-secondary" download>
                                <div className="min-w-0">
                                  <span className="block text-sm text-foreground/90">{item.label}</span>
                                  <span className="code-font mt-1 block truncate text-[11px] text-muted-foreground">
                                    {item.path}
                                  </span>
                                </div>
                                <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-white/12 bg-black/15 p-6 text-sm leading-7 text-muted-foreground">
                      Your export package appears here after training. The files come straight from the C++ backend.
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.65, delay: 0.03 }}
              className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
            >
              <Card className="premium-panel min-w-0 border-border/50">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2 text-xl sm:text-2xl tracking-tight">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    Dataset Intelligence
                  </CardTitle>
                  <CardDescription>
                    Missing-value report, duplicate-row detector, outlier summary, class imbalance warning, and overall dataset quality.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {analysis ? (
                    <>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="premium-metric-card">
                          <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Missing</span>
                          <p className="font-display mt-2 text-lg font-semibold tracking-tight">{missingValueText}</p>
                        </div>
                        <div className="premium-metric-card">
                          <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Duplicates</span>
                          <p className="font-display mt-2 text-lg font-semibold tracking-tight">
                            {analysis.duplicateRows} rows
                          </p>
                        </div>
                        <div className="premium-metric-card">
                          <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Quality</span>
                          <p className="font-display mt-2 text-lg font-semibold tracking-tight">
                            {analysis.qualityLabel}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Dataset Quality Score</p>
                            <p className="font-display mt-2 text-4xl font-semibold tracking-[-0.05em] text-white">
                              {analysis.qualityScore}
                            </p>
                          </div>
                          <div className="text-right text-sm leading-6 text-muted-foreground">
                            <p>{analysis.outlierColumns.length ? `${analysis.outlierColumns.length} outlier-heavy columns` : "No major outlier columns"}</p>
                            <p>{analysis.numericFeatureNames.length} numeric features detected</p>
                          </div>
                        </div>
                        <div className="mt-4 h-3 rounded-full bg-white/8">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#ff8a8a] via-[#f4b66a] to-[#6ed9c5]"
                            style={{ width: `${analysis.qualityScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <div className="summary-row">
                          <span>Duplicate-row detector</span>
                          <span>{analysis.duplicateRows} exact duplicates</span>
                        </div>
                        <div className="summary-row">
                          <span>Outlier summary</span>
                          <span>{topOutlierText}</span>
                        </div>
                        <div className="summary-row">
                          <span>Class imbalance</span>
                          <span>
                            {analysis.imbalance
                              ? `${analysis.imbalance.majorityLabel} vs ${analysis.imbalance.minorityLabel} (${analysis.imbalance.ratio.toFixed(2)}x)`
                              : "No imbalance warning"}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="chart-frame chart-frame--empty">Load a CSV to unlock the dataset quality report.</div>
                  )}
                </CardContent>
              </Card>

              <Card className="premium-panel min-w-0 border-border/50">
                <CardHeader>
                  <CardTitle className="font-display text-xl sm:text-2xl tracking-tight">Column Diagnostics</CardTitle>
                  <CardDescription>
                    Column data-type detector, missing-value breakdown, uniqueness signal, and numeric outlier counts.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis?.columnProfiles.length ? (
                    <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-left">
                          <thead className="bg-white/[0.03]">
                            <tr>
                              {["Column", "Role", "Type", "Missing", "Unique", "Outliers"].map((label) => (
                                <th key={label} className="px-4 py-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                                  {label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.columnProfiles.map((profile) => (
                              <tr key={profile.name} className="border-t border-white/6 bg-black/[0.14]">
                                <td className="px-4 py-4 text-sm font-medium text-foreground/92">{profile.name}</td>
                                <td className="px-4 py-4 text-sm text-muted-foreground capitalize">{profile.role}</td>
                                <td className="px-4 py-4 text-sm text-primary capitalize">{profile.kind}</td>
                                <td className="px-4 py-4 text-sm text-foreground/90">{profile.missing}</td>
                                <td className="px-4 py-4 text-sm text-foreground/90">{profile.unique}</td>
                                <td className="px-4 py-4 text-sm text-foreground/90">{profile.outliers || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Column diagnostics appear after parsing a CSV.</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.65, delay: 0.05 }}
              className="grid min-w-0 gap-6 lg:grid-cols-2"
            >
              <Card className="premium-panel min-w-0 border-border/50">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2 text-xl sm:text-2xl tracking-tight">
                    <Database className="h-5 w-5 text-primary" />
                    Feature Correlation Heatmap
                  </CardTitle>
                  <CardDescription>
                    Correlation map for the first numeric features detected in the uploaded dataset.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis?.correlationCells.length ? (
                    <div
                      className="grid gap-2"
                      style={{ gridTemplateColumns: `repeat(${analysis.numericFeatureNames.slice(0, 5).length + 1}, minmax(0, 1fr))` }}
                    >
                      <div />
                      {analysis.numericFeatureNames.slice(0, 5).map((name) => (
                        <div
                          key={`head-${name}`}
                          className="px-1 text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                          title={name}
                        >
                          {compactLabel(name)}
                        </div>
                      ))}
                      {analysis.numericFeatureNames.slice(0, 5).map((rowName) => (
                        <>
                          <div
                            key={`row-${rowName}`}
                            className="flex items-center pr-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                            title={rowName}
                          >
                            {compactLabel(rowName)}
                          </div>
                          {analysis.numericFeatureNames.slice(0, 5).map((columnName) => {
                            const cell = analysis.correlationCells.find(
                              (entry) => entry.row === rowName && entry.column === columnName,
                            );
                            const value = cell?.value ?? 0;
                            return (
                              <div
                                key={`${rowName}-${columnName}`}
                                className="flex aspect-square items-center justify-center rounded-2xl border border-white/8 text-sm font-semibold text-white"
                                style={{ background: heatColor(value) }}
                              >
                                {value.toFixed(2)}
                              </div>
                            );
                          })}
                        </>
                      ))}
                    </div>
                  ) : (
                    <div className="chart-frame chart-frame--empty">At least two numeric features are needed to compute correlations.</div>
                  )}
                </CardContent>
              </Card>

              <Card className="premium-panel min-w-0 border-border/50">
                <CardHeader>
                  <CardTitle className="font-display text-xl sm:text-2xl tracking-tight">Pair Plot Preview</CardTitle>
                  <CardDescription>
                    Small scatter previews for the first numeric feature pairs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis?.pairPlots.length ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {analysis.pairPlots.map((plot) => (
                        <div key={`${plot.xKey}-${plot.yKey}`} className="chart-frame h-[180px] p-3">
                          <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            <span>{plot.xKey}</span>
                            <span>{plot.yKey}</span>
                          </div>
                          <ResponsiveContainer width="100%" height="88%">
                            <ScatterChart margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                              <XAxis type="number" dataKey="x" hide />
                              <YAxis type="number" dataKey="y" hide />
                              <Tooltip contentStyle={{ background: "#09111f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
                              <Scatter data={plot.points} fill="#93b9ff" />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="chart-frame chart-frame--empty">Three numeric features unlock the pair plot preview.</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.65, delay: 0.08 }}
              className="grid min-w-0 gap-6 lg:grid-cols-2"
            >
              <Card className="premium-panel min-w-0 border-border/50">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2 text-xl sm:text-2xl tracking-tight">
                    <Activity className="h-5 w-5 text-primary" />
                    Feature Scatter
                  </CardTitle>
                  <CardDescription>
                    First two numeric features from the uploaded CSV.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {preview?.scatter.length ? (
                    <div className="chart-frame h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
                          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                          <XAxis type="number" dataKey={preview.featureNames[0]} stroke="rgba(255,255,255,0.55)" tickLine={false} />
                          <YAxis type="number" dataKey={preview.featureNames[1] ?? preview.featureNames[0]} stroke="rgba(255,255,255,0.55)" tickLine={false} />
                          <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#09111f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
                          <Scatter data={preview.scatter} fill="#6ed9c5" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="chart-frame chart-frame--empty">Upload a CSV to unlock the preview visuals.</div>
                  )}
                </CardContent>
              </Card>

              <Card className="premium-panel min-w-0 border-border/50">
                <CardHeader>
                  <CardTitle className="font-display text-xl sm:text-2xl tracking-tight">Target View</CardTitle>
                  <CardDescription>
                    Class distribution for labels or target trend for numeric outputs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {preview?.targetDistribution.length ? (
                    <div className="chart-frame h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {preview.regressionTrend.length ? (
                          <LineChart data={preview.regressionTrend} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="index" stroke="rgba(255,255,255,0.55)" tickLine={false} />
                            <YAxis stroke="rgba(255,255,255,0.55)" tickLine={false} />
                            <Tooltip contentStyle={{ background: "#09111f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
                            <Line type="monotone" dataKey="value" stroke="#f4b66a" strokeWidth={3} dot={false} />
                          </LineChart>
                        ) : (
                          <BarChart data={preview.targetDistribution} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.55)" tickLine={false} />
                            <YAxis stroke="rgba(255,255,255,0.55)" tickLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={{ background: "#09111f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
                            <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                              {preview.targetDistribution.map((entry, index) => (
                                <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="chart-frame chart-frame--empty">The target visual appears once the CSV is parsed.</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="grid gap-6 lg:grid-cols-2"
            >
              <Card className="premium-panel min-w-0 border-border/50">
                <CardHeader>
                  <CardTitle className="font-display text-xl sm:text-2xl tracking-tight">Candidate Leaderboard</CardTitle>
                  <CardDescription>
                    Validation and training metrics for every tabular candidate currently available in the C++ backend.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result?.candidates.length ? (
                    <div className="chart-frame h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={result.candidates} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
                          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.55)" tickLine={false} />
                          <YAxis stroke="rgba(255,255,255,0.55)" tickLine={false} />
                          <Tooltip contentStyle={{ background: "#09111f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
                          <Legend />
                          <Bar dataKey="train_metric" name="Train" fill="#91b8ff" radius={[12, 12, 0, 0]} />
                          <Bar dataKey="validation_metric" name="Validation" fill="#6ed9c5" radius={[12, 12, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="chart-frame chart-frame--empty">Train the dataset to see which model wins.</div>
                  )}
                </CardContent>
              </Card>

              <Card className="premium-panel border-border/50">
                <CardHeader>
                  <CardTitle className="font-display text-xl sm:text-2xl tracking-tight">Training Curve</CardTitle>
                  <CardDescription>
                    Loss history for the final best model retrained on the full dataset.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lossChartData.length ? (
                    <div className="chart-frame h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lossChartData} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
                          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="epoch" stroke="rgba(255,255,255,0.55)" tickLine={false} />
                          <YAxis stroke="rgba(255,255,255,0.55)" tickLine={false} />
                          <Tooltip contentStyle={{ background: "#09111f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
                          <Line type="monotone" dataKey="loss" stroke="#f4b66a" strokeWidth={3.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : isTraining ? (
                    <div className="chart-frame chart-frame--empty">Training is in progress. The loss curve will appear when the run finishes.</div>
                  ) : result ? (
                    <div className="chart-frame chart-frame--empty">
                      {supportsLossCurve(result.best_model)
                        ? "Training finished, but no loss history was returned by the backend."
                        : `${prettyName(result.best_model)} does not produce an epoch-by-epoch loss curve.`}
                    </div>
                  ) : (
                    <div className="chart-frame chart-frame--empty">Start a training run to generate the model curve.</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.65, delay: 0.15 }}
            >
              <Card className="premium-panel border-border/50">
                <CardHeader>
                  <CardTitle className="font-display text-xl sm:text-2xl tracking-tight">Dataset Table Preview</CardTitle>
                  <CardDescription>
                    A compact preview of the parsed rows before the full C++ training run.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {preview?.rows.length ? (
                    <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] border-collapse text-left">
                          <thead className="bg-white/[0.03]">
                            <tr>
                              {preview.featureNames.slice(0, 3).map((name) => (
                                <th key={name} className="px-4 py-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                                  {name}
                                </th>
                              ))}
                              <th className="px-4 py-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                                {preview.targetName}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {preview.rows.map((row, index) => (
                              <tr key={`${String(row.row)}-${index}`} className="border-t border-white/6 bg-black/[0.14]">
                                {preview.featureNames.slice(0, 3).map((name) => (
                                  <td key={name} className="px-4 py-4 text-sm text-foreground/90">
                                    {String(row[name])}
                                  </td>
                                ))}
                                <td className="px-4 py-4 text-sm font-medium text-primary">
                                  {String(row[preview.targetName])}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">A table preview will appear after you load a CSV file.</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MLWorkbenchSection;
