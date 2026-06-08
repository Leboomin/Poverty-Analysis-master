import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  Database,
  LineChart,
  Map,
  Target,
  Workflow,
} from 'lucide-react';
import { Layout } from './components/Layout';
import { Card, Headline, Label } from './components/UI';

const sourceRows = [
  {
    source: 'Statistics Mauritius',
    dataUsed: 'Official poverty reports, household poverty indicators, and cleaned poverty workbooks.',
    whyChosen:
      'This is the main official source for Mauritius poverty measurement, so it provides the most credible national trend values and demographic poverty breakdowns.',
  },
  {
    source: 'World Bank',
    dataUsed: 'Macroeconomic indicators such as GDP, unemployment, inflation, and supporting development variables.',
    whyChosen:
      'These indicators provide external economic context and make it possible to compare poverty changes with broader development conditions.',
  },
  {
    source: 'RDI datasets',
    dataUsed: 'District, ward, and village-level Relative Development Index values and comparison files.',
    whyChosen:
      'These files support regional analysis and help explain spatial inequality beyond the national poverty average.',
  },
];

const cleaningSteps = [
  'Column names and worksheet fields were standardized so values from different files could be merged consistently.',
  'District and area names were normalized to solve spelling, case, and accent differences before regional joins.',
  'Time-series values were reformatted into consistent period labels such as 1996/97, 2001/02, and 2023.',
  'Irrelevant, blank, or incomplete rows were excluded when they could not support analysis safely.',
  'Selected outputs were reshaped into long-format and API-friendly structures for use in the dashboard, analytics, and map pages.',
];

const capabilities = [
  'Poverty trends across survey years',
  'Indicator comparison between poverty and macroeconomic variables',
  'Correlation analysis for exploratory relationships',
  'Regression insights using the cleaned regression dataset',
  'Regional and district-level RDI analysis',
  'Map-based insights for geographic interpretation',
];

const policyUses = [
  'Government agencies can identify which population groups and regions remain most exposed to poverty.',
  'NGOs can target community interventions toward children, unemployed groups, and low-RDI areas.',
  'Researchers and students can use the platform to compare trends, test relationships, and review supporting datasets in one place.',
  'Decision-makers can use the system to move from national averages toward more targeted regional and demographic action.',
];

const evaluationPoints = [
  {
    title: 'Target Users',
    detail: 'Students, researchers, policymakers, and development practitioners who need a structured view of poverty data in Mauritius.',
  },
  {
    title: 'Accuracy',
    detail: 'The system is evaluated by how closely the presented values match official Statistics Mauritius and cleaned supporting datasets.',
  },
  {
    title: 'Usability',
    detail: 'The interface is evaluated by whether users can move between dashboard, analytics, datasets, and maps without needing raw spreadsheets.',
  },
  {
    title: 'Clarity',
    detail: 'The project is evaluated by whether charts, explanations, and methodology sections are understandable to non-specialist users.',
  },
  {
    title: 'Regression Fit',
    detail: 'The current regression workflow reports an R² of about 0.90, which indicates a strong fit within the small available time series, while still requiring careful interpretation.',
  },
];

const methodCards = [
  {
    icon: LineChart,
    title: 'Trend Analysis',
    description:
      'Poverty rates, number of persons in poverty, and rolling averages are studied across survey years to identify change over time.',
  },
  {
    icon: BarChart3,
    title: 'Correlation Analysis',
    description:
      'Correlation is used to explore how poverty moves with GDP, unemployment, inflation, and Gini before drawing stronger model-based conclusions.',
  },
  {
    icon: Target,
    title: 'Regression Analysis',
    description:
      'Regression is used to estimate how selected economic variables relate to poverty and to compare actual and predicted poverty values.',
  },
  {
    icon: Map,
    title: 'Regional Analysis',
    description:
      'RDI and district-level comparisons are used to highlight spatial inequality and identify areas that perform better or worse than others.',
  },
];

