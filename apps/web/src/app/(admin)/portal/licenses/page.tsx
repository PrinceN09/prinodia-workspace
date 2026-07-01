"use client";

const MOCK_MEMBERS = [
  {
    id: "1",
    name: "Prince Ntunka",
    email: "prince@org.com",
    role: "SUPER_ADMIN",
    modules: ["Drive", "Canvas", "Meet", "Docs"],
    status: "ACTIVE",
  },
  {
    id: "2",
    name: "Marie Kosi",
    email: "marie@org.com",
    role: "MINISTRY_ADMIN",
    modules: ["Drive", "Meet", "Docs"],
    status: "ACTIVE",
  },
  {
    id: "3",
    name: "Jean Bulu",
    email: "jean@org.com",
    role: "EMPLOYEE",
    modules: ["Drive", "Meet"],
    status: "ACTIVE",
  },
  {
    id: "4",
    name: "Alice Mande",
    email: "alice@org.com",
    role: "EMPLOYEE",
    modules: ["Drive"],
    status: "INACTIVE",
  },
];

const MODULE_COLORS: Record<string, string> = {
  Drive: "bg-blue-100 text-blue-700",
  Canvas: "bg-purple-100 text-purple-700",
  Meet: "bg-green-100 text-green-700",
  Docs: "bg-yellow-100 text-yellow-700",
};

export default function LicensesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Licenses & Seat Management</h2>
          <p className="text-sm text-gray-500 mt-1">12 of 25 seats in use · Business Plan</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          Add Seats
        </button>
      </div>

      {/* Seat usage bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Seat usage</span>
          <span className="text-sm text-gray-500">12 / 25</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: "48%" }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">13 seats available. Upgrade to add more.</p>
      </div>

      {/* Module overview */}
      <div className="grid grid-cols-4 gap-4">
        {["Drive", "Canvas", "Meet", "Docs"].map((mod) => (
          <div key={mod} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{mod}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {MOCK_MEMBERS.filter((m) => m.modules.includes(mod)).length}
            </p>
            <p className="text-xs text-gray-500">users enabled</p>
          </div>
        ))}
      </div>

      {/* Member table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700">Members & Module Access</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Member
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Modules
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_MEMBERS.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{m.role.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {m.modules.map((mod) => (
                      <span
                        key={mod}
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${MODULE_COLORS[mod] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${m.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
