var should = require('should');
var tidl = require('../lib/tidl');
var assert = require("assert");
var from=require('fromjs');


describe('tidl', function() {
	describe('#IdlModel',function(){
		it('should be a function', function() {
			tidl.IdlModel.should.be.an.Function;
		});
		it('should have a property "Service" of type string',function(){
			var model=new tidl.IdlModel();
			model.Service.should.be.type('string');
		});
		it('should have a property "Attributes" of type Array',function(){
			var model=new tidl.IdlModel();
			model.Attributes.should.be.an.instanceOf(Array);
		});
		it('should have a property "Types" of type Array',function(){
	    	var model=new tidl.IdlModel();
	    	model.Types.should.be.an.instanceOf(Array);
	    });
	    it('should have a property "Enumerations" of type Array',function(){
	    	var model=new tidl.IdlModel();
	    	model.Enumerations.should.be.an.instanceOf(Array);
	    });
	    it('should have a property "Exceptions" of type Array',function(){
	    	var model=new tidl.IdlModel();
	    	model.Exceptions.should.be.an.instanceOf(Array);
	    });
	    it('should have a property "Events" of type Array',function(){
	    	var model=new tidl.IdlModel();
	    	model.Events.should.be.an.instanceOf(Array);
	    });
	    it('should have a property "Interfaces" of type object',function(){
	    	var model=new tidl.IdlModel();
	    	model.Interfaces.should.be.type('object');
	    });
	    it('should have a function "clone"',function(){
	    	var model=new tidl.IdlModel();
	    	should.exist(model.clone);
	    	model.clone.should.be.an.Function;
	    });
	});

	describe('#IdlAttr',function(){
	    it('should be a function', function() {
	        tidl.IdlAttr.should.be.an.Function;
	    });
	});

	describe('#IdlIntf',function(){
	    it('should be a function', function() {
	        tidl.IdlIntf.should.be.an.Function;
	    });
	});

	describe('#IdlOps',function(){
	    it('should be a function', function() {
	        tidl.IdlOps.should.be.an.Function;
	    });
	});

	describe('#IdlType',function(){
	    it('should be a function', function() {
	        tidl.IdlType.should.be.an.Function;
	    });
	});

	describe('#IdlParam',function(){
	    it('should be a function', function() {
	        tidl.IdlParam.should.be.an.Function;
	    });
	});

	describe('#Messages',function(){
	    it('should be an Object', function() {
	        tidl.Messages.should.be.an.Object;
	    });
	});

	describe('#parse()',function(){
	    it('should be of type function',function() {
	        tidl.parse.should.be.an.Function;
	    });

	    it('should return null when "parse" method is invoked with no arguments',function() {
	        assert.equal(tidl.parse(),null);
	    });

	    it('should return null when "parse" method is invoked with null value as the first argument',function() {
	        assert.equal(tidl.parse(null), null);
	    });

	    it('should parse a empty string',function() {
	        var res=tidl.parse('');
	        res.should.be.an.Object;
	        res.model.should.be.an.instanceOf(tidl.IdlModel);
	        res.messages.should.be.an.instanceOf(Array);
	    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
	    	assert.equal(msg,null);
	    });

	    it('should parse a string with just comments',function() {
	        var res=tidl.parse('//test\n /* block comment */\n /* multi-line \n comment*/');
	        res.should.be.an.Object;
	        res.model.should.be.an.instanceOf(tidl.IdlModel);
	        res.messages.should.be.an.instanceOf(Array);
	    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
	    	assert.equal(msg,null);
	    }); 

 		it('should report an error for unexpected character.',function() {
	        var res=tidl.parse('asfasf');
	    	var msg=from(res.messages).where(function(m){return m.code=='2002'}).firstOrDefault();
	    	assert.notEqual(msg,null,'there should be an message with code 2002');
	    	assert.notEqual(msg,undefined,'there should be an message with code 2002');
	    	msg.type.should.be.equal('error');
	    	msg.line.should.be.equal(1);
	    	msg.col.should.be.equal(0);
	    });

 		it('should report an warning for missing tidl attribute.',function() {
	        var res=tidl.parse('@description "test";');
	    	var msg=from(res.messages).where(function(m){return m.code=='1001'}).firstOrDefault();
	    	assert.notEqual(msg,null,'there should be an message with code 1001');
	    	assert.notEqual(msg,undefined,'there should be an message with code 1001');
	    	msg.type.should.be.equal('warning');
	    	msg.line.should.be.equal(1);
	    	msg.col.should.be.equal(0);

	    });
		
		describe('@tidl',function(){
		    it('should parse a valid tidl attribute string',function() {
		        var res=tidl.parse('@tidl 1.0.0-pre+2.2.3;');
		        res.should.be.an.Object;
		        res.model.should.be.an.instanceOf(tidl.IdlModel);
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);
		        res.model.should.have.property('Attributes').with.lengthOf(1);
		        var tidlattr=res.model.Attributes[0];
		        tidlattr.should.be.an.instanceOf(tidl.IdlAttr);
		        tidlattr.Name.should.be.equal('tidl');
		        tidlattr.Values.should.be.an.instanceOf(Array).with.lengthOf(1);
		        tidlattr.Values[0].should.be.equal('1.0.0-pre+2.2.3');
		    });

		    it('should parse tidl attribute with valid semver version strings',function() {
		        var res=tidl.parse('@tidl 1.0.0;');
		        var tidlattr=res.model.Attributes[0];
		        tidlattr.Values[0].should.be.equal('1.0.0');
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);

		        res=tidl.parse('@tidl 1.0.0-alpha;');
		        tidlattr=res.model.Attributes[0];
		        tidlattr.Values[0].should.be.equal('1.0.0-alpha');
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);

		        res=tidl.parse('@tidl 1.0.0-0.10.0;');
		        tidlattr=res.model.Attributes[0];
		        tidlattr.Values[0].should.be.equal('1.0.0-0.10.0');
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);

		        res=tidl.parse('@tidl 1.0.0-alpha+20140516;');
		        tidlattr=res.model.Attributes[0];
		        tidlattr.Values[0].should.be.equal('1.0.0-alpha+20140516');
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);

		        res=tidl.parse('@tidl 1.0.0+20140516;');
		        tidlattr=res.model.Attributes[0];
		        tidlattr.Values[0].should.be.equal('1.0.0+20140516');
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);

		        res=tidl.parse('@tidl 1.0.0+2014.05.16;');
		        tidlattr=res.model.Attributes[0];
		        tidlattr.Values[0].should.be.equal('1.0.0+2014.05.16');
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);

		    });

			it('should parse tidl attribute with comment inline',function() {
		        var res=tidl.parse('@tidl  1.0.0;// comment ');
		        var tidlattr=res.model.Attributes[0];
		        tidlattr.Values[0].should.be.equal('1.0.0');
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);
		    });

			it('should parse tidl attribute with block comment inline',function() {
		        var res=tidl.parse('@tidl /* comment */ 1.0.0;');
		        var tidlattr=res.model.Attributes[0];
		        tidlattr.Values[0].should.be.equal('1.0.0');
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);
		    });

			it('should parse tidl attribute with multi line comments inline',function() {
		        var res=tidl.parse('@tidl  1.0.0/* comment \n */;');
		        var tidlattr=res.model.Attributes[0];
		        tidlattr.Values[0].should.be.equal('1.0.0');
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);
		    });

	 		it('should report an error for bad syntax.',function() {
	 			var res=tidl.parse('@tidl "error";');
		    	var msg=from(res.messages).where(function(m){return m.code=='2003'}).firstOrDefault();
		    	assert.notEqual(msg,null,'there should be an message with code 2003');
		    	assert.notEqual(msg,undefined,'there should be an message with code 2003');
		    	msg.type.should.be.equal('error');
		    	msg.line.should.be.equal(1);
		    	msg.col.should.be.equal(6);
	 		});

	 		it('should report an error for bad syntax.',function() {
	 			var res=tidl.parse('@tidl ;');
		    	var msg=from(res.messages).where(function(m){return m.code=='2003'}).firstOrDefault();
		    	assert.notEqual(msg,null,'there should be an message with code 2003');
		    	assert.notEqual(msg,undefined,'there should be an message with code 2003');
		    	msg.type.should.be.equal('error');
		    	msg.line.should.be.equal(1);
		    	msg.col.should.be.equal(6);
	 		});
	 	});

		describe('interface header',function(){
	 		it('should parse an interface decleration with empty body.',function() {
		        var res=tidl.parse('interface A exposes S { }');
		        res.should.be.an.Object;
		        res.model.should.be.an.instanceOf(tidl.IdlModel);
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);
		        res.model.Service.should.be.equal('S');
		        res.model.should.have.property('Interfaces');
		        var intfA=res.model.Interfaces['A'];
		        intfA.Name.should.be.equal('A');
		    });

	 		it('should parse a multi-line interface decleration.',function() {
		        var res=tidl.parse('interface A \nexposes \nS \n  \t{ \n}');
		        res.should.be.an.Object;
		        res.model.should.be.an.instanceOf(tidl.IdlModel);
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);
		        res.model.Service.should.be.equal('S');
		        res.model.should.have.property('Interfaces');
		        var intfA=res.model.Interfaces['A'];
		        intfA.Name.should.be.equal('A');
		    });

	 		it('should parse an interface decleration with comments.',function() {
		        var res=tidl.parse('interface A /*comments */ exposes \nS //comment\n  \t{ }');
		        res.should.be.an.Object;
		        res.model.should.be.an.instanceOf(tidl.IdlModel);
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);
		        res.model.Service.should.be.equal('S');
		        res.model.should.have.property('Interfaces');
		        var intfA=res.model.Interfaces['A'];
		        intfA.Name.should.be.equal('A');
		    });

	 		it('should report an error for missing }',function() {
		        var res=tidl.parse('interface A exposes S { ');
		    	var msg=from(res.messages).where(function(m){return m.code=='2003'}).firstOrDefault();
		    	assert.notEqual(msg,null,'there should be an message with code 2003');
		    	assert.notEqual(msg,undefined,'there should be an message with code 2003');
		    	msg.type.should.be.equal('error');
		    	msg.line.should.be.equal(1);
		    	msg.col.should.be.equal(23);
		    });

	 		it('should report an error for missing exposes keyword',function() {
		        var res=tidl.parse('interface A { }');
		    	var msg=from(res.messages).where(function(m){return m.code=='2011'}).firstOrDefault();
		    	assert.notEqual(msg,null,'there should be an message with code 2011');
		    	assert.notEqual(msg,undefined,'there should be an message with code 2011');
		    	msg.type.should.be.equal('error');
		    	msg.line.should.be.equal(1);
		    	msg.col.should.be.equal(12);
		    });

	 		it('should report an error for missing exposes keyword',function() {
		        var res=tidl.parse('interface A xxx{ }');
		    	var msg=from(res.messages).where(function(m){return m.code=='2011'}).firstOrDefault();
		    	assert.notEqual(msg,null,'there should be an message with code 2011');
		    	assert.notEqual(msg,undefined,'there should be an message with code 2011');
		    	msg.type.should.be.equal('error');
		    	msg.line.should.be.equal(1);
		    	msg.col.should.be.equal(12);
		    });

	 		it('should report an error for missing service name',function() {
		        var res=tidl.parse('interface A exposes { }');
		    	var msg=from(res.messages).where(function(m){return m.code=='2013'}).firstOrDefault();
		    	assert.notEqual(msg,null,'there should be an message with code 2013');
		    	assert.notEqual(msg,undefined,'there should be an message with code 2013');
		    	msg.type.should.be.equal('error');
		    	msg.line.should.be.equal(1);
		    	msg.col.should.be.equal(20);
		    });

			it('should report an error for bad interface name',function() {
		        var res=tidl.parse('interface 1A { }');
		    	var msg=from(res.messages).where(function(m){return m.code=='2010'}).firstOrDefault();
		    	assert.notEqual(msg,null,'there should be an message with code 2010');
		    	assert.notEqual(msg,undefined,'there should be an message with code 2010');
		    	msg.type.should.be.equal('error');
		    	msg.line.should.be.equal(1);
		    	msg.col.should.be.equal(10);
		    });

	 		it('should report an error for bad interface name',function() {
		        var res=tidl.parse('interface 1A { }');
		    	var msg=from(res.messages).where(function(m){return m.code=='2010'}).firstOrDefault();
		    	assert.notEqual(msg,null,'there should be an message with code 2010');
		    	assert.notEqual(msg,undefined,'there should be an message with code 2010');
		    	msg.type.should.be.equal('error');
		    	msg.line.should.be.equal(1);
		    	msg.col.should.be.equal(10);
		    });

	 		it('should report an error for bad interface name',function() {
		        var res=tidl.parse('interface { }');
		    	var msg=from(res.messages).where(function(m){return m.code=='2010'}).firstOrDefault();
		    	assert.notEqual(msg,null,'there should be an message with code 2010');
		    	assert.notEqual(msg,undefined,'there should be an message with code 2010');
		    	msg.type.should.be.equal('error');
		    	msg.line.should.be.equal(1);
		    	msg.col.should.be.equal(10);
		    });

	 		it('should report an error for bad service name',function() {
		        var res=tidl.parse('interface A exposes 1A { }');
		    	var msg=from(res.messages).where(function(m){return m.code=='2013'}).firstOrDefault();
		    	assert.notEqual(msg,null,'there should be an message with code 2013');
		    	assert.notEqual(msg,undefined,'there should be an message with code 2013');
		    	msg.type.should.be.equal('error');
		    	msg.line.should.be.equal(1);
		    	msg.col.should.be.equal(20);
		    });
	 		it('should report an info message for interface name',function() {
		        var res=tidl.parse('interface a exposes A { }');
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);
		    	msg=from(res.messages).where(function(m){return m.code=='3001'}).firstOrDefault();
		    	assert.notEqual(msg,null,'there should be an message with code 3001');
		    	assert.notEqual(msg,undefined,'there should be an message with code 3001');
		    	msg.type.should.be.equal('info');
		    	msg.line.should.be.equal(1);
		    	msg.col.should.be.equal(10);
		    });
	 	});

		describe('interface body', function(){
	 		it('should parse an interface body with comments.',function() {
		        var res=tidl.parse('interface A exposes S { /* multi-line \n comment*/\n\t//test\n}');
		        res.should.be.an.Object;
		        res.model.should.be.an.instanceOf(tidl.IdlModel);
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);
		        res.model.Service.should.be.equal('S');
		        res.model.should.have.property('Interfaces');
		        var intfA=res.model.Interfaces['A'];
		        intfA.Name.should.be.equal('A');
		    });

		    it('should report an warning for unexpected attribute', function(){
		    	var res=tidl.parse('interface A exposes S { \n@tidl 1.0.0; }');
		        res.should.be.an.Object;
		        res.model.should.be.an.instanceOf(tidl.IdlModel);
		    	var msg=from(res.messages).where(function(m){return m.type=='error'}).firstOrDefault();
		    	assert.equal(msg,null);
		    	msg=from(res.messages).where(function(m){return m.code=='1003'}).firstOrDefault();
		    	assert.notEqual(msg,null,'there should be an message with code 1003');
		    	assert.notEqual(msg,undefined,'there should be an message with code 1003');
		    	msg.type.should.be.equal('warning');
		    	msg.line.should.be.equal(2);
		    	msg.col.should.be.equal(0);
		    });
		});

	    // it('should warn missing tidl attribute',function() {
	    //     var res=tidl.parse('interface a exposes b { }');
	    //     res.should.be.an.Object;
	    //     res.model.should.be.an.instanceOf(tidl.IdlModel);
	    //     res.messages.should.be.an.instanceOf(Array);
	    //     res.messages.length.should.be.above(1);
	    //     console.log(res.messages[0]);
	    // });
	});
});