var util = require('util'),
    _ = require('underscore'),
    uglify = require('uglify-js'),
    uglifyAst = require('../util/uglifyAst'),
    extendWithGettersAndSetters = require('../util/extendWithGettersAndSetters'),
    relations = require('../relations'),
    Asset = require('./Asset'),
    urlTools = require('../util/urlTools');

function StaticUrlMap(config) {
    Asset.call(this, config);
    if (!this._parseTree) {
        throw new Error("assets.StaticUrlMap: parseTree config option is mandatory");
    }

    if (this._parseTree[0][0] === 'string') {
        // one.getStaticUrl('foo/bar', ...);
        var url = this._parseTree[0][1];

        this.originalWildCardRelation = new relations.StaticUrlMapEntry({
            from: this,
            href: url,
            to: url
        });
        this._outgoingRelations = [this.originalWildCardRelation];

        this.wildCardValueAsts = this._parseTree.slice(1);
    } else if (this._parseTree[0][0] === 'sub') {
        // one.getStaticUrl({foo: "bar"}[...]);

        this.relationByWildCardValues = {};
        this.wildCardValueAsts = [];
        var cursor = this._parseTree[0];

        while (cursor[0] === 'sub') {
            this.wildCardValueAsts.push(cursor[2]);
            cursor = cursor[1];
        }
        this._outgoingRelations = [];
        var keys = [],
            populateUrlByWildCardValues = function (node, relationByWildCardValuesCursor, nestingLevel) {
                if (nestingLevel > this.wildCardValueAsts.length || !node || node[0] !== 'object') {
                    throw new Error("assets.StaticUrlMap: Unsupported syntax: " + uglify.uglify.gen_code(this._parseTree[0]));
                }
                for (var i = 0 ; i < node[1].length ; i += 1) {
                    var key = node[1][i][0];
                    if (node[1][i][1][0] === 'string') {
                        if (nestingLevel !== this.wildCardValueAsts.length) {
                            throw new Error("assets.StaticUrlMap: Unsupported syntax: " + uglify.uglify.gen_code(this._parseTree[0]));
                        }
                        relationByWildCardValuesCursor[key] = new relations.StaticUrlMapEntry({
                            from: this,
                            href: node[1][i][1][1],
                            wildCardValues: [].concat(keys),
                            to: node[1][i][1][1]
                        });
                        this._outgoingRelations.push(relationByWildCardValuesCursor[key]);
                    } else {
                        // 'object'
                        relationByWildCardValuesCursor[key] = relationByWildCardValuesCursor[key] || {};
                        keys.push(key);
                        populateUrlByWildCardValues(node[1][i][1], relationByWildCardValuesCursor[key], nestingLevel + 1);
                        keys.pop(key);
                    }
                }
            }.bind(this);

        populateUrlByWildCardValues(cursor, this.relationByWildCardValues, 1);
    } else {
        throw new Error("assets.StaticUrlMap: Unsupported syntax: " + uglify.uglify.gen_code(this._parseTree[0]));
    }
}

util.inherits(StaticUrlMap, Asset);

extendWithGettersAndSetters(StaticUrlMap.prototype, {
    type: 'StaticUrlMap',

    toAst: function () {
        var expressionAst = (function convert(obj) {
            if (obj.isRelation) {
                if (!('href' in obj)) {
                    throw new Error("StaticUrlMap.toAst assertion error: Relation has no href: " + obj);
                }
                return ['string', obj.href];
            } else {
                return ['object', _.map(obj, function (value, key) {
                    return [key, convert(value)];
                })];
            }
        }(this.relationByWildCardValues || this.originalWildCardRelation));
        this.wildCardValueAsts.forEach(function (wildCardValueAst) {
            expressionAst = ['sub', expressionAst, wildCardValueAst];
        });
        return expressionAst;
    }
});

module.exports = StaticUrlMap;