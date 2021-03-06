/*global setImmediate:true*/
// node 0.8 compat
if (typeof setImmediate === 'undefined') {
    setImmediate = process.nextTick;
}

var path = require('path'),
    _ = require('underscore'),
    async = require('async'),
    urlTools = require('urltools'),
    passError = require('passerror'),
    AssetGraph = require('../');

module.exports = function (queryObj) {
    return function compileLessToCss(assetGraph, cb) {
        var less,
            lessAssets = assetGraph.findAssets(_.extend({type: 'Less'}, queryObj));
        if (lessAssets.length > 0) {
            try {
                less = require('less');
            } catch (e) {
                assetGraph.emit('warn', new Error('compileLessToCss: Found ' + lessAssets.length + ' less asset(s), but no less compiler is available. Please install less in your project so compileLessToCss can require it.'));
                return setImmediate(cb);
            }
        }
        async.each(lessAssets, function (lessAsset, cb) {
            var lessOptions = {relativeUrls: true},
                nonInlineAncestor = lessAsset.nonInlineAncestor;
                // If the Less asset has a file:// url, add its directory to the Less parser's search path
            // so @import statements work:
            if (/^file:/.test(nonInlineAncestor.url)) {
                lessOptions.paths = [path.dirname(urlTools.fileUrlToFsPath(nonInlineAncestor.url))];
            }
            try {
                less.render(lessAsset.text, lessOptions, passError(cb, function (cssText) {
                    var cssAsset = new AssetGraph.Css({
                        text: cssText
                    });
                    if (lessAsset.url) {
                        cssAsset.url = lessAsset.url.replace(/\.less$|$/, cssAsset.defaultExtension);
                    }
                    lessAsset.replaceWith(cssAsset);
                    cssAsset.incomingRelations.forEach(function (incomingRelation) {
                        if (incomingRelation.type === 'HtmlStyle') {
                            var relAttributeValue = incomingRelation.node.getAttribute('rel');
                            if (relAttributeValue) {
                                incomingRelation.node.setAttribute('rel', relAttributeValue.replace(/\bstylesheet\/less\b/, 'stylesheet'));
                                incomingRelation.from.markDirty();
                            }
                        }
                    });
                    cb();
                }));
            } catch (e) {
                cb(new Error('Less compiler threw an exception: ' + require('util').inspect(e)));
            }
        }, cb);
    };
};
