import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import yahooFinance from "yahoo-finance2";

interface Quote {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  adjClose?: number | null;
}

interface DcaResult {
  totalInvested: number;
  totalShares: number;
  averageCostPerShare: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  lastClosePrice: number;
  startDate: string;
  endDate: string;
  ticker: string;
  monthlyInvestment: number;
  numberOfMonths: number;
}

function calculateDca(
  quotes: Quote[],
  monthlyInvestment: number,
  ticker: string,
): DcaResult | null {
  const validQuotes = quotes.filter(
    (q): q is Quote & { close: number } => q.close !== null && q.close > 0,
  );

  if (!validQuotes || validQuotes.length === 0) {
    return null;
  }

  let totalInvested = 0;
  let totalShares = 0;
  const numberOfMonths = validQuotes.length;

  for (const quote of validQuotes) {
    totalInvested += monthlyInvestment;
    totalShares += monthlyInvestment / quote.close;
  }

  const lastValidQuote = validQuotes[validQuotes.length - 1];
  const lastClosePrice = lastValidQuote.close;

  if (totalShares === 0) {
    return {
      totalInvested: 0,
      totalShares: 0,
      averageCostPerShare: 0,
      currentValue: 0,
      profitLoss: 0,
      profitLossPercent: 0,
      lastClosePrice: quotes[quotes.length - 1]?.close ?? 0,
      startDate: quotes[0]?.date.toISOString().split("T")[0] ?? "N/A",
      endDate:
        quotes[quotes.length - 1]?.date.toISOString().split("T")[0] ?? "N/A",
      ticker,
      monthlyInvestment,
      numberOfMonths: 0,
    };
  }

  const averageCostPerShare = totalInvested / totalShares;
  const currentValue = totalShares * lastClosePrice;
  const profitLoss = currentValue - totalInvested;
  const profitLossPercent =
    totalInvested === 0 ? 0 : (profitLoss / totalInvested) * 100;
  const startDate = validQuotes[0].date.toISOString().split("T")[0];
  const endDate = lastValidQuote.date.toISOString().split("T")[0];

  return {
    totalInvested,
    totalShares,
    averageCostPerShare,
    currentValue,
    profitLoss,
    profitLossPercent,
    lastClosePrice,
    startDate,
    endDate,
    ticker,
    monthlyInvestment,
    numberOfMonths,
  };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function DcaPage() {
  const ticker = "SPY";
  const monthlyInvestment = 100;
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(today.getMonth() - 6);

  const queryOptions = {
    period1: formatDate(sixMonthsAgo),
    period2: formatDate(today),
    interval: "1mo" as const,
  };

  let result: DcaResult | null = null;
  let error: string | null = null;
  let quotes: Quote[] = [];

  try {
    const financeResult = await yahooFinance.chart(ticker, queryOptions);
    if (financeResult.quotes) {
      quotes = financeResult.quotes as Quote[];
      result = calculateDca(quotes, monthlyInvestment, ticker);
    } else {
      throw new Error("No quote data received from API.");
    }
  } catch (err: unknown) {
    console.error("Error fetching data:", err);
    error = `Failed to fetch data for ${ticker}. Error: ${err instanceof Error ? err.message : "Unknown error"}`;
    if (err instanceof Error && err.message.includes("No data found")) {
      error = `No data found for symbol ${ticker}. It might be delisted or the date range is invalid.`;
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        DCA Calculator - {ticker} (Last 6 Months - Monthly)
      </h1>

      {error && (
        <Card className="mb-4 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>DCA Results</CardTitle>
            <CardDescription>
              Investing ${result.monthlyInvestment.toFixed(2)} monthly from{" "}
              {result.startDate} to {result.endDate} ({result.numberOfMonths}{" "}
              months).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-lg font-semibold">
                  ${result.totalInvested.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Shares</p>
                <p className="text-lg font-semibold">
                  {result.totalShares.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Average Cost/Share
                </p>
                <p className="text-lg font-semibold">
                  ${result.averageCostPerShare.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Last Close Price
                </p>
                <p className="text-lg font-semibold">
                  ${result.lastClosePrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-lg font-semibold">
                  ${result.currentValue.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profit/Loss</p>
                <p
                  className={`text-lg font-semibold ${result.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  ${result.profitLoss.toFixed(2)} (
                  {result.profitLossPercent.toFixed(2)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {quotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Prices & Investments</CardTitle>
            <CardDescription>
              Monthly closing prices used for calculation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month (End)</TableHead>
                  <TableHead className="text-right">Close Price</TableHead>
                  <TableHead className="text-right">
                    Monthly Investment
                  </TableHead>
                  <TableHead className="text-right">Shares Bought</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes
                  .filter((q) => q.close !== null)
                  .map((quote) => (
                    <TableRow key={quote.date.toISOString()}>
                      <TableCell>
                        {quote.date.toISOString().split("T")[0]}
                      </TableCell>
                      <TableCell className="text-right">
                        ${quote.close?.toFixed(2) ?? "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        ${monthlyInvestment.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {quote.close
                          ? (monthlyInvestment / quote.close).toFixed(6)
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
