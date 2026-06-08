import React from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Layers3,
  Sigma,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  AnalyticsResponse,
  CorrelationMatrixCell,
  PovertyClusterCategory,
  PovertyPredictionResponse,
  ScatterSeries,
} from '../../shared/api';
import { fetchAnalytics, fetchAnalyticsPrediction } from './lib/api';
import { Layout } from './components/Layout';
import { Card, Headline, Label } from './components/UI';

function heatmapColor(value: number) {
  if (value >= 0) {
    const opacity = Math.min(Math.abs(value), 1);
    return `rgba(11, 77, 187, ${0.18 + opacity * 0.7})`;
  }

  const opacity = Math.min(Math.abs(value), 1);
  return `rgba(180, 83, 9, ${0.18 + opacity * 0.7})`;
}

function getMatrixValue(matrix: CorrelationMatrixCell[], row: string, column: string) {
  return matrix.find((cell) => cell.row === row && cell.column === column)?.value ?? null;
}

function compactLabel(label: string) {
  return label
    .replace('GDP per capita', 'GDP\nper capita')
    .replace('UNEMPLOYMENT', 'UNEMPLOY-\nMENT')
    .replace('INFLATION', 'INFLA-\nTION')
    .replace(' ', '\n');
}

function getNumericDomain(values: number[], paddingRatio = 0.12) {
  if (values.length === 0) {
    return [0, 1] as const;
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const span = maxValue - minValue || Math.max(Math.abs(minValue) * 0.1, 1);
  const padding = span * paddingRatio;

  return [Number((minValue - padding).toFixed(3)), Number((maxValue + padding).toFixed(3))] as const;
}

function getCorrelationSummary(
  series: ScatterSeries,
  correlation: number | null,
  coefficient: number | null,
) {
  const direction = correlation === null ? 'mixed' : correlation >= 0 ? 'positive' : 'negative';
  const strength =
    correlation === null
      ? 'limited'
      : Math.abs(correlation) >= 0.7
        ? 'strong'
        : Math.abs(correlation) >= 0.4
          ? 'moderate'
          : 'weak';

  const relationText =
    direction === 'positive'
      ? `Higher ${series.label.toLowerCase()} tends to align with higher poverty in this small series.`
      : direction === 'negative'
        ? `Higher ${series.label.toLowerCase()} tends to align with lower poverty in this small series.`
        : `The relationship is not especially clear from the available points.`;

  const coefficientText =
    coefficient === null
      ? 'No multiple-regression coefficient is available for this variable in the current response.'
      : `The multiple-regression coefficient is ${coefficient.toFixed(4)}, which should be read alongside the scatter trend rather than on its own.`;

  return {
    title: `${strength.charAt(0).toUpperCase()}${strength.slice(1)} ${direction === 'mixed' ? '' : direction} relationship`.trim(),
    relationText,
    coefficientText,
  };
}

function getVariableInsight(
  series: ScatterSeries,
  correlation: number | null,
  coefficient: number | null,
) {
  const relationship =
    correlation === null
      ? 'unclear'
      : Math.abs(correlation) >= 0.7
        ? correlation > 0
          ? 'strong positive'
          : 'strong negative'
        : Math.abs(correlation) >= 0.4
          ? correlation > 0
            ? 'moderate positive'
            : 'moderate negative'
          : correlation > 0
            ? 'weak positive'
            : 'weak negative';

  const detailByVariable: Record<string, { deduction: string; implication: string }> = {
    GDP: {
      deduction:
        'In this small series, poverty rises alongside GDP per capita instead of falling automatically. That suggests economic growth on its own did not guarantee lower relative poverty across the survey years.',
      implication:
        'A policy takeaway is that growth needs distributional reach. If incomes rise unevenly, relative poverty can remain visible even when national output improves.',
    },
    UNEMPLOYMENT: {
      deduction:
        'The unemployment relationship is negative but fairly weak in this dataset, which means it does not behave like the dominant standalone driver of relative poverty across these years.',
      implication:
        'This points to a broader poverty story than labor-market status alone. Household composition, inequality, inflation pressure, and transfer systems likely matter too.',
    },
    INFLATION: {
      deduction:
        'Inflation shows a moderate negative association here, which should be interpreted carefully because the time series is short and the survey years are widely spaced.',
      implication:
        'The chart is most useful as a comparative signal, not as proof that inflation reduces poverty. In practice, inflation still affects purchasing power and should be read alongside the poverty-line changes.',
    },
    GINI: {
      deduction:
        'Gini has the clearest positive association with poverty in this analysis. As inequality rises, the poverty rate also tends to be higher in the observed survey years.',
      implication:
        'This strengthens the argument that poverty in Mauritius is not only about overall growth, but also about how evenly income is distributed across households.',
    },
  };

  const variableDetail = detailByVariable[series.variable] ?? {
    deduction: 'This chart shows how the selected variable moves in relation to poverty across the observed survey years.',
    implication: 'The visual should be read as an exploratory relationship rather than as proof of direct causation.',
  };

  return {
    relationship,
    deduction: variableDetail.deduction,
    implication: variableDetail.implication,
    coefficientText:
      coefficient === null
        ? 'No coefficient is available for this variable in the current model output.'
        : `In the multiple-regression model, the coefficient is ${coefficient.toFixed(4)}. This coefficient helps show the variable's direction and contribution when the other variables are considered together.`,
  };
}

function getClusterBadgeClasses(category: PovertyClusterCategory) {
  if (category === 'Low') {
    return 'bg-orange-600 text-white border border-orange-700 dark:bg-orange-500 dark:border-orange-400/50 dark:text-white';
  }

  if (category === 'Medium') {
    return 'bg-amber-500 text-slate-950 border border-amber-600 dark:bg-amber-400 dark:border-amber-300/50 dark:text-slate-950';
  }

  return 'bg-emerald-600 text-white border border-emerald-700 dark:bg-emerald-500 dark:border-emerald-400/50 dark:text-white';
}

function getClusterDisplayLabel(category: PovertyClusterCategory) {
  if (category === 'Low') {
    return 'High Vulnerability';
  }

  if (category === 'Medium') {
    return 'Moderate Vulnerability';
  }

  return 'Low Vulnerability';
}

function getClusterCardText(category: PovertyClusterCategory) {
  if (category === 'Low') {
    return 'This district is more vulnerable to poverty because its development level is relatively lower in the current RDI grouping.';
  }

  if (category === 'Medium') {
    return 'This district sits in the middle vulnerability band, showing mixed development conditions compared with the rest of the country.';
  }

  return 'This district is relatively better developed and therefore less vulnerable to poverty in the current grouping.';
}

function getGroupingInsight(
  records: Array<{ region: string; category: PovertyClusterCategory }>,
) {
  const highVulnerability = records
    .filter((record) => record.category === 'Low')
    .slice(0, 2)
    .map((record) => record.region);
  const lowVulnerability = records
    .filter((record) => record.category === 'High')
    .slice(0, 2)
    .map((record) => record.region);

  const highText = highVulnerability.length > 0 ? highVulnerability.join(' and ') : 'the lower-ranked districts';
  const lowText = lowVulnerability.length > 0 ? lowVulnerability.join(' and ') : 'the stronger-performing districts';

  return `Districts such as ${highText} fall into the higher vulnerability group, indicating comparatively lower development levels. By contrast, districts such as ${lowText} are better positioned and fall into the lower vulnerability group.`;
}

function getCorrelationInterpretation(variable: string, value: number) {
  const direction = value >= 0 ? 'positive' : 'negative';
  const magnitude = Math.abs(value);
  const strength = magnitude >= 0.7 ? 'strong' : magnitude >= 0.4 ? 'moderate' : 'weak';
  const labelMap: Record<string, string> = {
    GDP: 'GDP',
    UNEMPLOYMENT: 'unemployment',
    INFLATION: 'inflation',
    GINI: 'Gini',
  };
  const label = labelMap[variable] ?? variable.toLowerCase();

  return `${label} shows a ${strength} ${direction} correlation with poverty.`;
}

function getTrendInsightLine(
  trendInsights: NonNullable<AnalyticsResponse['trendInsights']>,
) {
  if (trendInsights.overallDirection === 'decreasing') {
    return `Poverty shows an overall declining pattern across the observed periods, although the survey series still contains noticeable interim fluctuations.`;
  }

  if (trendInsights.overallDirection === 'increasing') {
    return `Poverty edges upward overall across the observed periods, though the series also includes meaningful variation between survey years.`;
  }

  return `Poverty remains broadly stable across the observed periods, with only modest net change between the first and latest survey points.`;
}

function getRegionalInsightLine(
  regionalInsights: NonNullable<AnalyticsResponse['regionalInsights']>,
) {
  return `Regional disparities remain visible, with ${regionalInsights.bottomDistricts[0]?.region ?? 'lower-ranked districts'} at the more vulnerable end of the distribution and ${regionalInsights.topDistricts[0]?.region ?? 'better-performing districts'} showing stronger development conditions.`;
}

function getIndicatorInsightLine(correlations: AnalyticsResponse['correlations']) {
  const strongest = [...correlations].sort(
    (left, right) => Math.abs(right.correlation) - Math.abs(left.correlation),
  )[0];

  if (!strongest) {
    return 'The available indicators provide a comparative view of how poverty moves alongside the wider socioeconomic environment.';
  }

  return `${strongest.variable} shows the strongest association with poverty in the current indicator set, suggesting that some socioeconomic measures appear more influential than others in this small series.`;
}

function getPredictionInsightLine(prediction: PovertyPredictionResponse) {
  const firstForecast = prediction.forecast[0];
  const lastForecast = prediction.forecast.at(-1);

  if (!firstForecast || !lastForecast) {
    return 'The forecast should be interpreted as a short-term baseline continuation rather than a full scenario model.';
  }

  const direction =
    lastForecast.povertyRate > firstForecast.povertyRate
      ? 'a slight upward drift'
      : lastForecast.povertyRate < firstForecast.povertyRate
        ? 'a slight downward drift'
        : 'a largely flat path';

  return `The forecast indicates ${direction} over the next five years and should be read as a short-term baseline continuation rather than a full scenario model.`;
}

function getGroupingSectionInsight(
  povertyGrouping: NonNullable<AnalyticsResponse['povertyGrouping']>,
) {
  const mostVulnerable = povertyGrouping.records.find((record) => record.category === 'Low');
  const leastVulnerable = [...povertyGrouping.records].reverse().find((record) => record.category === 'High');

  return `The grouping highlights clear district-level differences, with ${mostVulnerable?.region ?? 'the lower-RDI districts'} appearing more vulnerable and ${leastVulnerable?.region ?? 'the higher-RDI districts'} appearing relatively better developed.`;
}

function getDevelopmentContextInsight(
  trendInsights: NonNullable<AnalyticsResponse['trendInsights']>,
  regionalInsights: NonNullable<AnalyticsResponse['regionalInsights']>,
) {
  const directionText =
    trendInsights.overallDirection === 'decreasing'
      ? 'an overall decline in poverty'
      : trendInsights.overallDirection === 'increasing'
        ? 'a slight overall increase in poverty'
        : 'a broadly stable poverty pattern';

  return `The current evidence suggests ${directionText}, while regional development differences remain pronounced between ${regionalInsights.bottomDistricts[0]?.region ?? 'the more vulnerable districts'} and ${regionalInsights.topDistricts[0]?.region ?? 'the stronger-performing districts'}.`;
}

function getDevelopmentPovertyAnalysis(regressionSeries: AnalyticsResponse['regressionSeries']) {
  if (regressionSeries.length === 0) {
    return 'The available series does not yet provide enough matched observations to discuss the poverty-development relationship.';
  }

  const first = regressionSeries[0];
  const last = regressionSeries.at(-1) ?? first;
  const gdpChange = Number((((last.gdp - first.gdp) / first.gdp) * 100).toFixed(1));
  const povertyChange = Number((last.povertyRate - first.povertyRate).toFixed(1));

  if (last.gdp > first.gdp && last.povertyRate >= first.povertyRate) {
    return `Over the observed years, GDP per capita increased by about ${gdpChange}% while poverty changed by ${povertyChange} percentage points. This suggests that stronger development and growth conditions did not automatically translate into lower relative poverty, pointing to the importance of distribution and inclusion.`;
  }

  if (last.gdp > first.gdp && last.povertyRate < first.povertyRate) {
    return `Over the observed years, GDP per capita increased by about ${gdpChange}% while poverty fell by ${Math.abs(povertyChange).toFixed(1)} percentage points. This suggests development progress may have supported better poverty outcomes, although the relationship should still be interpreted cautiously.`;
  }

  return `The combined series shows that poverty and development did not move in a simple one-direction pattern across the observed years. This makes it more defensible to discuss development as an important context for poverty rather than as a single direct cause.`;
}

function getScatterAxisMeta(series: ScatterSeries) {
  const yAxisLabel = 'Poverty rate (%)';

  if (series.variable === 'GDP') {
    return {
      xAxisLabel: 'GDP per capita (USD per person)',
      yAxisLabel,
      formatXTick: (value: number) => value.toLocaleString('en-MU', { maximumFractionDigits: 0 }),
      formatYTick: (value: number) => `${value.toFixed(1)}%`,
      formatXValue: (value: number) => `USD ${value.toLocaleString('en-MU', { maximumFractionDigits: 0 })}`,
      formatYValue: (value: number) => `${value.toFixed(2)}%`,
    };
  }

  if (series.variable === 'UNEMPLOYMENT') {
    return {
      xAxisLabel: 'Unemployment rate (%)',
      yAxisLabel,
      formatXTick: (value: number) => `${value.toFixed(1)}%`,
      formatYTick: (value: number) => `${value.toFixed(1)}%`,
      formatXValue: (value: number) => `${value.toFixed(2)}%`,
      formatYValue: (value: number) => `${value.toFixed(2)}%`,
    };
  }

  if (series.variable === 'INFLATION') {
    return {
      xAxisLabel: 'Inflation rate (%)',
      yAxisLabel,
      formatXTick: (value: number) => `${value.toFixed(1)}%`,
      formatYTick: (value: number) => `${value.toFixed(1)}%`,
      formatXValue: (value: number) => `${value.toFixed(2)}%`,
      formatYValue: (value: number) => `${value.toFixed(2)}%`,
    };
  }

  if (series.variable === 'GINI') {
    return {
      xAxisLabel: 'Gini index',
      yAxisLabel,
      formatXTick: (value: number) => value.toFixed(1),
      formatYTick: (value: number) => `${value.toFixed(1)}%`,
      formatXValue: (value: number) => value.toFixed(2),
      formatYValue: (value: number) => `${value.toFixed(2)}%`,
    };
  }

  return {
    xAxisLabel: series.label,
    yAxisLabel,
    formatXTick: (value: number) => value.toFixed(2),
    formatYTick: (value: number) => `${value.toFixed(1)}%`,
    formatXValue: (value: number) => value.toFixed(2),
    formatYValue: (value: number) => `${value.toFixed(2)}%`,
  };
}

function MiniScatterCard({ series, isMobile }: { series: ScatterSeries; isMobile: boolean }) {
  const xDomain = getNumericDomain(
    [...series.points.map((point) => point.x), ...series.trendLine.map((point) => point.x)],
    0.14,
  );
  const yDomain = getNumericDomain(
    [...series.points.map((point) => point.y), ...series.trendLine.map((point) => point.y)],
    0.18,
  );
  const axisMeta = getScatterAxisMeta(series);

  return (
    <Card className="relative z-10 p-5 sm:p-6" onClick={(event) => event.stopPropagation()}>
      <Headline level={3} className="text-lg">{`Poverty vs ${series.label}`}</Headline>
      <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
        Real observed points with a sampled fitted trend line based on the regression relationship.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-on-surface/50">
        X-axis: {axisMeta.xAxisLabel}. Y-axis: {axisMeta.yAxisLabel}.
      </p>
      <div className="mt-5 h-[220px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: isMobile ? 4 : 8, bottom: 8, left: isMobile ? -18 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
            <XAxis
              type="number"
              dataKey="x"
              domain={xDomain}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              tickFormatter={axisMeta.formatXTick}
              tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={yDomain}
              axisLine={false}
              tickLine={false}
              width={isMobile ? 28 : 40}
              tickFormatter={axisMeta.formatYTick}
              tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value: number, name: string) => [
                typeof value === 'number'
                  ? name === (isMobile ? 'Est.' : 'Estimated path') ||
                    name === (isMobile ? 'Obs.' : 'Observed') ||
                    name === (isMobile ? 'Fit' : 'Trend line')
                    ? axisMeta.formatYValue(value)
                    : axisMeta.formatXValue(value)
                  : value,
                name,
              ]}
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as { period?: string } | undefined;
                return row?.period ? `Observed: ${row.period}` : 'Modeled trend line';
              }}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                backgroundColor: 'var(--app-surface-container-lowest)',
              }}
            />
            {!isMobile && <Legend wrapperStyle={{ fontSize: '11px' }} />}
            <Scatter name={isMobile ? 'Est.' : 'Estimated path'} data={series.interpolatedPoints} fill="rgba(61, 109, 184, 0.35)" />
            <Scatter name={isMobile ? 'Obs.' : 'Observed'} data={series.points} fill="var(--app-primary)" />
            <Scatter
              name={isMobile ? 'Fit' : 'Trend line'}
              data={series.trendLine}
              fill="#b45309"
              line={{ stroke: '#b45309', strokeWidth: 2 }}
              shape={() => null}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

