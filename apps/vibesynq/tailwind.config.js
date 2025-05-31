/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./src/**/*.{js,ts,jsx,tsx,html}",
		"./src/components/**/*.{js,ts,jsx,tsx}",
		"./index.html"
	],
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
			},
			colors: {
				primary: {
					50: "#eff6ff",
					100: "#dbeafe",
					200: "#bfdbfe",
					300: "#93c5fd",
					400: "#60a5fa",
					500: "#3b82f6",
					600: "#2563eb",
					700: "#1d4ed8",
					800: "#1e40af",
					900: "#1e3a8a"
				}
			}
		}
	},
	plugins: []
};
