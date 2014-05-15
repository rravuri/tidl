var should = require('should');
var tidl = require('../coverage/lib/tidl');
var assert = require("assert");
var from = require('fromjs');

describe('interface', function() {
	describe('interface header', function() {
		it('should parse an interface decleration with empty body.', function() {
			var res = tidl.parse('interface A exposes S { }');
			res.should.be.an.Object;
			res.model.should.be.an.instanceOf(tidl.IdlModel);
			var msg = from(res.messages).where(function(m) {
				return m.type == 'error'
			}).firstOrDefault();
			assert.equal(msg, null);
			res.model.Service.should.be.equal('S');
			res.model.should.have.property('Interfaces');
			var intfA = res.model.Interfaces['A'];
			intfA.Name.should.be.equal('A');
		});

		it('should parse a multi-line interface decleration.', function() {
			var res = tidl.parse('interface A \nexposes \nS \n  \t{ \n}');
			res.should.be.an.Object;
			res.model.should.be.an.instanceOf(tidl.IdlModel);
			var msg = from(res.messages).where(function(m) {
				return m.type == 'error'
			}).firstOrDefault();
			assert.equal(msg, null);
			res.model.Service.should.be.equal('S');
			res.model.should.have.property('Interfaces');
			var intfA = res.model.Interfaces['A'];
			intfA.Name.should.be.equal('A');
		});

		it('should parse an interface decleration with comments.', function() {
			var res = tidl.parse('interface A /*comments */ exposes \nS //comment\n  \t{ }');
			res.should.be.an.Object;
			res.model.should.be.an.instanceOf(tidl.IdlModel);
			var msg = from(res.messages).where(function(m) {
				return m.type == 'error'
			}).firstOrDefault();
			assert.equal(msg, null);
			res.model.Service.should.be.equal('S');
			res.model.should.have.property('Interfaces');
			var intfA = res.model.Interfaces['A'];
			intfA.Name.should.be.equal('A');
		});

		it('should report an error for missing }', function() {
			var res = tidl.parse('interface A exposes S { ');
			var msg = from(res.messages).where(function(m) {
				return m.code == '2003'
			}).firstOrDefault();
			assert.notEqual(msg, null, 'there should be an message with code 2003');
			assert.notEqual(msg, undefined, 'there should be an message with code 2003');
			msg.type.should.be.equal('error');
			msg.line.should.be.equal(1);
			msg.col.should.be.equal(23);
		});

		it('should report an error for missing exposes keyword', function() {
			var res = tidl.parse('interface A { }');
			var msg = from(res.messages).where(function(m) {
				return m.code == '2011'
			}).firstOrDefault();
			assert.notEqual(msg, null, 'there should be an message with code 2011');
			assert.notEqual(msg, undefined, 'there should be an message with code 2011');
			msg.type.should.be.equal('error');
			msg.line.should.be.equal(1);
			msg.col.should.be.equal(12);
		});

		it('should report an error for missing exposes keyword', function() {
			var res = tidl.parse('interface A xxx{ }');
			var msg = from(res.messages).where(function(m) {
				return m.code == '2011'
			}).firstOrDefault();
			assert.notEqual(msg, null, 'there should be an message with code 2011');
			assert.notEqual(msg, undefined, 'there should be an message with code 2011');
			msg.type.should.be.equal('error');
			msg.line.should.be.equal(1);
			msg.col.should.be.equal(12);
		});

		it('should report an error for missing service name', function() {
			var res = tidl.parse('interface A exposes { }');
			var msg = from(res.messages).where(function(m) {
				return m.code == '2013'
			}).firstOrDefault();
			assert.notEqual(msg, null, 'there should be an message with code 2013');
			assert.notEqual(msg, undefined, 'there should be an message with code 2013');
			msg.type.should.be.equal('error');
			msg.line.should.be.equal(1);
			msg.col.should.be.equal(20);
		});

		it('should report an error for bad interface name', function() {
			var res = tidl.parse('interface 1A { }');
			var msg = from(res.messages).where(function(m) {
				return m.code == '2010'
			}).firstOrDefault();
			assert.notEqual(msg, null, 'there should be an message with code 2010');
			assert.notEqual(msg, undefined, 'there should be an message with code 2010');
			msg.type.should.be.equal('error');
			msg.line.should.be.equal(1);
			msg.col.should.be.equal(10);
		});

		it('should report an error for bad interface name', function() {
			var res = tidl.parse('interface 1A { }');
			var msg = from(res.messages).where(function(m) {
				return m.code == '2010'
			}).firstOrDefault();
			assert.notEqual(msg, null, 'there should be an message with code 2010');
			assert.notEqual(msg, undefined, 'there should be an message with code 2010');
			msg.type.should.be.equal('error');
			msg.line.should.be.equal(1);
			msg.col.should.be.equal(10);
		});

		it('should report an error for bad interface name', function() {
			var res = tidl.parse('interface { }');
			var msg = from(res.messages).where(function(m) {
				return m.code == '2010'
			}).firstOrDefault();
			assert.notEqual(msg, null, 'there should be an message with code 2010');
			assert.notEqual(msg, undefined, 'there should be an message with code 2010');
			msg.type.should.be.equal('error');
			msg.line.should.be.equal(1);
			msg.col.should.be.equal(10);
		});

		it('should report an error for bad service name', function() {
			var res = tidl.parse('interface A exposes 1A { }');
			var msg = from(res.messages).where(function(m) {
				return m.code == '2013'
			}).firstOrDefault();
			assert.notEqual(msg, null, 'there should be an message with code 2013');
			assert.notEqual(msg, undefined, 'there should be an message with code 2013');
			msg.type.should.be.equal('error');
			msg.line.should.be.equal(1);
			msg.col.should.be.equal(20);
		});
		it('should report an info message for interface name', function() {
			var res = tidl.parse('interface a exposes A { }');
			var msg = from(res.messages).where(function(m) {
				return m.type == 'error'
			}).firstOrDefault();
			assert.equal(msg, null);
			msg = from(res.messages).where(function(m) {
				return m.code == '3001'
			}).firstOrDefault();
			assert.notEqual(msg, null, 'there should be an message with code 3001');
			assert.notEqual(msg, undefined, 'there should be an message with code 3001');
			msg.type.should.be.equal('info');
			msg.line.should.be.equal(1);
			msg.col.should.be.equal(10);
		});
	});

	describe('interface body', function() {
		it('should parse an interface body with comments.', function() {
			var res = tidl.parse('interface A exposes S { /* multi-line \n comment*/\n\t//test\n}');
			res.should.be.an.Object;
			res.model.should.be.an.instanceOf(tidl.IdlModel);
			var msg = from(res.messages).where(function(m) {
				return m.type == 'error'
			}).firstOrDefault();
			assert.equal(msg, null);
			res.model.Service.should.be.equal('S');
			res.model.should.have.property('Interfaces');
			var intfA = res.model.Interfaces['A'];
			intfA.Name.should.be.equal('A');
		});

		it('should report an warning for unexpected attribute', function() {
			var res = tidl.parse('interface A exposes S { \n@tidl 1.0.0; }');
			res.should.be.an.Object;
			res.model.should.be.an.instanceOf(tidl.IdlModel);
			var msg = from(res.messages).where(function(m) {
				return m.type == 'error'
			}).firstOrDefault();
			assert.equal(msg, null);
			msg = from(res.messages).where(function(m) {
				return m.code == '1003'
			}).firstOrDefault();
			assert.notEqual(msg, null, 'there should be an message with code 1003');
			assert.notEqual(msg, undefined, 'there should be an message with code 1003');
			msg.type.should.be.equal('warning');
			msg.line.should.be.equal(2);
			msg.col.should.be.equal(0);
		});
	});
});