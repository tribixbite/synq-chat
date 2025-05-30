/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";

import { HASH_PREFIX, HASH_REGEX } from "@shared/constants";

declare const self: ServiceWorkerGlobalScope & {
	__WB_DISABLE_DEV_LOGS: boolean;
	__WB_MANIFEST: { url: string }[];
};
self.__WB_DISABLE_DEV_LOGS = true;
const manifest = self.__WB_MANIFEST;

const cacheName = "sw-cache";
const cacheFirstWithoutHashFileTypes = [".webp", ".ttf", ".woff", ".woff2"];

const isCacheFirstWithHash = (filename: string) => HASH_REGEX.test(filename);

const isCacheFirstWithoutHash = (filename: string) =>
	cacheFirstWithoutHashFileTypes.some(fileType =>
		filename.toLowerCase().endsWith(fileType.toLowerCase())
	);

self.addEventListener("install", event => {
	self.skipWaiting();
	event.waitUntil(
		(async () => {
			const cache = await caches.open(cacheName);
			if (!cache) return;
			const urlsToPrecache = [
				"/",
				...(manifest?.map(entry => (typeof entry === "string" ? entry : entry.url)) ?? [])
			];
			await cache.addAll(urlsToPrecache);
		})().catch(console.error)
	);
});
self.addEventListener("activate", event => {
	event.waitUntil(
		(async () => {
			const existingCacheNames = await caches.keys();
			await Promise.all(
				existingCacheNames
					.filter(existingCacheName => existingCacheName !== cacheName)
					.map(existingCacheName => caches.delete(existingCacheName))
			);
		})().catch(console.error)
	);
});

const isCacheFirstRequest = (url: URL) => {
	if (isCacheFirstWithoutHash(url.href)) return true;
	if (!isCacheFirstWithHash(url.href)) return false;
	// delete stale cache entries asynchronously
	(async () => {
		const urlPrefix = url.href.split(HASH_PREFIX)[0];
		const hash = url.href.split(HASH_PREFIX)[1];
		const urlSuffixSplit = url.href.split(".");
		const urlSuffix = urlSuffixSplit[urlSuffixSplit.length - 1];
		const cache = await caches.open(cacheName);
		if (!cache) return;
		const entries = await cache.keys();
		await Promise.all(
			entries
				.filter(
					entry =>
						entry.url.startsWith(urlPrefix) &&
						entry.url.endsWith(urlSuffix) &&
						hash !== entry.url.split(HASH_PREFIX)[1]
				)
				.map(entry => cache.delete(entry))
		);
	})().catch(console.error);
	return true;
};

// registerRoute(({ url }) => url.href.includes("/socket.io/"), new NetworkOnly());

registerRoute(({ url }) => isCacheFirstRequest(url), new CacheFirst({ cacheName }));

registerRoute(() => true, new NetworkFirst({ cacheName }));

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST || []);

const fileExtensionRegexp = /\/[^\/?]+\.[^\/]+$/;
const navigationRoute = new NavigationRoute(createHandlerBoundToURL("/index.html"), {
	denylist: [fileExtensionRegexp]
});
registerRoute(navigationRoute);

registerRoute(
	({ url }) => url.origin === self.location.origin && url.pathname.endsWith(".png"),
	new StaleWhileRevalidate({
		cacheName: "images",
		plugins: [new ExpirationPlugin({ maxEntries: 50 })]
	})
);

registerRoute(
	({ url }) =>
		url.origin === self.location.origin &&
		(url.pathname.endsWith(".woff2") || url.pathname.endsWith(".svg")),
	new CacheFirst({
		cacheName: "static-assets",
		plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 })]
	})
);

self.addEventListener("message", event => {
	if (event.data && event.data.type === "SKIP_WAITING") {
		self.skipWaiting();
	}
});
