var should = require('should');
var tidl = require('../coverage/lib/tidl');
var assert = require("assert");
var from = require('fromjs');


describe('@tidl', function() {
	// it('should warn missing tidl attribute',function() {
	//     var res=tidl.parse('interface a exposes b { }');
	//     res.should.be.an.Object;
	//     res.model.should.be.an.instanceOf(tidl.IdlModel);
	//     res.messages.should.be.an.instanceOf(Array);
	//     res.messages.length.should.be.above(1);
	//     console.log(res.messages[0]);
	// });
	it('should parse a valid tidl attribute string', function() {
		var res = tidl.parse('@tidl 1.0.0-pre+2.2.3;');
		res.should.be.an.Object;
		res.model.should.be.an.instanceOf(tidl.IdlModel);
		var msg = from(res.messages).where(function(m) {
			return m.type == 'error'
		}).firstOrDefault();
		assert.equal(msg, null);
		res.model.should.have.property('Attributes').with.lengthOf(1);
		var tidlattr = res.model.Attributes[0];
		tidlattr.should.be.an.instanceOf(tidl.IdlAttr);
		tidlattr.Name.should.be.equal('tidl');
		tidlattr.Values.should.be.an.instanceOf(Array).with.lengthOf(1);
		tidlattr.Values[0].should.be.equal('1.0.0-pre+2.2.3');
	});

	it('should parse tidl attribute with valid semver version strings', function() {
		var res = tidl.parse('@tidl 1.0.0;');
		var tidlattr = res.model.Attributes[0];
		tidlattr.Values[0].should.be.equal('1.0.0');
		var msg = from(res.messages).where(function(m) {
			return m.type == 'error'
		}).firstOrDefault();
		assert.equal(msg, null);

		res = tidl.parse('@tidl 1.0.0-alpha;');
		tidlattr = res.model.Attributes[0];
		tidlattr.Values[0].should.be.equal('1.0.0-alpha');
		var msg = from(res.messages).where(function(m) {
			return m.type == 'error'
		}).firstOrDefault();
		assert.equal(msg, null);

		res = tidl.parse('@tidl 1.0.0-0.10.0;');
		tidlattr = res.model.Attributes[0];
		tidlattr.Values[0].should.be.equal('1.0.0-0.10.0');
		var msg = from(res.messages).where(function(m) {
			return m.type == 'error'
		}).firstOrDefault();
		assert.equal(msg, null);

		res = tidl.parse('@tidl 1.0.0-alpha+20140516;');
		tidlattr = res.model.Attributes[0];
		tidlattr.Values[0].should.be.equal('1.0.0-alpha+20140516');
		var msg = from(res.messages).where(function(m) {
			return m.type == 'error'
		}).firstOrDefault();
		assert.equal(msg, null);

		res = tidl.parse('@tidl 1.0.0+20140516;');
		tidlattr = res.model.Attributes[0];
		tidlattr.Values[0].should.be.equal('1.0.0+20140516');
		var msg = from(res.messages).where(function(m) {
			return m.type == 'error'
		}).firstOrDefault();
		assert.equal(msg, null);

		res = tidl.parse('@tidl 1.0.0+2014.05.16;');
		tidlattr = res.model.Attributes[0];
		tidlattr.Values[0].should.be.equal('1.0.0+2014.05.16');
		var msg = from(res.messages).where(function(m) {
			return m.type == 'error'
		}).firstOrDefault();
		assert.equal(msg, null);

	});

	it('should parse tidl attribute with comment inline', function() {
		var res = tidl.parse('@tidl  1.0.0;// comment ');
		var tidlattr = res.model.Attributes[0];
		tidlattr.Values[0].should.be.equal('1.0.0');
		var msg = from(res.messages).where(function(m) {
			return m.type == 'error'
		}).firstOrDefault();
		assert.equal(msg, null);
	});

	it('should parse tidl attribute with block comment inline', function() {
		var res = tidl.parse('@tidl /* comment */ 1.0.0;');
		var tidlattr = res.model.Attributes[0];
		tidlattr.Values[0].should.be.equal('1.0.0');
		var msg = from(res.messages).where(function(m) {
			return m.type == 'error'
		}).firstOrDefault();
		assert.equal(msg, null);
	});

	it('should parse tidl attribute with multi line comments inline', function() {
		var res = tidl.parse('@tidl  1.0.0/* comment \n */;');
		var tidlattr = res.model.Attributes[0];
		tidlattr.Values[0].should.be.equal('1.0.0');
		var msg = from(res.messages).where(function(m) {
			return m.type == 'error'
		}).firstOrDefault();
		assert.equal(msg, null);
	});

	it('should report an error for bad syntax.', function() {
		var res = tidl.parse('@tidl "error";');
		var msg = from(res.messages).where(function(m) {
			return m.code == '2003'
		}).firstOrDefault();
		assert.notEqual(msg, null, 'there should be a message with code 2003');
		assert.notEqual(msg, undefined, 'there should be a message with code 2003');
		msg.type.should.be.equal('error');
		msg.line.should.be.equal(1);
		msg.col.should.be.equal(6);
	});

	it('should report an error for bad syntax.', function() {
		var res = tidl.parse('@tidl ;');
		var msg = from(res.messages).where(function(m) {
			return m.code == '2003'
		}).firstOrDefault();
		assert.notEqual(msg, null, 'there should be a message with code 2003');
		assert.notEqual(msg, undefined, 'there should be a message with code 2003');
		msg.type.should.be.equal('error');
		msg.line.should.be.equal(1);
		msg.col.should.be.equal(6);
	});
	it('should report a warning for additional parameters.', function() {
		var res = tidl.parse('@tidl 1.0.0,"test";');
		var msg = from(res.messages).where(function(m) {
			return m.code == '1002'
		}).firstOrDefault();
		assert.notEqual(msg, null, 'there should be a message with code 1002');
		assert.notEqual(msg, undefined, 'there should be a message with code 1002');
		msg.type.should.be.equal('warning');
		msg.line.should.be.equal(1);
		msg.col.should.be.equal(12);
	});
	it('should report a warning for duplicate attribute.', function() {
		var res = tidl.parse('@tidl 1.0.0;\n@tidl 1.0.0;');
		var msg = from(res.messages).where(function(m) {
			return m.code == '1004'
		}).firstOrDefault();
		assert.notEqual(msg, null, 'there should be a message with code 1004');
		assert.notEqual(msg, undefined, 'there should be a message with code 1004');
		msg.type.should.be.equal('warning');
		msg.line.should.be.equal(2);
		msg.col.should.be.equal(0);
	});
	it('should report an error for tidl attribute version less than 2 when using service keyword.', function() {
		var res = tidl.parse('@tidl 1.0.0; \nservice S { }');
		var msg = from(res.messages).where(function(m) {
			return m.code == '1005'
		}).firstOrDefault();
		assert.notEqual(msg, null, 'there should be a message with code 1005');
		assert.notEqual(msg, undefined, 'there should be a message with code 1005');
		msg.type.should.be.equal('error');
		msg.line.should.be.equal(2);
		msg.col.should.be.equal(0);
	});
	it('should report a warning for tidl attribute in service scope.', function() {
		var res = tidl.parse('@tidl 2.0.0; service S { \n@tidl 1.0.0;\n}');
		var msg = from(res.messages).where(function(m) {
			return m.code == '1006'
		}).firstOrDefault();
		assert.notEqual(msg, null, 'there should be a message with code 1006');
		assert.notEqual(msg, undefined, 'there should be a message with code 1006');
		msg.type.should.be.equal('warning');
		msg.line.should.be.equal(2);
		msg.col.should.be.equal(0);
	});
	it('should report a warning for tidl attribute in interface scope.', function() {
		var res = tidl.parse('interface A exposes S{ \n@tidl 1.0.0;\n}');
		var msg = from(res.messages).where(function(m) {
			return m.code == '1003'
		}).firstOrDefault();
		assert.notEqual(msg, null, 'there should be a message with code 1003');
		assert.notEqual(msg, undefined, 'there should be a message with code 1003');
		msg.type.should.be.equal('warning');
		msg.line.should.be.equal(2);
		msg.col.should.be.equal(0);
	});
	it('should report a warning for tidl attribute in operation scope.', function() {
		var res = tidl.parse('interface A exposes S{ \nint add(int x,int y){\n@tidl 1.0.0;\n}}');
		var msg = from(res.messages).where(function(m) {
			return m.code == '1007'
		}).firstOrDefault();
		assert.notEqual(msg, null, 'there should be a message with code 1007');
		assert.notEqual(msg, undefined, 'there should be a message with code 1007');
		msg.type.should.be.equal('warning');
		msg.line.should.be.equal(3);
		msg.col.should.be.equal(0);
	});
});