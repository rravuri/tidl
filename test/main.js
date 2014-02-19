var should = require('should');
var tidl = require('../lib/main');

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
});