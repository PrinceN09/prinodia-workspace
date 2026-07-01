"use client";

const MOCK_INVOICES = [
  {
    id: "1",
    number: "INV-2026-00042",
    date: "Dec 1, 2026",
    amount: "$249.00",
    status: "PAID",
    period: "Dec 2026",
  },
  {
    id: "2",
    number: "INV-2026-00031",
    date: "Nov 1, 2026",
    amount: "$249.00",
    status: "PAID",
    period: "Nov 2026",
  },
  {
    id: "3",
    number: "INV-2026-00022",
    date: "Oct 1, 2026",
    amount: "$249.00",
    status: "PAID",
    period: "Oct 2026",
  },
  {
    id: "4",
    number: "INV-2027-00001",
    date: "Jan 1, 2027",
    amount: "$249.00",
    status: "OPEN",
    period: "Jan 2027",
  },
];

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  OPEN: "bg-yellow-100 text-yellow-700",
  VOID: "bg-gray-100 text-gray-500",
  DRAFT: "bg-gray-100 text-gray-500",
};

export default function InvoicesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Invoice History</h2>
          <p className="text-sm text-gray-500 mt-1">
            Download PDFs of past invoices for your records.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Invoice #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Period
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_INVOICES.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-900">{inv.number}</td>
                <td className="px-4 py-3 text-gray-700">{inv.period}</td>
                <td className="px-4 py-3 text-gray-500">{inv.date}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{inv.amount}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-blue-600 hover:underline">Download PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
