import { angelicFrequencies } from "@/lib/frequencyAnalysis";

export function AngelicFrequencies() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-5">
      <h2 className="text-lg font-medium mb-3">Angelic Frequency Reference</h2>
      <div className="space-y-2">
        {angelicFrequencies.map((freq, index) => (
          <div 
            key={freq.frequency}
            className={`flex justify-between p-2 ${
              index < angelicFrequencies.length - 1 ? "border-b border-gray-700" : ""
            }`}
          >
            <span className="text-gray-300">{freq.frequency} Hz</span>
            <span className="text-green-400">{freq.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
