import type React from "react";

const BuildDate: React.FC = () => {
	const buildDate = new Date(import.meta.env.BUILD_DATE);
	const now = new Date();
	const daysAgo = Math.floor((now.getTime() - buildDate.getTime()) / (1000 * 60 * 60 * 24));

	const formattedDate = buildDate.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric"
	});

	return (
		<div className="bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-sm px-6 py-3 rounded-xl shadow-2xl border border-white/10 text-white text-sm font-medium tracking-wider">
			Build: {formattedDate} ({daysAgo} days ago)
		</div>
	);
};

export default BuildDate;
