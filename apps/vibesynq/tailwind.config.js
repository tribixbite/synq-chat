/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{js,ts,jsx,tsx,html}", "./src/components/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				sans: ["Segoe UI", "Tahoma", "Geneva", "Verdana", "sans-serif"],
				code: [
					"ui-monospace",
					"SFMono-Regular",
					"Menlo",
					"Monaco",
					"Consolas",
					"Liberation Mono",
					"Courier New",
					"monospace"
				]
			}
			// You can extend other theme aspects here if needed
		}
	},
	plugins: []
};
