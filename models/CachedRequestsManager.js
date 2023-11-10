import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";
import { log } from "../log.js";
let cachedRequestsExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

globalThis.cachedRequests = [];

export default class CachedRequestsManager {

    static add(url, content, ETag = "") {
        // mise en cache
        if (url != "") {
            CachedRequestsManager.clear(url);
            cachedRequests.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + cachedRequestsExpirationTime
            });

            console.log("Url " + url + " has been added to the cache");
        }
    }

    static find(url) {
        // retourne la cache associée à l'url
        try {
            if (url != "") {
                for (let cache of cachedRequests) {
                    if (cache.url == url) {
                        cache.Expire_Time = utilities.nowInSeconds() + cachedRequestsExpirationTime;
                        console.log("Url " + url + " has been retreived.")
                        return cache.content;
                    }
                }
            }
        } catch (error) {
            console.log("cached request error!", error);
        }
    }

    static clear(url) {
        // efface la cache associée à l'url
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let cache of cachedRequests) {
                if (cache.url == url)
                    indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(cachedRequests, indexToDelete);
        }
    }

    static flushExpired() {
        // efface les caches expirées
        let indexToDelete = [];
        let index = 0;
        let now = utilities.nowInSeconds();
        for (let cache of cachedRequests) {
            if (cache.Expire_Time < now) {
                console.log("Cached request " + url + "expired");
                indexToDelete.push(index);
            }
            index++;
        }
        utilities.deleteByIndex(cachedRequests, indexToDelete);
    }

    static get(HttpContext) {
        let url = HttpContext.request.url;
        let cache = this.find(url);
        if (cache != null) {
            const content = cache.content;
            const ETag = cache.ETag;
            HttpContext.response.JSON(content, ETag, true);
        }
    }
}

setInterval(CachedRequestsManager.flushExpired, cachedRequestsExpirationTime * 1000);
log(BgWhite, FgBlack, "Periodic cached requests cleaning process started...");