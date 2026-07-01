"use client";

const DOWNLOADS = [
  {
    id: "1",
    name: "Prinodia Desktop",
    description:
      "The full desktop experience for Windows. Includes offline sync and native notifications.",
    platform: "WINDOWS",
    category: "DESKTOP_APP",
    version: "2.4.1",
    size: "142 MB",
    isFeatured: true,
    icon: "🖥️",
  },
  {
    id: "2",
    name: "Prinodia Desktop",
    description: "Native macOS application with Apple Silicon support.",
    platform: "MAC",
    category: "DESKTOP_APP",
    version: "2.4.1",
    size: "128 MB",
    isFeatured: true,
    icon: "🍎",
  },
  {
    id: "3",
    name: "Prinodia for iOS",
    description: "Full workspace experience on iPhone and iPad.",
    platform: "IOS",
    category: "MOBILE_APP",
    version: "2.3.0",
    size: "48 MB",
    isFeatured: false,
    icon: "📱",
  },
  {
    id: "4",
    name: "Prinodia for Android",
    description: "Android app for phones and tablets.",
    platform: "ANDROID",
    category: "MOBILE_APP",
    version: "2.3.0",
    size: "52 MB",
    isFeatured: false,
    icon: "🤖",
  },
  {
    id: "5",
    name: "Chrome Extension",
    description: "Quick capture, link sharing, and notifications from any tab.",
    platform: "CHROME_EXTENSION",
    category: "BROWSER_EXTENSION",
    version: "1.2.0",
    size: "3 MB",
    isFeatured: false,
    icon: "🔵",
  },
  {
    id: "6",
    name: "Prinodia CLI",
    description: "Command-line tool for automating Drive, workflows, and admin tasks.",
    platform: "LINUX",
    category: "CLI_TOOL",
    version: "1.0.4",
    size: "12 MB",
    isFeatured: false,
    icon: "⌨️",
  },
];

const PLATFORM_LABELS: Record<string, string> = {
  WINDOWS: "Windows",
  MAC: "macOS",
  IOS: "iOS",
  ANDROID: "Android",
  CHROME_EXTENSION: "Chrome",
  LINUX: "Linux / CLI",
};

export default function DownloadsPage() {
  const featured = DOWNLOADS.filter((d) => d.isFeatured);
  const others = DOWNLOADS.filter((d) => !d.isFeatured);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Download Center</h2>
        <p className="text-sm text-gray-500 mt-1">Get Prinodia Workspace on all your devices.</p>
      </div>

      {/* Featured */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Desktop Apps</h3>
        <div className="grid grid-cols-2 gap-4">
          {featured.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-lg border border-gray-200 p-5 flex items-start gap-4"
            >
              <div className="text-3xl">{d.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">{d.name}</p>
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {PLATFORM_LABELS[d.platform]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{d.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    v{d.version} · {d.size}
                  </span>
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Other downloads */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Mobile & Extensions</h3>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {others.map((d) => (
            <div key={d.id} className="px-4 py-4 flex items-center gap-4">
              <div className="text-2xl w-8 text-center">{d.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{d.name}</p>
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {PLATFORM_LABELS[d.platform]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400 mb-1">
                  v{d.version} · {d.size}
                </p>
                <button className="px-3 py-1.5 border border-blue-600 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-50">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
