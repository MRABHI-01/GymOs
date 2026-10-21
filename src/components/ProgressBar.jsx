function ProgressBar({ label, value, target, unit }) {
  const percent = Math.min((value / target) * 100, 100)
  const over = value > target

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={over ? 'text-amber-400' : 'text-gray-300'}>
          {Math.round(value)} / {target} {unit}
        </span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${over ? 'bg-amber-400' : 'bg-emerald-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar