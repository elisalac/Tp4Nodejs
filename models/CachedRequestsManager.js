import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";
import { log } from "../log.js";
import HttpContext from "../httpContext.js";
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
                        //return cache.content;
                        return cache;
                    }
                }
            }
        } catch (error) {
            console.log("cached request error!", error);
        }
        return null;
    }

    static clear(url) {
        // efface la cache associée à l'url
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let endpoint of cachedRequests) {
                if (endpoint.url.toLowerCase().indexOf(url.toLowerCase()) > -1)
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
                console.log("Cached request " + cache.url + "expired");
                indexToDelete.push(index);
            }
            index++;
        }
        utilities.deleteByIndex(cachedRequests, indexToDelete);
    }

    static get(HttpContext) {
        if (HttpContext.req.method == "GET") {
            let url = HttpContext.req.url;
            let cache = CachedRequestsManager.find(url);
            if (cache != null) {
                let content = JSON.parse(cache.content);
                let ETag = cache.ETag;
                HttpContext.response.JSON(content, ETag, true);
                return true;
            }
        }
        return false;
    }
}

setInterval(CachedRequestsManager.flushExpired, cachedRequestsExpirationTime * 1000);
log(BgWhite, FgBlack, "Periodic cached requests cleaning process started...");