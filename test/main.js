var should = require('should');
var tidl = require('../coverage/lib/tidl');
var assert = require("assert");
var from = require('fromjs');
var util = require('util');
 
describe('tidl', function() {
	describe('#IdlModel', function() {
		var model = new tidl.IdlModel();
		it('should be a function', function() {
			tidl.IdlModel.should.be.an.Function;
		});
		it('should have a property "Service" of type string', function() {
			model.Service.should.be.type('string');
		});
		it('should have a property "Attributes" of type Array', function() {
			model.Attributes.should.be.an.instanceOf(Array);
		});
		it('should have a property "Types" of type Array', function() {
			model.Types.should.be.an.instanceOf(Array);
		});
		it('should have a property "Enumerations" of type Array', function() {
			model.Enumerations.should.be.an.instanceOf(Array);
		});
		it('should have a property "Exceptions" of type Array', function() {
			model.Exceptions.should.be.an.instanceOf(Array);
		});
		it('should have a property "Events" of type Array', function() {
			model.Events.should.be.an.instanceOf(Array);
		});
		it('should have a property "Interfaces" of type object', function() {
			model.Interfaces.should.be.type('object');
		});
		it('should have a "clone" method that creats a copy of the model', function(){
			var model=new tidl.IdlModel();
			var attr=new tidl.IdlAttr();

			should.exist(model.clone);
			model.clone.should.be.an.Function;

			attr.Name='tidl';
			attr.Type='version';
			attr.Values.push('1.0.0');
			model.Attributes=[].concat([attr]);

			var intf=new tidl.IdlIntf();
			intf.Name='iname';
			intf.Service='sname';
			attr=new tidl.IdlAttr();
			attr.Name='version';
			attr.Type='version';
			attr.Values.push('1.1.0');
			intf.Attributes=[].concat([attr]);

			model.Interfaces.iname=intf;

			var newmodel=model.clone();
			newmodel.getInterface('iname').getAttribute('version').Values[0].should.be.equal('1.1.0');
			newmodel.getAttribute('tidl').Values[0].should.be.equal('1.0.0');
			assert.equal(newmodel.Interfaces.iname.getDescription(), null,'description should be null');
		});
		it('toString should output a valid tidl for string type model for 1.0',function(){
			var model=new tidl.IdlModel();
			var attr=new tidl.IdlAttr();
			attr.Name='tidl';
			attr.Type='version';
			attr.Values.push('1.0.0');
			model.Attributes=[].concat([attr]);

			var intf=new tidl.IdlIntf();
			intf.Name='iname';
			intf.Service='sname';
			attr=new tidl.IdlAttr();
			attr.Name='version';
			attr.Type='version';
			attr.Values.push('1.0.0');
			intf.Attributes=[].concat([attr]);

			model.Interfaces.iname=intf;

			model.toString().should.be.equal(
				'@tidl 1.0.0;\n'+
				'\ninterface iname exposes sname {\n'+
					'\t@version 1.0.0;\n'+
				'}\n');
		});
		it('toString should output a valid tidl for string type model for 2.0', function(){
			var model=new tidl.IdlModel();
			model.Service='sname';
			var attr=new tidl.IdlAttr();
			attr.Name='tidl';
			attr.Type='version';
			attr.Values.push('2.0.0');
			model.Attributes=[].concat([attr]);

			var intf=new tidl.IdlIntf();
			intf.Name='iname';
			intf.Service='sname';
			attr=new tidl.IdlAttr();
			attr.Name='version';
			attr.Type='version';
			attr.Values.push('1.0.0');
			intf.Attributes=[].concat([attr]);

			model.Interfaces.iname=intf;

			model.toString().should.be.equal(
				'@tidl 2.0.0;\n'+
				'service sname {\n'+
					'\n\tinterface iname exposes sname {\n'+
						'\t\t@version 1.0.0;\n'+
					'\t}\n'+
				'}');
		});
	});

	describe('#IdlIntf', function() {
		var intf = new tidl.IdlIntf();
		it('should be a function', function() {
			tidl.IdlIntf.should.be.an.Function;
		});
		it('should have a property "Service" of type string', function() {
			intf.Service.should.be.type('string');
		});
		it('should have a property "Name" of type string', function() {
			intf.Name.should.be.type('string');
		});
		it('should have a property "Attributes" of type Array', function() {
			intf.Attributes.should.be.an.instanceOf(Array);
		});
		it('should have a property "Operations" of type object', function() {
			intf.Types.should.be.an.instanceOf(Object);
		});
		it('should have a property "Types" of type Array', function() {
			intf.Types.should.be.an.instanceOf(Array);
		});
		it('should have a property "Enumerations" of type Array', function() {
			intf.Enumerations.should.be.an.instanceOf(Array);
		});
		it('should have a property "Exceptions" of type Array', function() {
			intf.Exceptions.should.be.an.instanceOf(Array);
		});
		it('should have a property "Events" of type Array', function() {
			intf.Events.should.be.an.instanceOf(Array);
		});
		it('should have a function "clone"', function() {
			should.exist(intf.clone);
			intf.clone.should.be.an.Function;
		});
		it('should have a function "getAttribute"', function() {
			should.exist(intf.clone);
			intf.clone.should.be.an.Function;
		});
		it('toString should output a valid tidl for string type interface', function(){
			var intf = new tidl.IdlIntf();
			intf.Name = 'iname';
			intf.Service = 'sname';
			var attr = new tidl.IdlAttr();
			attr.Name = 'version';
			attr.Type = 'version';
			attr.Values.push('1.0.0');
			intf.Attributes = [].concat([attr]);

			intf.toString().should.be.equal(
				'interface iname exposes sname {\n'+
					'\t@version 1.0.0;\n'+
				'}');
		});
	});

	describe('#IdlAttr', function() {
		it('should be a function', function() {
			tidl.IdlAttr.should.be.an.Function;
		});
		it('should have a "clone" method that creats a copy of the attribute', function(){
			var attr = new tidl.IdlAttr();
			attr.Name = 'AttributeName';
			attr.Type.should.be.equal('String');
			attr.Values.length.should.be.equal(0);
			attr.Type = 'sometype';
			attr.Values.push('v0');
			attr.Values.push('v1');

			var newattr = attr.clone();
			newattr.Name.should.be.equal('AttributeName');
			newattr.Type.should.be.equal('sometype');
			newattr.Values.length.should.be.equal(2);
			newattr.Values[0].should.be.equal('v0');
			newattr.Values[1].should.be.equal('v1');

		});
		it('toString should output a valid tidl for string type attribute',function(){
			var attr = new tidl.IdlAttr();
			attr.Name = 'AttributeName';
			attr.Type.should.be.equal('String');
			attr.Values.length.should.be.equal(0);
			attr.Type = 'String';
			attr.Values.push('v0');
			attr.Values.push('v"1');

			attr.toString().should.be.equal('@AttributeName "v0","v\\\"1";');
		});
		it('toString should output a valid tidl for other type attribute',function(){
			var attr = new tidl.IdlAttr();
			attr.Name = 'AttributeName';
			attr.Type.should.be.equal('String');
			attr.Values.length.should.be.equal(0);
			attr.Type = 'sometype';
			attr.Values.push('v0');
			attr.Values.push('v"1');

			attr.toString().should.be.equal('@AttributeName v0,"v\\\"1";');
		})
	});

	describe('#IdlOps', function() {
		it('should be a function', function() {
			tidl.IdlOps.should.be.an.Function;
		});
		it('should have a "clone" method that creates a copy of the Ops', function(){
			var op = new tidl.IdlOps();
			op.Name = 'test';
	        op.Return = new tidl.IdlType();
	        op.Return.Name = 'rtype'
	        op.Parameters = {};

	        var prm = new tidl.IdlParam();
			prm.Name = 'id';
			prm.Type = new tidl.IdlType();
			prm.Type.Name = 'prmType';
			prm.Modifiers.length.should.be.equal(0);
			prm.Mandatory.should.be.false;
			prm.Modifiers.push('m1');
			prm.Mandatory = true;

	        op.Parameters.id=prm;

	        
	        var attr=new tidl.IdlAttr();
			attr.Name='AttributeName';
			attr.Type.should.be.equal('String');
			attr.Values.length.should.be.equal(0);
			attr.Type='sometype';
			attr.Values.push('v0');
			attr.Values.push('v1');

	        op.Attributes = [].concat([attr]);
	        op.Exceptions = [].concat(['ex1','ex2']);
	        op.BaseTypes = [];
	        op.IsAsync = true;
	        op.type = 'operation';

	        var newop=op.clone();

	        newop.Name.should.be.equal('test');
	        newop.Return.Name.should.be.equal('rtype');

	        var newprm=newop.Parameters.id;
			newprm.should.be.instanceOf(tidl.IdlParam);
			newprm.Name.should.be.equal('id');
			newprm.Type.Name.should.be.equal('prmType');
			newprm.Modifiers[0].should.be.equal('m1');
			newprm.Mandatory.should.be.true;

			var newattr=newop.Attributes[0];
			newattr.Name.should.be.equal('AttributeName');
			newattr.Type.should.be.equal('sometype');
			newattr.Values.length.should.be.equal(2);
			newattr.Values[0].should.be.equal('v0');
			newattr.Values[1].should.be.equal('v1');

			newop.Exceptions.length.should.be.equal(2);
			newop.Exceptions[0].should.be.equal('ex1');
			newop.Exceptions[1].should.be.equal('ex2');

			newop.IsAsync.should.be.true;
			newop.type.should.be.equal('operation');
		});
		it('toString should output a valid tidl for operation',function(){
			var op=new tidl.IdlOps();
			op.Name = 'test';
	        op.Return = new tidl.IdlType();
	        op.Return.Name='rtype'
	        op.Parameters = {};

	        var prm=new tidl.IdlParam();
			prm.Name='id';
			prm.Type=new tidl.IdlType();
			prm.Type.Name='prmType';
			prm.Modifiers.length.should.be.equal(0);
			prm.Mandatory.should.be.false;
			prm.Modifiers.push('m1');
			prm.Mandatory=true;

	        op.Parameters.id=prm;

	        
	        var attr=new tidl.IdlAttr();
			attr.Name='attr';
			attr.Type.should.be.equal('String');
			attr.Values.length.should.be.equal(0);
			attr.Type='sometype';
			attr.Values.push('v0');
			attr.Values.push('v1');

	        op.Attributes = [].concat([attr]);
	        op.Exceptions = [].concat(['ex1','ex2']);
	        op.BaseTypes = [];
	        op.IsAsync = true;
	        op.type = 'operation';

	        op.toString().should.be.equal('async rtype test(m1 mandatory prmType id) throws ex1,ex2\n{\n\t@attr v0,"v1";\n}');
		});
		it('toString should output a valid tidl for type',function(){
			var op=new tidl.IdlOps();
			op.Name = 'test';
	        op.Return = new tidl.IdlType();
	        op.Return.Name='type'
	        op.Parameters = {};

	        var prm=new tidl.IdlParam();
			prm.Name='id';
			prm.Type=new tidl.IdlType();
			prm.Type.Name='prmType';
			prm.Modifiers.length.should.be.equal(0);
			prm.Mandatory.should.be.false;
			prm.Modifiers.push('m1');
			prm.Mandatory=true;

	        op.Parameters.id=prm;

	        
	        var attr=new tidl.IdlAttr();
			attr.Name='attr';
			attr.Type.should.be.equal('String');
			attr.Values.length.should.be.equal(0);
			attr.Type='sometype';
			attr.Values.push('v0');
			attr.Values.push('v1');

	        op.Attributes = [].concat([attr]);
	        op.BaseTypes = [].concat(['ex1','ex2']);
	        op.Exceptions = [];
	        op.IsAsync = false;
	        op.type = 'type';

	        op.toString().should.be.equal('type test(m1 mandatory prmType id) extends ex1,ex2\n{\n\t@attr v0,"v1";\n}');
		});
		it('toString should output a valid tidl for enumeration',function(){
			var op=new tidl.IdlOps();
			op.Name = 'test';
	        op.Return = new tidl.IdlType();
	        op.Return.Name='enumeration'
	        op.Parameters = {};

	        var prm=new tidl.IdlParam();
			prm.Name='id';
			prm.Type=new tidl.IdlType();
			prm.Type.Name='';
			prm.Modifiers.length.should.be.equal(0);
			prm.Mandatory.should.be.false;
			prm.Mandatory=false;

	        op.Parameters.id=prm;

	        
	        var attr=new tidl.IdlAttr();
			attr.Name='attr';
			attr.Type.should.be.equal('String');
			attr.Values.length.should.be.equal(0);
			attr.Type='sometype';
			attr.Values.push('v0');
			attr.Values.push('v1');

	        op.Attributes = [].concat([attr]);
	        op.BaseTypes = [];
	        op.Exceptions = [];
	        op.IsAsync = false;
	        op.type = 'enumeration';

	        op.toString().should.be.equal('enumeration test( id)\n{\n\t@attr v0,"v1";\n}');
		});
	});

	describe('#IdlType', function() {
		it('should be a function', function() {
			tidl.IdlType.should.be.an.Function;
		});
		it('should have a "clone" method that creates a copy of the Type', function(){
			var type=new tidl.IdlType();
			type.Name='TypeName';
			type.Types.length.should.be.equal(0);

			type.Types.push(new tidl.IdlType());
			type.Types[0].Name='st0';

			type.Types.push(new tidl.IdlType());
			type.Types[1].Name='st1';
			type.Types[1].Types.push(new tidl.IdlType());
			type.Types[1].Types[0].Name='st1_1';

			var newtype=type.clone();
			newtype.Name.should.be.equal('TypeName');
			newtype.Types.length.should.be.equal(2);
			
			newtype.Types[0].Name.should.be.equal('st0');
			newtype.Types[0].Types.length.should.be.equal(0);

			newtype.Types[1].Name.should.be.equal('st1');
			newtype.Types[1].Types.length.should.be.equal(1);
			newtype.Types[1].Types[0].Name.should.be.equal('st1_1');
			newtype.Types[1].Types[0].Types.length.should.be.equal(0);

		});
		it('toString should output a valid tidl for type',function(){
			var type=new tidl.IdlType();
			type.Name='TypeName';
			type.Types.length.should.be.equal(0);

			type.Types.push(new tidl.IdlType());
			type.Types[0].Name='st0';

			type.Types.push(new tidl.IdlType());
			type.Types[1].Name='st1';
			type.Types[1].Types.push(new tidl.IdlType());
			type.Types[1].Types[0].Name='st1_1';

			type.toString().should.be.equal('TypeName<st0,st1<st1_1>>');
		});
	});

	describe('#IdlParam', function() {
		it('should be a function', function() {
			tidl.IdlParam.should.be.an.Function;
		});
		it('should have a "clone" method that creats a copy of the Param', function(){
			var prm=new tidl.IdlParam();
			prm.Name='PrmName';
			prm.Type=new tidl.IdlType();
			prm.Type.Name='prmType';
			prm.Modifiers.length.should.be.equal(0);
			prm.Mandatory.should.be.false;
			prm.Modifiers.push('m1');
			prm.Mandatory=true;

			var newprm=prm.clone();
			newprm.should.be.instanceOf(tidl.IdlParam);
			newprm.Name.should.be.equal('PrmName');
			newprm.Type.Name.should.be.equal('prmType');
			newprm.Modifiers[0].should.be.equal('m1');
			newprm.Mandatory.should.be.true;
		});
		it('toString should output a valid tidl for param',function(){
			var prm=new tidl.IdlParam();
			prm.Name='PrmName';
			prm.Type=new tidl.IdlType();
			prm.Type.Name='prmType';
			prm.Modifiers.length.should.be.equal(0);
			prm.Mandatory.should.be.false;
			prm.Modifiers.push('m1');
			prm.Mandatory=true;

			prm.toString().should.be.equal('m1 mandatory prmType PrmName');
		});
	});

	describe('#Messages', function() {
		it('should be an Object', function() {
			tidl.Messages.should.be.an.Object;
		});
	});

	describe('#parse()', function() {
		it('should be of type function', function() {
			tidl.parse.should.be.an.Function;
		});

		it('should return null when "parse" method is invoked with no arguments', function() {
			assert.equal(tidl.parse(), null);
		});

		it('should return null when "parse" method is invoked with null value as the first argument', function() {
			assert.equal(tidl.parse(null), null);
		});

		it('should parse a empty string', function() {
			var res = tidl.parse('');
			res.should.be.an.Object;
			res.model.should.be.an.instanceOf(tidl.IdlModel);
			res.messages.should.be.an.instanceOf(Array);
			var msg = from(res.messages).where(function(m) {
				return m.type == 'error'
			}).firstOrDefault();
			assert.equal(msg, null);
		});

		it('should parse a string with just comments', function() {
			var res = tidl.parse('//test\n /* block comment */\n /* multi-line \n comment*/');
			res.should.be.an.Object;
			res.model.should.be.an.instanceOf(tidl.IdlModel);
			res.messages.should.be.an.instanceOf(Array);
			var msg = from(res.messages).where(function(m) {
				return m.type == 'error'
			}).firstOrDefault();
			assert.equal(msg, null);
		});

		it('should report an error for unexpected character.', function() {
			var res = tidl.parse('asfasf');
			var msg = from(res.messages).where(function(m) {
				return m.code == '2002'
			}).firstOrDefault();
			assert.notEqual(msg, null, 'there should be an message with code 2002');
			assert.notEqual(msg, undefined, 'there should be an message with code 2002');
			msg.type.should.be.equal('error');
			msg.line.should.be.equal(1);
			msg.col.should.be.equal(0);
		});

		it('should report an error for bad attribute.', function() {
			var res = tidl.parse('@1313');
			var msg = from(res.messages).where(function(m) {
				return m.code == '2001'
			}).firstOrDefault();
			assert.notEqual(msg, null, 'there should be an message with code 2001');
			assert.notEqual(msg, undefined, 'there should be an message with code 2001');
			msg.type.should.be.equal('error');
			msg.line.should.be.equal(1);
			msg.col.should.be.equal(0);
		});

		it('should report an warning for missing tidl attribute.', function() {
			var res = tidl.parse('@description "test";');
			var msg = from(res.messages).where(function(m) {
				return m.code == '1001'
			}).firstOrDefault();
			assert.notEqual(msg, null, 'there should be an message with code 1001');
			assert.notEqual(msg, undefined, 'there should be an message with code 1001');
			msg.type.should.be.equal('warning');
			msg.line.should.be.equal(1);
			msg.col.should.be.equal(0);

		});

		it('should allow reserved parameter names starting with underscore in "parse" method', function () {
		    var res = tidl.parse('@tidl 2.0.0; service S { \n  interface A exposes S{ \n void op(int cC, string _region){} \n} \n}');
		    var msg = from(res.messages).where(function (m) {
		        return m.code == '2003'
		    }).firstOrDefault();
		    (msg === undefined|| msg === null).should.be.true;
		});

		it('should not allow user parameter names to start with underscore in "parse" method', function () {
		    var res = tidl.parse('@tidl 2.0.0; service S { \n  interface A exposes S{ \n void op(int cC, string _userParam){} \n} \n}');
		    var msg = from(res.messages).where(function (m) {
		        return m.code == '2008'
		    }).firstOrDefault();
		    assert.notEqual(msg, null, 'there should be an message with code 2008');
		    assert.notEqual(msg, undefined, 'there should be an message with code 2008');
		    msg.type.should.be.equal('error');
		});


	});
});