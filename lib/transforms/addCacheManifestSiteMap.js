var URL = require('url'),
    path = require('path'),
    _ = require('underscore'),
    error = require('../error'),
    assets = require('../assets'),
    relations = require('../relations'),
    fileUtils = require('../fileUtils');

exports.addCacheManifestSiteMap = function () {
    return function addCacheManifestSiteMap(assetGraph, cb) {
        var allManifests = [],
            sharedManifest;
        assetGraph.findAssets({isInitial: true, type: 'HTML'}).forEach(function (htmlAsset) {
            var existingManifestRelations = assetGraph.findRelations({from: htmlAsset, type: 'HTMLCacheManifest'});
            if (existingManifestRelations.length > 1) {
                cb(new Error("addCacheManifestSiteMap: Consistency error -- " + htmlAsset + " has more than one cache manifest relations"));
            } else if (existingManifestRelations.length === 1) {
                if (allManifests.indexOf(existingManifestRelations[0].to) === -1) {
                    allManifests.push(existingManifestRelations[0].to);
                }
            } else {
                if (!sharedManifest) {
                    sharedManifest = new assets.CacheManifest({
                        isDirty: true,
                        parseTree: {} // Hmm, FIXME, "new" really means new here :)
                    });
                    sharedManifest.url = assetGraph.root + sharedManifest.id + '.' + sharedManifest.defaultExtension;
                    assetGraph.addAsset(sharedManifest);
                    allManifests.push(sharedManifest);
                }
                assetGraph.attachAndAddRelation(new relations.HTMLCacheManifest({
                    from: htmlAsset,
                    to: sharedManifest
                }));
            }
        });

        assetGraph.assets.forEach(function (asset) {
            if (asset.url) {
                allManifests.forEach(function (manifest) {
                    if (asset !== manifest && !assetGraph.findRelations({from: manifest, to: asset}).length) {
                        assetGraph.attachAndAddRelation(new relations.CacheManifestEntry({
                            from: manifest,
                            to: asset
                        }));
                    }
                });
            }
        });
        process.nextTick(cb);
    };
};