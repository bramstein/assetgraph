var unexpected = require('unexpected'),
    AssetGraph = require('../lib'),
    passError = require('passerror'),
    URL = require('url'),
    urlTools = require('urltools'),
    Path = require('path');

describe('AssetGraph#populate()', function () {
    var expect = unexpected.clone();

    AssetGraph.prototype.inspect = function () {
        return ['AssetGraph'].concat(this.findAssets({isInline: false}).map(function (asset) {
            return '  ' + (asset.isLoaded ? ' ' : '!') + ' ' + urlTools.buildRelativeUrl(this.root, asset.url);
        }, this)).join('\n  ');
    };

    expect.addAssertion('to contain (asset|assets)', function (expect, subject, queryObj, number) {
        expect(subject.findAssets(queryObj).length, 'to equal', typeof number === 'number' ? number : 1);
    });

    expect.addAssertion('to contain (url|urls)', function (expect, subject, urls) {
        if (!Array.isArray(urls)) {
            urls = [urls];
        }
        urls = urls.map(function (url) {
            return URL.resolve(this.obj.root, url);
        }, this);
        urls.forEach(function (url) {
            expect(subject.findAssets({url: url}).length, 'to equal', 1);
        });
    });

    expect.addAssertion('to contain (relation|relations)', function (expect, subject, queryObj, number) {
        expect(subject.findRelations(queryObj).length, 'to equal', number);
    });

    it('should populate a graph with require.js correctly', function (done) {
        new AssetGraph({root: Path.resolve(__dirname, 'browserPopulate', 'requireJsWithMultipleConfigs')})
            .on('error', done)
            .on('warn', console.warn)
            .registerRequireJsConfig()
            .loadAssets('index.html')
            .browserPopulate()
            .run(passError(done, function (assetGraph) {
                expect(assetGraph, 'to contain assets', {type: 'JavaScript'}, 6);
                expect(assetGraph, 'to contain urls', ['some/place/there.js', 'bar/quux/baz.js']);
                done();
            }));
    });

    it('should bail out when conflicting configurations resolve a module name to different urls', function (done) {
        new AssetGraph({root: Path.resolve(__dirname, 'browserPopulate', 'multipleInitialAssetsWithConflictingRequireJsConfigs')})
            .on('error', done)
            .on('warn', function (err) {
                console.warn(err.stack);
            })
            .registerRequireJsConfig()
            .loadAssets('index*.html')
            .browserPopulate()
            .run(function (err, assetGraph) {
                expect(err, 'to be an', Error);
                expect(err.message, 'to equal', 'browserPopulate transform: The module name foo resolves to different urls in different contexts: ./bar/quux ./blah/quux');
                done();
            });
    });
});
