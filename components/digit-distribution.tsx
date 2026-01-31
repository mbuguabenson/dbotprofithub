"use client"

interface DigitDistributionProps {
  frequencies: Record<number, { count: number; percentage: number }>
  currentDigit: number | null
  theme: "light" | "dark"
}

export function DigitDistribution({ frequencies, currentDigit, theme }: DigitDistributionProps) {
  // Split digits into two rows: 0-4 and 5-9
  const row1Digits = [0, 1, 2, 3, 4]
  const row2Digits = [5, 6, 7, 8, 9]

  const getMaxPercentage = () => {
    return Math.max(...Object.values(frequencies).map((f) => f.percentage))
  }

  const maxPercentage = getMaxPercentage()

  const renderDigitBar = (digit: number) => {
    const freq = frequencies[digit] || { count: 0, percentage: 0 }
    const isCurrentDigit = currentDigit === digit
    const maxCircles = 10
    const activeCircles = Math.ceil((freq.percentage / (maxPercentage || 1)) * maxCircles)

    return (
      <div key={digit} className="flex flex-col items-center gap-3 group">
        <div className="relative flex flex-col-reverse items-center justify-start gap-1 h-32 sm:h-40">
          {[...Array(maxCircles)].map((_, i) => {
            const isActive = i < activeCircles
            return (
              <div
                key={i}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-700 ${
                  isActive
                    ? isCurrentDigit
                      ? "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)] animate-pulse"
                      : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                    : theme === "dark"
                      ? "bg-slate-800"
                      : "bg-slate-200"
                } ${isCurrentDigit && isActive ? "scale-110" : "scale-100"}`}
                style={{ 
                  transitionDelay: `${i * 50}ms`,
                  opacity: isActive ? 1 : 0.3
                }}
              />
            )
          })}
          
          {isCurrentDigit && (
             <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <div className="text-[8px] font-black uppercase tracking-tighter bg-orange-500 text-black px-1 rounded animate-bounce">
                    Now
                </div>
             </div>
          )}
        </div>
        
        <div className={`text-center transition-transform duration-300 group-hover:scale-105 ${
          isCurrentDigit ? "scale-110" : ""
        }`}>
          <div className={`text-xl font-black ${
            isCurrentDigit 
              ? theme === "dark" ? "text-orange-400" : "text-orange-600"
              : theme === "dark" ? "text-slate-300" : "text-slate-700"
          }`}>
            {digit}
          </div>
          <div className={`text-[10px] font-bold ${
            isCurrentDigit ? "text-orange-400/80" : "text-slate-500"
          }`}>
            {freq.percentage.toFixed(1)}%
          </div>
          <div className={`text-[8px] opacity-40 font-mono ${
            isCurrentDigit ? "text-orange-400" : "text-slate-400"
          }`}>
            n={freq.count}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Digits 0-4 */}
      <div>
        <h4
          className={`text-sm font-semibold mb-3 text-center ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Digits 0-4
        </h4>
        <div className="grid grid-cols-5 gap-2 sm:gap-4">{row1Digits.map(renderDigitBar)}</div>
      </div>

      {/* Row 2: Digits 5-9 */}
      <div>
        <h4
          className={`text-sm font-semibold mb-3 text-center ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Digits 5-9
        </h4>
        <div className="grid grid-cols-5 gap-2 sm:gap-4">{row2Digits.map(renderDigitBar)}</div>
      </div>
    </div>
  )
}
