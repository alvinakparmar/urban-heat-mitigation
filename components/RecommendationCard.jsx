import React from 'react';

export default function RecommendationCard({ recommendation, isRecommended = false }) {
  if (!recommendation) return null;

  const {
    intervention_type,
    key,
    expected_reduction,
    action_items = [],
    priority = "Medium",
    cost = "Medium",
    cost_level = "$$"
  } = recommendation;

  // Set style config based on intervention key
  const config = {
    greening: {
      icon: "🌳",
      title: "Urban Greening & Vegetation",
      badgeColor: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/30",
      themeColor: "#10b981", // Emerald
      bgGradient: "from-emerald-50 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/5",
      accentBorder: "hover:border-emerald-500/30 dark:hover:border-emerald-500/20"
    },
    cool_roofs: {
      icon: "🏢",
      title: "Cool Roof Systems",
      badgeColor: "bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/30",
      themeColor: "#0ea5e9", // Sky
      bgGradient: "from-sky-50 to-blue-50/30 dark:from-sky-950/10 dark:to-blue-950/5",
      accentBorder: "hover:border-sky-500/30 dark:hover:border-sky-500/20"
    },
    albedo_increase: {
      icon: "🛣️",
      title: "Albedo Pavement Increase",
      badgeColor: "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/30",
      themeColor: "#f59e0b", // Amber
      bgGradient: "from-amber-50 to-orange-50/30 dark:from-amber-950/10 dark:to-orange-950/5",
      accentBorder: "hover:border-amber-500/30 dark:hover:border-amber-500/20"
    },
    mixed: {
      icon: "🧬",
      title: "Mixed Mitigation Strategy",
      badgeColor: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/30",
      themeColor: "#6366f1", // Indigo
      bgGradient: "from-indigo-50 to-purple-50/30 dark:from-indigo-950/10 dark:to-purple-950/5",
      accentBorder: "hover:border-indigo-500/30 dark:hover:border-indigo-500/20"
    }
  }[key.toLowerCase()] || {
    icon: "💡",
    title: intervention_type,
    badgeColor: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    themeColor: "#a8a29e",
    bgGradient: "from-gray-50 to-stone-50/30 dark:from-gray-900/10 dark:to-stone-900/5",
    accentBorder: "hover:border-gray-500/30"
  };

  // Priority color config
  const priorityColor = {
    high: "bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20",
    medium: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    low: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20"
  }[priority.toLowerCase()] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 ${
      isRecommended 
        ? `bg-gradient-to-br ${config.bgGradient} border-emerald-500/30 dark:border-emerald-500/20 shadow-lg ring-1 ring-emerald-500/20` 
        : `bg-white dark:bg-gray-900/50 border-gray-100 dark:border-gray-800/80 shadow ${config.accentBorder}`
    }`}>
      {/* Recommended Tag */}
      {isRecommended && (
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mb-3 bg-emerald-500 text-white text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-full shadow-sm">
          ⭐ Optimal Recommendation
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl filter drop-shadow-sm">{config.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base leading-snug">
              {config.title}
            </h3>
            <span className={`inline-block border text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${config.badgeColor}`}>
              {intervention_type}
            </span>
          </div>
        </div>

        {/* Expected Temp Reduction Badge */}
        <div className="text-right shrink-0">
          <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            -{expected_reduction.toFixed(1)}°C
          </div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            Est. Reduction
          </div>
        </div>
      </div>

      {/* Action Items List */}
      <div className="mt-4">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Suggested Action Plan:
        </h4>
        <ol className="mt-2 space-y-2">
          {action_items.map((item, index) => (
            <li key={index} className="flex gap-2.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <span className="font-bold text-gray-400 dark:text-gray-500 mt-0.5">{index + 1}.</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Footer Badges */}
      <div className="mt-5 pt-3.5 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between gap-4 text-xs font-medium">
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <span>Priority:</span>
          <span className={`px-2 py-0.5 rounded-md font-semibold ${priorityColor}`}>
            {priority}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
          <span>Cost:</span>
          <div className="flex items-center">
            <span className="font-bold text-gray-800 dark:text-gray-100 mr-1">{cost}</span>
            <span className="text-emerald-600 dark:text-emerald-500 font-extrabold tracking-tight">
              {cost_level}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
