var unexpected = require('unexpected'),
    AssetGraph = require('../lib'),
    passError = require('passerror'),
    Path = require('path');

describe('AssetGraph#populate()', function () {
    var expect = unexpected.clone();

    expect.addAssertion('to contain (asset|assets)', function (queryObj, number) {
        expect(this.obj.findAssets(queryObj).length, 'to equal', typeof number === 'number' ? number : 1);
    });

    expect.addAssertion('to contain (url|urls)', function (urls) {
        if (!Array.isArray(urls)) {
            urls = [urls];
        }
        urls = urls.map(function (url) {
            return URL.resolve(this.obj.root, url);
        });
        urls.forEach(function (url) {
            expect(this.obj.findAssets({url: url}).length, 'to equal', 1);
        });
    });

    expect.addAssertion('to contain (relation|relations)', function (queryObj, number) {
        expect(this.obj.findRelations(queryObj).length, 'to equal', number);
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
                expect(assetGraph, 'to contain urls', ['/some/place/there.js', '/bar/quux/foo.js'])
                done();
            }));
    });
});
