var should = require('should');
var tidl = require('../coverage/lib/tidl');
var assert = require("assert");
var from = require('fromjs');


describe('typedef', function() {
	it('may be specified at an interface scope.', function() {
		var idl = 'interface A exposes S { \n' +
			'typedef Identifier extends string { } '+
			' }';
		var res = tidl.parse(idl);
		var msg = from(res.messages).where(function(m) {
			return m.type == 'error';
		}).firstOrDefault();
		assert.equal(msg, null);
		var typedef=res.model.Interfaces.A.getTypedef('Identifier');
		assert.equal(typedef.Name, 'Identifier');
		assert.equal(typedef.BaseTypes[0], 'string');
	});
	it('may be specified at service scope.', function() {
		var idl = '@tidl 2.0.0; service S { \n' +
			'typedef Id extends string{\n' +
			'@description "test \ndescription";' +
			' }\n}';
		var res = tidl.parse(idl);
		var msg = from(res.messages).where(function(m) {
			return m.type == 'error';
		}).firstOrDefault();
		assert.equal(msg, null);
		var typedef=res.model.getTypedef('Id');
		assert.equal(typedef.Name, 'Id');
		assert.equal(typedef.BaseTypes[0], 'string');
		assert.equal(typedef.getDescription(),'test \ndescription');
	});
});
