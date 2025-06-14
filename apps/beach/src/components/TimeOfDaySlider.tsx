import type React from "react";

interface TimeOfDaySliderProps {
	onChange: (time: number) => void;
}

const TimeOfDaySlider: React.FC<TimeOfDaySliderProps> = ({ onChange }) => {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const time = Number.parseFloat(e.target.value);
		onChange(time);
	};

	return (
		<div className="bg-black/50 p-4 rounded-lg">
			<div className="flex flex-col items-center gap-2">
				<label htmlFor="timeOfDay" className="text-white text-sm">
					Time of Day
				</label>
				<input
					type="range"
					id="timeOfDay"
					min="0"
					max="24"
					step="0.1"
					defaultValue="12"
					onChange={handleChange}
					className="w-32"
				/>
				<div className="text-white text-xs">
					{new Date(
						2000,
						0,
						1,
						Math.floor(Number.parseFloat("12")),
						0
					).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit"
					})}
				</div>
			</div>
		</div>
	);
};

export default TimeOfDaySlider;
