import { Html } from "@elysiajs/html";

const site = "https://synq.chat";
const name = "Synq Chat";
const description = "A Multisynq App Builder & Gallery.";
const keywords = "synq,chat,synqchat,synqchatapp,synqchatapp.com";
const color = "#000000";
const ogimage = "https://synq.chat/logo.png";
const at = "@multisynq";
const author = "tribixbite";

export const Meta = () => (
	<head>
		<meta name="application-name" content={name} />
		<meta name="description" content={description} />
		<meta name="keywords" content={keywords} />
		<meta name="author" content={author} />
		<meta name="theme-color" content={color} />
		<meta property="og:title" content={name} />
		<meta property="og:description" content={description} />
		<meta property="og:image" content={ogimage} />
		<meta property="og:url" content={site} />
		<meta property="og:type" content="website" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:site" content={at} />
		<meta name="twitter:title" content={name} />
		<meta name="twitter:description" content={description} />
		<meta name="twitter:image:src" content={ogimage} />
		<meta name="apple-mobile-web-app-title" content="Synq Chat" />
	</head>
);
