var _ = require('underscore');

module.exports = function (queryObj, options) {
    options = options || {};
    var rulesPerStylesheetLimit = options.rulesPerStylesheetLimit || 4095,
        countRules = function (cssRules) {
            var count = 0;

            // FIXME: Verify that this counting algorithm is identical to what IE does
            cssRules.forEach(function (rule) {
                if (rule.selectorText) {
                    count += rule.selectorText.split(',').length;
                } else if (rule.type === 4) { // MEDIA_RULE
                    count += countRules(rule.cssRules);
                }
            });

            return count;
        },
        splitStyleSheet = function (cssAsset) {
            var output = [],
                accumulatedRules = 0,
                offset = 0;

            cssAsset.parseTree.cssRules.forEach(function (rule, idx) {
                var selectors = countRules([rule]);

                if (accumulatedRules + selectors <= rulesPerStylesheetLimit) {
                    accumulatedRules += selectors;
                } else {
                    output.push({
                        type: cssAsset.type,
                        isPopulated: false,
                        text: cssAsset.parseTree.cssRules.slice(offset, idx).map(function (cssRule) {
                                return cssRule.cssText;
                            }).join('')
                    });

                    offset = idx;
                    accumulatedRules = selectors;
                }
            });

            output.push({
                type: cssAsset.type,
                isPopulated: false,
                text: cssAsset.parseTree.cssRules.slice(offset).map(function (cssRule) {
                        return cssRule.cssText;
                    }).join('')
            });

            return output;
        };

    return function splitCssIfIeLimitIsReached(assetGraph) {
        assetGraph.findAssets(_.extend({type: 'Css', isLoaded: true}, queryObj)).forEach(function (largeAsset) {
            var count = countRules(largeAsset.parseTree.cssRules),
                info,
                replacements;

            if (count > rulesPerStylesheetLimit) {
                replacements = splitStyleSheet(largeAsset);

                info = {
                    message: count + ' CSS rules, ' + (count - rulesPerStylesheetLimit) + ' would be ignored by IE9 and below. Splitting into ' + replacements.length + ' chunks to resolve the problem.',
                    asset: largeAsset
                };

                assetGraph.emit('info', info);

                // Add replacement css assets to the graph
                replacements = replacements.map(function (replacement, idx) {
                    var asset = assetGraph.createAsset(replacement);

                    if (!largeAsset.isInline) {
                        asset.url = require('url').resolve(largeAsset.url, largeAsset.fileName.split('.').shift() + '-' + idx + largeAsset.extension);
                    }

                    assetGraph.addAsset(asset);

                    return asset;
                });

                // Add relations to new replacement assets to the graph
                largeAsset.incomingRelations.forEach(function (oldRelation) {
                    replacements.forEach(function (replacement) {
                        var newIncomingRelation = new assetGraph[oldRelation.type]({
                            to: replacement
                        });
                        newIncomingRelation.attach(oldRelation.from, 'before', oldRelation);
                        if (replacement.isInline) {
                            newIncomingRelation.inline();
                        }
                    });
                });

                // Remove all traces of the oiginal to large Css asset
                assetGraph.removeAsset(largeAsset, true);
            }
        });
    };
};
