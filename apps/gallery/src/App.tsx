import { AppGallery } from "./AppGallery";
import "./index.css";

interface AppData {
	htmlAppsList: string[];
	folderAppsList: string[];
	tsxAppsList: string[];
	totalCount: number;
}

export function App() {
	const currentTime = new Date().toLocaleString();

	// Get app data from data attribute (server-rendered)
	const rootElement = document.getElementById("root");
	const appDataStr = rootElement?.getAttribute("data-app-data");
	const appData: AppData = appDataStr
		? JSON.parse(appDataStr)
		: {
				htmlAppsList: [],
				folderAppsList: [],
				tsxAppsList: [],
				totalCount: 0
			};

	return (
		<AppGallery
			htmlAppsList={appData.htmlAppsList}
			folderAppsList={appData.folderAppsList}
			tsxAppsList={appData.tsxAppsList}
			totalCount={appData.totalCount}
			currentTime={currentTime}
		/>
	);
}

export default App;