const Analytics = () => {
  const [data, setData] = React.useState<AnalyticsResponse | null>(null);
  const [prediction, setPrediction] = React.useState<PovertyPredictionResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [predictionError, setPredictionError] = React.useState<string | null>(null);
  const [selectedVariable, setSelectedVariable] = React.useState<string | null>(null);
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false,
  );

  React.useEffect(() => {
    let isMounted = true;

    fetchAnalytics()
      .then((response) => {
        if (isMounted) {
          setData(response);
        }
      })
      .catch((requestError: Error) => {
        if (isMounted) {
          setError(requestError.message);
        }
      });

    fetchAnalyticsPrediction()
      .then((response) => {
        if (isMounted) {
          setPrediction(response);
        }
      })
      .catch((requestError: Error) => {
        if (isMounted) {
          setPredictionError(requestError.message);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);

    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  const regressionOverview = data?.regressionOverview ?? {
    specification: 'Regression overview is loading from the backend.',
    interpretation: 'Restart the backend/dev server if these analytics fields do not appear yet.',
    strongestDriver: 'The frontend can still render the page while backend fields catch up.',
  };
  const actualPredictedSeries = React.useMemo(() => data?.actualPredictedSeries ?? [], [data]);
  const correlationMatrix = React.useMemo(() => data?.correlationMatrix ?? [], [data]);
  const correlationEntries = React.useMemo(() => data?.correlations ?? [], [data]);
  const coefficientEntries = React.useMemo(() => data?.coefficients ?? [], [data]);
  const demographicSections = React.useMemo(() => data?.demographicBreakdowns ?? [], [data]);
  const predictionSeries = React.useMemo(() => data?.predictionSeries ?? [], [data]);
  const regressionSeries = React.useMemo(() => data?.regressionSeries ?? [], [data]);
  const scatterSeriesList = React.useMemo(() => data?.scatterSeries ?? [], [data]);
  const trendInsights = React.useMemo(() => data?.trendInsights ?? null, [data]);
  const regionalInsights = React.useMemo(() => data?.regionalInsights ?? null, [data]);
  const povertyGrouping = React.useMemo(() => data?.povertyGrouping ?? null, [data]);
  const localPovertyEvidence = React.useMemo(() => data?.localPovertyEvidence ?? null, [data]);
  const trendInsightLine = React.useMemo(
    () => (trendInsights ? getTrendInsightLine(trendInsights) : null),
    [trendInsights],
  );
  const regionalInsightLine = React.useMemo(
    () => (regionalInsights ? getRegionalInsightLine(regionalInsights) : null),
    [regionalInsights],
  );
  const indicatorInsightLine = React.useMemo(
    () => getIndicatorInsightLine(correlationEntries),
    [correlationEntries],
  );
  const predictionInsightLine = React.useMemo(
    () => (prediction ? getPredictionInsightLine(prediction) : null),
    [prediction],
  );
  const groupingInsightLine = React.useMemo(
    () => (povertyGrouping ? getGroupingSectionInsight(povertyGrouping) : null),
    [povertyGrouping],
  );
  const developmentContextInsight = React.useMemo(
    () =>
      trendInsights && regionalInsights
        ? getDevelopmentContextInsight(trendInsights, regionalInsights)
        : null,
    [trendInsights, regionalInsights],
  );
  const developmentPovertyChartData = React.useMemo(
    () =>
      regressionSeries
        .map((point) => ({
          period: point.period,
          povertyRate: Number(point.povertyRate.toFixed(1)),
          gdp: Number(point.gdp.toFixed(0)),
        })),
    [regressionSeries],
  );
  const developmentPovertyAnalysis = React.useMemo(
    () => getDevelopmentPovertyAnalysis(regressionSeries),
    [regressionSeries],
  );

  React.useEffect(() => {
    if (!data) {
      return;
    }

    setSelectedVariable((current) => current ?? scatterSeriesList[0]?.variable ?? correlationEntries[0]?.variable ?? null);
  }, [data, scatterSeriesList, correlationEntries]);

  const scatterSeries =
    scatterSeriesList.find((series) => series.variable === selectedVariable) ??
    scatterSeriesList[0] ??
    null;
  const activeCorrelation =
    correlationEntries.find((entry) => entry.variable === selectedVariable) ??
    correlationEntries[0] ??
    null;
  const activeCoefficient =
    coefficientEntries.find((entry) => entry.variable.toUpperCase() === (selectedVariable ?? '').toUpperCase()) ??
    null;
  const heatmapLabels = React.useMemo(() => {
    if (!correlationMatrix.length) {
      return [];
    }

    return Array.from(new Set(correlationMatrix.flatMap((cell) => [cell.row, cell.column])));
  }, [correlationMatrix]);
  const galleryScatterSeries = React.useMemo(
    () =>
      [
        scatterSeriesList.find((series) => series.variable === 'GDP'),
        scatterSeriesList.find((series) => series.variable === 'UNEMPLOYMENT'),
        scatterSeriesList.find((series) => series.variable === 'INFLATION'),
        scatterSeriesList.find((series) => series.variable === 'GINI'),
      ].filter((series): series is ScatterSeries => Boolean(series)),
    [scatterSeriesList],
  );
  const giniExplanation =
    'The Gini index is a common measure of income inequality. A higher Gini value means income is more unevenly distributed across households, while a lower value means incomes are more equal.';
  const activeInsight = React.useMemo(
    () =>
      scatterSeries
        ? getVariableInsight(
            scatterSeries,
            activeCorrelation?.correlation ?? null,
            activeCoefficient?.coefficient ?? null,
          )
        : null,
    [scatterSeries, activeCorrelation, activeCoefficient],
  );
  const explorerXDomain = React.useMemo(
    () =>
      scatterSeries
        ? getNumericDomain(
            [...scatterSeries.points.map((point) => point.x), ...scatterSeries.trendLine.map((point) => point.x)],
            0.14,
          )
        : ([0, 1] as const),
    [scatterSeries],
  );
  const explorerYDomain = React.useMemo(
    () =>
      scatterSeries
        ? getNumericDomain(
            [...scatterSeries.points.map((point) => point.y), ...scatterSeries.trendLine.map((point) => point.y)],
            0.18,
          )
        : ([0, 1] as const),
    [scatterSeries],
  );
  const scatterAxisMeta = React.useMemo(
    () => (scatterSeries ? getScatterAxisMeta(scatterSeries) : null),
    [scatterSeries],
  );

  return (
    <Layout>
      <div className="space-y-10">
        <section className="max-w-4xl">
          <Label className="mb-3 block">Analytical Results</Label>
          <Headline level={1} className="mb-4">Regression, Heatmaps, and Poverty Analytics</Headline>
          <p className="text-on-surface/60 text-lg leading-relaxed">
            This page uses real chart data from the cleaned Mauritius poverty workbooks. Observed points come from the actual series, while denser fitted trend samples are modeled from the statistical relationships so the visuals feel concrete without pretending there were more survey years than we observed.
          </p>
        </section>

        {error && (
          <Card className="border border-error/30">
            <Headline level={3} className="mb-2">Analytics unavailable</Headline>
            <p className="text-sm text-on-surface/60">{error}</p>
          </Card>
        )}

        {predictionError && (
          <Card className="border border-error/20">
            <Headline level={3} className="mb-2">Prediction unavailable</Headline>
            <p className="text-sm text-on-surface/60">{predictionError}</p>
          </Card>
        )}

        {data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
              <Card className="p-5 sm:p-6 sm:col-span-2 xl:col-span-2">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <BarChart3 size={20} />
                  <Label className="text-primary/70">Analysis Title</Label>
                </div>
                <Headline level={3}>{data.title}</Headline>
              </Card>

              <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <Sigma size={20} />
                  <Label className="text-primary/70">Model R^2</Label>
                </div>
                <p className="text-4xl font-display font-bold text-primary">{data.modelScore.toFixed(2)}</p>
              </Card>

              <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <Activity size={20} />
                  <Label className="text-primary/70">Observed Years</Label>
                </div>
                <p className="text-4xl font-display font-bold text-primary">{regressionSeries.length}</p>
              </Card>
            </div>

            <Card className="overflow-hidden p-5 sm:p-8">
              <Headline level={2} className="mb-4">Summary</Headline>
              <p className="text-sm text-on-surface/60 leading-relaxed">{data.summary}</p>
              <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Regression Setup</p>
                <p className="mt-3 text-sm font-medium text-on-surface">{regressionOverview.specification}</p>
                <p className="mt-3 text-sm leading-relaxed text-on-surface/60">{regressionOverview.interpretation}</p>
                <p className="mt-3 text-sm leading-relaxed text-primary">{regressionOverview.strongestDriver}</p>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {data.keyFindings.map((finding) => (
                  <div key={finding} className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4">
                    <p className="text-sm leading-relaxed text-on-surface/70">{finding}</p>
                  </div>
                ))}
              </div>
            </Card>

            {trendInsights && (
              <Card className="p-5 sm:p-8">
                <Headline level={2} className="mb-3">Trend Insights</Headline>
                <p className="text-sm leading-relaxed text-on-surface/60">
                  These derived metrics summarize how the poverty rate has changed across the observed survey periods, highlighting direction, extremes, and average level.
                </p>
                <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Interpretation</p>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface/60">{trendInsightLine}</p>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Overall Change</p>
                    <p className="mt-2 text-3xl font-display font-bold text-primary">{trendInsights.overallChange.toFixed(2)} pts</p>
                    <p className="mt-2 text-sm text-on-surface/60">{trendInsights.overallPercentChange.toFixed(2)}% from first to latest period</p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Average Rate</p>
                    <p className="mt-2 text-3xl font-display font-bold text-primary">{trendInsights.averageRate.toFixed(2)}%</p>
                    <p className="mt-2 text-sm text-on-surface/60">Mean poverty rate across all observed periods</p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Minimum</p>
                    <p className="mt-2 text-3xl font-display font-bold text-primary">{trendInsights.minPoint.value.toFixed(1)}%</p>
                    <p className="mt-2 text-sm text-on-surface/60">{trendInsights.minPoint.period}</p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Maximum</p>
                    <p className="mt-2 text-3xl font-display font-bold text-primary">{trendInsights.maxPoint.value.toFixed(1)}%</p>
                    <p className="mt-2 text-sm text-on-surface/60">{trendInsights.maxPoint.period}</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Trend Summary</p>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface/60">{trendInsights.summary}</p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Recent Step Changes</p>
                    <div className="mt-3 space-y-2">
                      {trendInsights.consecutiveChanges.slice(-3).map((change) => (
                        <div key={`${change.fromPeriod}-${change.toPeriod}`} className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-on-surface/60">{change.fromPeriod} to {change.toPeriod}</span>
                          <span className="font-semibold text-primary">{change.percentChange.toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {regionalInsights && (
              <Card className="p-5 sm:p-8">
                <Headline level={2} className="mb-3">Regional Insights</Headline>
                <p className="text-sm leading-relaxed text-on-surface/60">
                  Lower RDI values indicate higher vulnerability to poverty, while higher RDI values indicate better development conditions and lower vulnerability.
                </p>
                <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Key Insight</p>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface/60">{regionalInsightLine}</p>
                </div>
                <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr]">
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Most Vulnerable Districts</p>
                    <div className="mt-4 space-y-3">
                      {regionalInsights.bottomDistricts.map((district) => (
                        <div key={`bottom-${district.region}`} className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">{district.region}</p>
                            <p className="text-xs text-on-surface/55">Rank {district.rank}</p>
                          </div>
                          <span className="text-sm font-semibold text-primary">{district.value.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Best Performing Districts</p>
                    <div className="mt-4 space-y-3">
                      {regionalInsights.topDistricts.map((district) => (
                        <div key={`top-${district.region}`} className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">{district.region}</p>
                            <p className="text-xs text-on-surface/55">Rank {district.rank}</p>
                          </div>
                          <span className="text-sm font-semibold text-primary">{district.value.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Development Gap</p>
                    <p className="mt-2 text-3xl font-display font-bold text-primary">{regionalInsights.gapValue.toFixed(1)}</p>
                    <p className="mt-2 text-sm text-on-surface/60">{regionalInsights.gapPercent.toFixed(2)}% gap between highest and lowest RDI</p>
                    <p className="mt-4 text-sm leading-relaxed text-on-surface/60">{regionalInsights.summary}</p>
                  </div>
                </div>
              </Card>
            )}

            {trendInsights && regionalInsights && povertyGrouping && prediction && (
              <Card className="p-5 sm:p-8">
                <Headline level={2} className="mb-3">Poverty and Development</Headline>
                <p className="text-sm leading-relaxed text-on-surface/60">
                  This section compares poverty with a matched development trend over time using GDP per capita as the year-based development indicator. It should be read as a contextual relationship rather than as proof of a single direct causal pathway.
                </p>
                <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Key Insight</p>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface/60">{developmentContextInsight}</p>
                </div>
                <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-low p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Development Trend Compared with Poverty Rate</p>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
                    The chart below merges the poverty series with GDP per capita across the same survey years so the relationship can be read on one timeline.
                  </p>
                  <div className="mt-5 h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={developmentPovertyChartData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                        <XAxis
                          dataKey="period"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }}
                        />
                        <YAxis
                          yAxisId="left"
                          width={isMobile ? 34 : 46}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          width={isMobile ? 44 : 58}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            name === 'Poverty rate' ? `${value.toFixed(1)}%` : `USD ${value.toLocaleString('en-MU')}`,
                            name,
                          ]}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            backgroundColor: 'var(--app-surface-container-lowest)',
                          }}
                        />
                        {!isMobile && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="povertyRate"
                          name="Poverty rate"
                          stroke="var(--app-primary)"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="gdp"
                          name="GDP per capita"
                          stroke="#0f766e"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Interpretation</p>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface/60">{developmentPovertyAnalysis}</p>
                    <p className="mt-3 text-sm leading-relaxed text-on-surface/60">
                      The regional RDI evidence elsewhere on the page still matters here: it shows that development is uneven across districts, so national growth should not be assumed to reduce poverty evenly across all parts of Mauritius.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-5 sm:p-8">
              <Headline level={2} className="mb-3">Indicator Relationships</Headline>
              <p className="text-sm leading-relaxed text-on-surface/60">
                These correlations show how the poverty rate moves with the main socioeconomic indicators used in the regression dataset. They should be read as relationship signals, not proof of causation.
              </p>
              <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Interpretation</p>
                <p className="mt-2 text-sm leading-relaxed text-on-surface/60">{indicatorInsightLine}</p>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {correlationEntries.map((entry) => (
                  <div key={`relationship-${entry.variable}`} className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">{entry.variable}</p>
                    <p className="mt-2 text-3xl font-display font-bold text-primary">{entry.correlation.toFixed(3)}</p>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface/60">{getCorrelationInterpretation(entry.variable, entry.correlation)}</p>
                  </div>
                ))}
              </div>
            </Card>

            {prediction && (
              <Card className="p-5 sm:p-8">
                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <div>
                    <div className="mb-6 flex items-center gap-3 text-primary">
                      <TrendingUp size={20} />
                      <Headline level={2}>{prediction.title}</Headline>
                    </div>
                    <p className="text-sm leading-relaxed text-on-surface/60">{prediction.explanation}</p>
                    <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Interpretation</p>
                      <p className="mt-2 text-sm leading-relaxed text-on-surface/60">{predictionInsightLine}</p>
                    </div>
                    <div className="mt-6 h-[260px] sm:h-[340px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prediction.chartSeries} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                          <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            minTickGap={isMobile ? 18 : 4}
                            tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 8 : 11 }}
                          />
                          <YAxis
                            width={isMobile ? 28 : 40}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: '12px',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              backgroundColor: 'var(--app-surface-container-lowest)',
                            }}
                          />
                          {!isMobile && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                          <Line
                            type="monotone"
                            dataKey="historical"
                            name={isMobile ? 'Historical' : 'Historical poverty'}
                            stroke="var(--app-primary)"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            connectNulls={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="predicted"
                            name={isMobile ? 'Predicted' : 'Predicted poverty'}
                            stroke="#b45309"
                            strokeWidth={3}
                            strokeDasharray="7 4"
                            dot={{ r: 3 }}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Prediction Method</p>
                      <p className="mt-2 text-sm leading-relaxed text-on-surface/60">{prediction.method}</p>
                    </div>
                    <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Next Five Years</p>
                      <div className="mt-4 space-y-3">
                        {prediction.forecast.map((point) => (
                          <div key={point.year} className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container px-4 py-3">
                            <span className="text-sm font-medium">{point.year}</span>
                            <span className="text-sm font-semibold text-primary">{point.povertyRate.toFixed(2)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">How To Defend It</p>
                      <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
                        This is a baseline forecast, not a complex scenario model. It uses the existing historical poverty trend already stored in SQLite and applies a straight-line regression from year to poverty rate.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Limitation Note</p>
                      <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
                        These findings are based on the available indicators and observed survey points. The projection is a baseline estimate and does not account for policy shifts, external shocks, or unobserved factors.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {povertyGrouping && (
              <Card className="p-5 sm:p-8">
                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                  <div>
                    <div className="mb-6 flex items-center gap-3 text-primary">
                      <Layers3 size={20} />
                      <Headline level={2}>{povertyGrouping.title}</Headline>
                    </div>
                    <p className="text-sm leading-relaxed text-on-surface/60">
                      The Relative Development Index (RDI) is used here as a simple proxy for regional development level. Lower RDI values indicate weaker socioeconomic conditions and therefore higher vulnerability to poverty, while higher RDI values indicate relatively stronger development conditions and lower vulnerability.
                    </p>
                    <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Interpretation</p>
                      <p className="mt-2 text-sm leading-relaxed text-on-surface/60">{groupingInsightLine}</p>
                    </div>
                    <div className="mt-6 h-[240px] sm:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={povertyGrouping.summary.map((entry) => ({
                            ...entry,
                            displayLabel: getClusterDisplayLabel(entry.category),
                          }))}
                          margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
                        >
                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                          <XAxis
                            dataKey="displayLabel"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }}
                          />
                          <YAxis
                            allowDecimals={false}
                            width={isMobile ? 28 : 40}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }}
                          />
                          <Tooltip
                            formatter={(value: number) => [value, 'Districts']}
                            cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                            contentStyle={{
                              borderRadius: '12px',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              backgroundColor: 'var(--app-surface-container-lowest)',
                            }}
                          />
                          <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                            {povertyGrouping.summary.map((entry) => (
                              <Cell
                                key={entry.category}
                                fill={
                                  entry.category === 'Low'
                                    ? '#c2410c'
                                    : entry.category === 'Medium'
                                      ? '#ca8a04'
                                      : '#059669'
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">
                        Distribution of districts by poverty vulnerability level
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
                        Districts are grouped into three bands so the map-related regional differences can be interpreted more clearly at a glance.
                      </p>
                    </div>
                    <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Grouping Basis</p>
                      <p className="mt-2 text-sm leading-relaxed text-on-surface/60">{povertyGrouping.basis}</p>
                    </div>
                    <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Key Insight</p>
                      <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
                        {getGroupingInsight(povertyGrouping.records)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">District Results</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {povertyGrouping.records.map((record) => (
                        <div key={record.region} className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-on-surface">{record.region}</p>
                            <span
                              className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${getClusterBadgeClasses(record.category)}`}
                            >
                              {getClusterDisplayLabel(record.category)}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm text-on-surface/60">
                            <span>RDI score</span>
                            <span className="font-semibold text-primary">{record.value.toFixed(1)}</span>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-on-surface/60">{getClusterCardText(record.category)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6 sm:gap-8">
              <Card className="p-5 sm:p-8">
                <div className="mb-6">
                  <Headline level={2}>Correlation Strength</Headline>
                  <p className="mt-2 text-sm text-on-surface/50">
                    These bars summarize the poverty-variable correlations used to guide the exploratory regression interpretation.
                  </p>
                </div>
                <div className="h-[220px] sm:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={correlationEntries} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                      <XAxis dataKey="variable" axisLine={false} tickLine={false} interval={0} tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }} />
                      <YAxis width={isMobile ? 28 : 40} domain={[-1, 1]} axisLine={false} tickLine={false} tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }} />
                      <Tooltip
                        formatter={(value: number) => [value.toFixed(3), 'Correlation']}
                        cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          backgroundColor: 'var(--app-surface-container-lowest)',
                        }}
                      />
                      <Bar dataKey="correlation" radius={[10, 10, 0, 0]}>
                        {correlationEntries.map((entry) => (
                          <Cell
                            key={entry.variable}
                            fill={selectedVariable === entry.variable ? '#0b4dbb' : entry.direction === 'positive' ? '#3d6db8' : '#b45309'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-5 sm:p-8">
                <div className="mb-6">
                  <Headline level={2}>Poverty Trend and Rolling Average</Headline>
                  <p className="mt-2 text-sm text-on-surface/50">
                    This pairs the observed poverty series with the smoothed rolling average from the cleaned workbook.
                  </p>
                </div>
                <div className="h-[220px] sm:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={predictionSeries} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                      <XAxis dataKey="period" interval={0} minTickGap={isMobile ? 18 : 5} axisLine={false} tickLine={false} tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 8 : 11 }} />
                      <YAxis width={isMobile ? 28 : 40} axisLine={false} tickLine={false} tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          backgroundColor: 'var(--app-surface-container-lowest)',
                        }}
                      />
                      {!isMobile && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                      <Line type="monotone" dataKey="povertyRate" name={isMobile ? 'Observed' : 'Observed poverty'} stroke="var(--app-primary)" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="rollingAverage" name={isMobile ? 'Rolling avg' : 'Rolling average'} stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <Card className="p-5 sm:p-8">
              <Headline level={2} className="mb-6">Interactive Regression Explorer</Headline>
              <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                {correlationEntries.map((entry) => (
                  <button
                    key={entry.variable}
                    type="button"
                    onClick={() => setSelectedVariable(entry.variable)}
                    className={`rounded-2xl border px-3 sm:px-4 py-3 sm:py-4 text-left transition-colors ${
                      selectedVariable === entry.variable
                        ? 'border-primary bg-primary/8'
                        : 'border-outline-variant bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">{entry.variable}</p>
                    <p className="mt-2 sm:mt-3 text-xl sm:text-2xl font-display font-bold text-primary">{entry.correlation.toFixed(3)}</p>
                    <p className="mt-2 text-sm text-on-surface/60 capitalize">{entry.direction} correlation, {entry.strength}</p>
                  </button>
                ))}
              </div>

              {scatterSeries && (
                <div className="mt-8 grid items-start grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 sm:gap-8">
                  <Card className="relative z-10 p-5 sm:p-6" onClick={(event) => event.stopPropagation()}>
                    <div className="mb-5">
                      <Headline level={3}>{scatterSeries.label} vs Poverty</Headline>
                      <p className="mt-2 text-sm text-on-surface/50">
                        Solid dots are observed survey points. The continuous line is a modeled trend sampled across the variable range to make the relationship easier to read.
                      </p>
                      {scatterAxisMeta && (
                        <p className="mt-2 text-xs leading-relaxed text-on-surface/50">
                          X-axis: {scatterAxisMeta.xAxisLabel}. Y-axis: {scatterAxisMeta.yAxisLabel}.
                        </p>
                      )}
                      {scatterSeries.label === 'Gini' && (
                        <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">What Gini Means</p>
                          <p className="mt-2 text-sm leading-relaxed text-on-surface/65">{giniExplanation}</p>
                        </div>
                      )}
                    </div>
                    <div className="h-[240px] sm:h-[380px]">
                      <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: isMobile ? 6 : 16, bottom: 10, left: isMobile ? -18 : 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                        <XAxis
                          type="number"
                          dataKey="x"
                          name={scatterSeries.label}
                          unit={scatterSeries.unit}
                          domain={explorerXDomain}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                          tickFormatter={scatterAxisMeta?.formatXTick}
                          tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name="Poverty"
                          unit="%"
                          domain={explorerYDomain}
                          axisLine={false}
                          tickLine={false}
                          width={isMobile ? 28 : 40}
                          tickFormatter={scatterAxisMeta?.formatYTick}
                          tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value: number, name: string) => [
                            typeof value === 'number'
                              ? name === (isMobile ? 'Est.' : 'Estimated path') ||
                                name === (isMobile ? 'Obs.' : 'Observed points') ||
                                name === (isMobile ? 'Fit' : 'Modeled line')
                                ? scatterAxisMeta?.formatYValue(value) ?? `${value.toFixed(2)}%`
                                : scatterAxisMeta?.formatXValue(value) ?? value.toFixed(2)
                              : value,
                            name,
                          ]}
                          labelFormatter={(_, payload) => {
                            const row = payload?.[0]?.payload as { period?: string } | undefined;
                            return row?.period ? `Observed: ${row.period}` : 'Modeled trend line';
                          }}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            backgroundColor: 'var(--app-surface-container-lowest)',
                          }}
                        />
                        {!isMobile && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                        <Scatter
                          name={isMobile ? 'Est.' : 'Estimated path'}
                          data={scatterSeries.interpolatedPoints}
                          fill="rgba(61, 109, 184, 0.35)"
                        />
                        <Scatter name={isMobile ? 'Obs.' : 'Observed points'} data={scatterSeries.points} fill="var(--app-primary)" />
                        <Scatter
                          name={isMobile ? 'Fit' : 'Modeled line'}
                          data={scatterSeries.trendLine}
                          fill="#b45309"
                          line={{ stroke: '#b45309', strokeWidth: 2 }}
                          shape={() => null}
                        />
                      </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                    {activeInsight && (
                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Main Deduction</p>
                          <p className="mt-2 text-sm font-medium text-on-surface capitalize">{activeInsight.relationship} relationship</p>
                          <p className="mt-3 text-sm leading-relaxed text-on-surface/60">{activeInsight.deduction}</p>
                        </div>
                        <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Why It Matters</p>
                          <p className="mt-3 text-sm leading-relaxed text-on-surface/60">{activeInsight.implication}</p>
                          <p className="mt-3 text-sm leading-relaxed text-on-surface/60">{activeInsight.coefficientText}</p>
                        </div>
                      </div>
                    )}
                  </Card>

                  <Card className="relative z-10 p-5 sm:p-8" onClick={(event) => event.stopPropagation()}>
                    <Headline level={3} className="mb-4">Selected Variable</Headline>
                    {activeCorrelation && (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Active Variable</p>
                          <p className="mt-2 text-lg font-semibold text-on-surface">{scatterSeries.label}</p>
                          <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
                            The variable cards above are the main selector for the regression explorer. This panel focuses on interpreting the currently selected relationship.
                          </p>
                        </div>
                        <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Correlation</p>
                          <p className="mt-2 text-3xl font-display font-bold text-primary">{activeCorrelation.correlation.toFixed(3)}</p>
                          <p className="mt-2 text-sm text-on-surface/60 capitalize">{activeCorrelation.direction} relationship, {activeCorrelation.strength} strength</p>
                        </div>
                        <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Regression Coefficient</p>
                          <p className="mt-2 text-3xl font-display font-bold text-primary">
                            {activeCoefficient ? activeCoefficient.coefficient : 'N/A'}
                          </p>
                          <p className="mt-2 text-sm text-on-surface/60">
                            This coefficient comes from the multiple-regression fit, while the scatter chart visualizes the simpler one-variable relationship.
                          </p>
                        </div>
                        <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Observed Data Points</p>
                          <p className="mt-2 text-lg font-semibold text-on-surface">{scatterSeries.points.length} observed survey years</p>
                          <p className="mt-2 text-sm text-on-surface/60">
                            The smooth line adds 41 modeled samples across the observed variable range, which makes the chart feel more concrete while keeping the observed survey count honest.
                            Interpolated path points fill the gaps between survey years so the shape reads better without pretending those are extra official observations.
                          </p>
                        </div>
                        <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Plain-Language Reading</p>
                          <p className="mt-2 text-sm font-medium text-on-surface">
                            {getCorrelationSummary(
                              scatterSeries,
                              activeCorrelation?.correlation ?? null,
                              activeCoefficient?.coefficient ?? null,
                            ).title}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
                            {getCorrelationSummary(
                              scatterSeries,
                              activeCorrelation?.correlation ?? null,
                              activeCoefficient?.coefficient ?? null,
                            ).relationText}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
                            {getCorrelationSummary(
                              scatterSeries,
                              activeCorrelation?.correlation ?? null,
                              activeCoefficient?.coefficient ?? null,
                            ).coefficientText}
                          </p>
                        </div>
                        {scatterSeries.label === 'Gini' && (
                          <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Gini in Simple Terms</p>
                            <p className="mt-2 text-sm leading-relaxed text-on-surface/60">{giniExplanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </Card>

            <Card className="p-5 sm:p-8">
              <div className="mb-6 flex items-center gap-3 text-primary">
                <TrendingUp size={20} />
                <Headline level={2}>2023 Demographic Risk Snapshot</Headline>
              </div>
              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {demographicSections.map((section) => (
                      <div key={section.category} className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <Headline level={3} className="text-lg">{section.category}</Headline>
                          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface/40">{section.year}</span>
                        </div>
                        <div className="space-y-3">
                          {section.groups.map((group) => (
                            <div key={group.group}>
                              <div className="mb-1 flex items-center justify-between text-sm">
                                <span className="font-medium">{group.group}</span>
                                <span className="font-semibold text-primary">{group.value}%</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(group.value * 4, 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Key Demographic Reading</p>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
                      The 2023 breakdown shows that poverty is not distributed evenly across the population. Children, youth, and unemployed people face noticeably higher poverty rates than elderly people, retirees, or those in employment.
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-on-surface/60">
                      This matters because it helps move the discussion beyond national averages. Even if the overall poverty rate improves, certain groups can remain much more exposed than others.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Variables Used</p>
                    <div className="mt-4 grid gap-3">
                      {data.variables.map((variable) => (
                        <div key={variable} className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container px-4 py-3">
                          <CheckCircle2 size={16} className="text-green-600" />
                          <span className="text-sm font-medium">{variable}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">How To Read This Page</p>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
                      Correlation shows whether two measures move together. Regression goes one step further by estimating how strongly each variable is associated with poverty when the variables are considered together.
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-on-surface/60">{giniExplanation}</p>
                  </div>
                </div>
              </div>
            </Card>

            {localPovertyEvidence && (
              <Card className="p-5 sm:p-8">
                <Headline level={2} className="mb-3">{localPovertyEvidence.title}</Headline>
                <p className="text-sm leading-relaxed text-on-surface/60">
                  {localPovertyEvidence.explanation}
                </p>
                <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Interpretation</p>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
                    {localPovertyEvidence.interpretation}
                  </p>
                </div>
                <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Average District Poverty and Inequality</p>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
                      Bars show average poverty rate by district, while the line shows the corresponding average Gini coefficient from the same grouped table.
                    </p>
                    <div className="mt-5 h-[300px] sm:h-[360px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={localPovertyEvidence.districtProfiles} margin={{ top: 8, right: 8, bottom: 10, left: 0 }}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                          <XAxis
                            dataKey="district"
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            angle={isMobile ? -28 : -18}
                            textAnchor="end"
                            height={isMobile ? 64 : 52}
                            tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }}
                          />
                          <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            width={isMobile ? 30 : 44}
                            tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }}
                            tickFormatter={(value: number) => `${value.toFixed(0)}%`}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            width={isMobile ? 36 : 46}
                            domain={[0.2, 0.36]}
                            tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: '12px',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              backgroundColor: 'var(--app-surface-container-lowest)',
                            }}
                            formatter={(value: number, name: string) => [
                              name === 'Average poverty rate' ? `${value.toFixed(2)}%` : value.toFixed(3),
                              name,
                            ]}
                          />
                          {!isMobile && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                          <Bar yAxisId="left" dataKey="averagePovertyRate" name="Average poverty rate" radius={[8, 8, 0, 0]} fill="var(--app-primary-container)" />
                          <Line yAxisId="right" type="monotone" dataKey="averageGini" name="Average Gini" stroke="#b45309" strokeWidth={3} dot={{ r: 3 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Highest District Poverty</p>
                      <div className="mt-4 space-y-3">
                        {localPovertyEvidence.highestPovertyDistricts.map((district) => (
                          <div key={district.district} className="rounded-xl border border-outline-variant bg-surface-container px-4 py-3">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm font-medium text-on-surface">{district.district}</span>
                              <span className="text-sm font-semibold text-primary">{district.averagePovertyRate.toFixed(2)}%</span>
                            </div>
                            <p className="mt-1 text-xs text-on-surface/50">
                              {district.areaCount} local areas | Avg Gini {district.averageGini.toFixed(3)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Lowest District Poverty</p>
                      <div className="mt-4 space-y-3">
                        {localPovertyEvidence.lowestPovertyDistricts.map((district) => (
                          <div key={district.district} className="rounded-xl border border-outline-variant bg-surface-container px-4 py-3">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm font-medium text-on-surface">{district.district}</span>
                              <span className="text-sm font-semibold text-primary">{district.averagePovertyRate.toFixed(2)}%</span>
                            </div>
                            <p className="mt-1 text-xs text-on-surface/50">
                              {district.areaCount} local areas | Avg Gini {district.averageGini.toFixed(3)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">District Poverty Gap</p>
                    <p className="mt-2 text-3xl font-display font-bold text-primary">{localPovertyEvidence.povertyGap.toFixed(2)} pts</p>
                    <p className="mt-2 text-sm text-on-surface/60">
                      Difference between the districts with the highest and lowest average poverty rates in the grouped 2006/07 table.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Poverty vs Gini (Districts)</p>
                    <p className="mt-2 text-3xl font-display font-bold text-primary">{localPovertyEvidence.povertyGiniCorrelation.toFixed(3)}</p>
                    <p className="mt-2 text-sm text-on-surface/60">
                      Pearson correlation using the derived district averages for poverty rate and Gini coefficient.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Supporting Publication</p>
                    <p className="mt-2 text-sm font-medium text-on-surface">{localPovertyEvidence.supportingPublication.title}</p>
                    <p className="mt-2 text-sm text-on-surface/60">{localPovertyEvidence.supportingPublication.note}</p>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/45">Local Extremes Used In The Roll-up</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {localPovertyEvidence.localExtremes.map((area) => (
                      <div key={`${area.rank}-${area.area}`} className="rounded-xl border border-outline-variant bg-surface-container px-4 py-3">
                        <p className="text-sm font-medium text-on-surface">{area.area}</p>
                        <p className="mt-1 text-xs text-on-surface/50">{area.district}</p>
                        <p className="mt-2 text-sm text-primary font-semibold">{area.povertyRate.toFixed(1)}% poverty</p>
                        <p className="text-xs text-on-surface/50">Gini {area.gini.toFixed(3)} | Rank {area.rank}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-5 sm:p-8">
              <div className="mx-auto max-w-6xl">
                <Headline level={2} className="mb-3 text-center">Dynamic Chart Gallery</Headline>
                <p className="mb-8 text-center text-sm text-on-surface/60 leading-relaxed max-w-4xl mx-auto">
                  This section recreates the old output set as live charts. The heatmap, actual-versus-predicted series, and each regression scatter are now rendered directly from the current analytics payload instead of static pictures.
                </p>
                <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
                  {correlationMatrix.length > 0 && (
                    <Card className="max-w-full overflow-hidden p-5 sm:p-6">
                      <Headline level={3} className="text-xl">Correlation Heatmap</Headline>
                      <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
                        Full correlation matrix across poverty, GDP, unemployment, inflation, and Gini.
                      </p>
                      <div className="mt-5 w-full max-w-full overflow-x-auto overscroll-x-contain pb-2">
                        <div
                          className="inline-grid gap-1.5 sm:gap-2"
                          style={{
                            gridTemplateColumns: isMobile
                              ? `72px repeat(${heatmapLabels.length}, minmax(44px, 1fr))`
                              : `92px repeat(${heatmapLabels.length}, minmax(56px, 1fr))`,
                          }}
                        >
                          <div />
                          {heatmapLabels.map((label) => (
                            <div
                              key={`gallery-col-${label}`}
                              className={`text-center leading-tight font-semibold uppercase tracking-wide text-on-surface/45 whitespace-pre-line break-words px-1 ${
                                isMobile ? 'text-[8px]' : 'text-[10px]'
                              }`}
                            >
                              {compactLabel(label)}
                            </div>
                          ))}
                          {heatmapLabels.map((rowLabel) => (
                            <React.Fragment key={`gallery-row-${rowLabel}`}>
                              <div
                                className={`flex items-center leading-tight font-semibold uppercase tracking-wide text-on-surface/45 whitespace-pre-line break-words pr-2 ${
                                  isMobile ? 'text-[8px]' : 'text-[10px]'
                                }`}
                              >
                                {compactLabel(rowLabel)}
                              </div>
                              {heatmapLabels.map((columnLabel) => {
                                const value = getMatrixValue(correlationMatrix, rowLabel, columnLabel);
                                return (
                                  <div
                                    key={`gallery-${rowLabel}-${columnLabel}`}
                                    className={`flex aspect-square items-center justify-center rounded-lg sm:rounded-xl border border-white/15 font-semibold text-white ${
                                      isMobile ? 'text-[10px]' : 'text-xs'
                                    }`}
                                    style={{ backgroundColor: heatmapColor(value ?? 0) }}
                                  >
                                    {value?.toFixed(2) ?? '--'}
                                  </div>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}

                  {actualPredictedSeries.length > 0 && (
                    <Card className="p-5 sm:p-6">
                      <Headline level={3} className="text-xl">Actual vs Predicted Poverty</Headline>
                      <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
                        Observed poverty levels compared with the fitted model output across the survey years.
                      </p>
                      <div className="mt-5 h-[240px] sm:h-[360px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={actualPredictedSeries}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                            <XAxis dataKey="period" interval="preserveStartEnd" axisLine={false} tickLine={false} tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }} />
                            <YAxis width={isMobile ? 28 : 40} axisLine={false} tickLine={false} tick={{ fill: 'var(--app-on-surface)', fontSize: isMobile ? 9 : 11 }} />
                            <Tooltip
                              contentStyle={{
                                borderRadius: '12px',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                backgroundColor: 'var(--app-surface-container-lowest)',
                              }}
                            />
                            {!isMobile && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                            <Line type="monotone" dataKey="actual" name="Actual" stroke="var(--app-primary)" strokeWidth={3} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="predicted" name={isMobile ? 'Pred.' : 'Predicted'} stroke="#b45309" strokeWidth={3} strokeDasharray="6 4" dot={{ r: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )}

                  {galleryScatterSeries.map((series) => (
                    <div key={series.variable}>
                      <MiniScatterCard series={series} isMobile={isMobile} />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </>
        ) : (
          !error && (
            <Card className="p-8">
              <p className="text-sm text-on-surface/50">Loading analytics results...</p>
            </Card>
          )
        )}
      </div>
    </Layout>
  );
};

export default Analytics;