const Methodology = () => {
  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="text-center">
          <Label className="mb-4 block">Research Methodology</Label>
          <Headline level={1} className="mb-6">Methodology, Data Sources, and Evaluation</Headline>
          <p className="mx-auto max-w-4xl text-lg leading-relaxed text-on-surface/60">
            This project investigates poverty in Mauritius through official poverty indicators, supporting economic variables,
            Relative Development Index data, statistical analysis, and a dashboard-based delivery layer designed to make the
            results easier to interpret and reuse.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="p-6">
            <div className="mb-4 w-fit rounded-xl bg-primary/10 p-3 text-primary">
              <Database size={22} />
            </div>
            <Headline level={3} className="mb-3">Data Sources</Headline>
            <p className="text-sm leading-relaxed text-on-surface/60">
              The system combines official poverty statistics, macroeconomic indicators, and regional development data.
            </p>
          </Card>
          <Card className="p-6">
            <div className="mb-4 w-fit rounded-xl bg-primary/10 p-3 text-primary">
              <Workflow size={22} />
            </div>
            <Headline level={3} className="mb-3">Data Pipeline</Headline>
            <p className="text-sm leading-relaxed text-on-surface/60">
              Raw files are cleaned, standardized, merged, and transformed into backend-ready and dashboard-ready structures.
            </p>
          </Card>
          <Card className="p-6">
            <div className="mb-4 w-fit rounded-xl bg-primary/10 p-3 text-primary">
              <BarChart3 size={22} />
            </div>
            <Headline level={3} className="mb-3">Analysis Methods</Headline>
            <p className="text-sm leading-relaxed text-on-surface/60">
              The analytical layer covers trends, correlation, regression, and regional comparison.
            </p>
          </Card>
          <Card className="p-6">
            <div className="mb-4 w-fit rounded-xl bg-primary/10 p-3 text-primary">
              <Target size={22} />
            </div>
            <Headline level={3} className="mb-3">Evaluation</Headline>
            <p className="text-sm leading-relaxed text-on-surface/60">
              The platform is evaluated for accuracy, clarity, usability, and value to real decision-making contexts.
            </p>
          </Card>
        </div>

        <Card className="p-6 sm:p-8">
          <Headline level={2} className="mb-5">Data Sources & Justification</Headline>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-on-surface/45">
                  <th className="px-4">Source</th>
                  <th className="px-4">Data Used</th>
                  <th className="px-4">Why Chosen</th>
                </tr>
              </thead>
              <tbody>
                {sourceRows.map((row) => (
                  <tr key={row.source} className="rounded-2xl bg-surface-container-low">
                    <td className="rounded-l-2xl px-4 py-4 align-top text-sm font-semibold text-on-surface">
                      {row.source}
                    </td>
                    <td className="px-4 py-4 align-top text-sm leading-relaxed text-on-surface/65">
                      {row.dataUsed}
                    </td>
                    <td className="rounded-r-2xl px-4 py-4 align-top text-sm leading-relaxed text-on-surface/65">
                      {row.whyChosen}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="p-6 sm:p-8">
            <Headline level={2} className="mb-5">Data Preparation and Merging</Headline>
            <div className="space-y-5">
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-on-surface/55">Why These Sources</h3>
                <p className="text-sm leading-relaxed text-on-surface/65">
                  Statistics Mauritius gives the project an official national poverty baseline, World Bank indicators add
                  economic context, and RDI data extends the analysis into the regional dimension. Together they support
                  both statistical interpretation and policy relevance.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-on-surface/55">Data Cleaning Steps</h3>
                <div className="space-y-3">
                  {cleaningSteps.map((step) => (
                    <div key={step} className="flex gap-3 rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600" />
                      <p className="text-sm leading-relaxed text-on-surface/65">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-on-surface/55">Data Merging</h3>
                <p className="text-sm leading-relaxed text-on-surface/65">
                  The merged analytical dataset combines the poverty rate with selected explanatory variables such as GDP,
                  unemployment, inflation, and Gini so that trend, correlation, and regression analysis can be carried out
                  in one consistent structure.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <Headline level={2} className="mb-5">Analysis Methods</Headline>
            <div className="grid gap-4 sm:grid-cols-2">
              {methodCards.map((method) => {
                const Icon = method.icon;
                return (
                  <div key={method.title} className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
                    <div className="mb-3 w-fit rounded-xl bg-primary/10 p-3 text-primary">
                      <Icon size={20} />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{method.title}</h3>
                    <p className="text-sm leading-relaxed text-on-surface/65">{method.description}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="p-6 sm:p-8">
            <Headline level={2} className="mb-5">Analysis Capabilities</Headline>
            <div className="grid gap-3">
              {capabilities.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4">
                  <CheckCircle2 size={16} className="shrink-0 text-green-600" />
                  <span className="text-sm font-medium text-on-surface/75">{item}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <Headline level={2} className="mb-5">Policy / Actionable Insights</Headline>
            <div className="space-y-4">
              {policyUses.map((item) => (
                <div key={item} className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4">
                  <p className="text-sm leading-relaxed text-on-surface/65">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6 sm:p-8">
          <Headline level={2} className="mb-5">Evaluation</Headline>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {evaluationPoints.map((item) => (
              <div key={item.title} className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-on-surface/65">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Methodology;
