import type React from "react";

interface FogDensitySliderProps {
	onChange: (value: number) => void;
}

const FogDensitySlider: React.FC<FogDensitySliderProps> = ({ onChange }) => {
	return (
		<div className="bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-sm px-6 py-3 rounded-xl shadow-2xl border border-white/10">
			<div className="flex flex-col gap-3">
				<label
					htmlFor="fog-density-slider"
					className="text-white text-sm font-medium tracking-wider uppercase"
				>
					Fog Density
				</label>
				<input
					id="fog-density-slider"
					type="range"
					min="0"
					max="0.1"
					step="0.001"
					defaultValue="0.01"
					onChange={e => onChange(Number.parseFloat(e.target.value))}
					className="w-32 h-2 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-400 [&::-webkit-slider-thumb]:to-purple-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20 [&::-webkit-slider-thumb]:shadow-lg"
				/>
			</div>
		</div>
	);
};

export default FogDensitySlider;
