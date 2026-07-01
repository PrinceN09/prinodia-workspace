"use client";

const INVOICES = [
  {
    id: "1",
    org: "Ministry of Finance",
    number: "INV-2026-00201",
    amount: 1200,
    status: "PAID",
    period: "Dec 2026",
    dueDate: "Dec 1, 2026",
  },
  {
    id: "2",
    org: "Kinstech Solutions",
    number: "INV-2026-00198",
    amount: 249,
    status: "OPEN",
    period: "Dec 2026",
    dueDate: "Jan 1, 2027",
  },
  {
    id: "3",
    org: "Caritas DRC",
    number: "INV-2026-00185",
    amount: 79,
    status: "PAID",
    period: "Nov 2026",
    dueDate: "Nov 1, 2026",
  },
  {
    id: "4",
    org: "Acme Corp",
    number: "INV-2026-00152",
    amount: 249,
    status: "VOID",
    period: "Oct 2026",
    dueDate: "Oct 1, 2026",
  },
];

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  OPEN: "bg-yellow-100 text-yellow-700",
  VOID: "bg-gray-100 text-gray-400",
  DRAFT: "bg-gray-100 text-gray-500",
  UNCOLLECTIBLE: "bg-red-100 text-red-700",
};

export default function PlatformBillingPage() {
  const mrr = 48200;
  const outstanding = INVOICES.filter((i) => i.status === "OPEN").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Billing Overview</h2>
        <p className="text-sm text-gray-500 mt-1">
          Revenue tracking, invoice management, and billing health.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Monthly Recurring Revenue
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${mrr.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">+8.3% vs last month</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Outstanding Invoices
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${outstanding.toLocaleString()}</p>
          <p className="text-xs text-orange-500 mt-1">
            {INVOICES.filter((i) => i.status === "OPEN").length} open invoices
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Collected This Month
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            $
            {INVOICES.filter((i) => i.status === "PAID")
              .reduce((s, i) => s + i.amount, 0)
              .toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {INVOICES.filter((i) => i.status === "PAID").length} paid invoices
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Recent Invoices</h3>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          + Create Invoice
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Invoice #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Organization
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Period
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Due
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {INVOICES.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{inv.number}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{inv.org}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{inv.period}</td>
                <td className="px-4 py-3 font-medium text-gray-900">${inv.amount}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{inv.dueDate}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-blue-600 hover:underline mr-3">View</button>
                  {inv.status === "OPEN" && (
                    <button className="text-xs text-green-600 hover:underline">Mark Paid</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
