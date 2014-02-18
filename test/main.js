var should = require('should');
var tidl = require('../lib/main');

describe('tidl', function() {
	describe('#IdlModel',function(){
	    it('should exist', function() {
	        should.exist(tidl.IdlModel)
	    });	
	    it('should be a function', function() {
	        tidl.IdlModel.should.be.an.Function;
	    });
	    it('should have a property "Service"',function(){
	    	var model=new tidl.IdlModel();
	    	should.exist(model.Service);
	    });
	    it('should have a property "Service" of type string',function(){
	    	var model=new tidl.IdlModel();
	    	model.Service.should.be.type('string');
	    });
	    it('should have a property "Attributes"',function(){
	    	var model=new tidl.IdlModel();
	    	should.exist(model.Attributes);
	    });
	    it('should have a property "Attributes" of type Array',function(){
	    	var model=new tidl.IdlModel();
	    	model.Attributes.should.be.an.instanceOf(Array);
	    });
	    it('should have a property "Types"',function(){
	    	var model=new tidl.IdlModel();
	    	should.exist(model.Types);
	    });
	    it('should have a property "Types" of type Array',function(){
	    	var model=new tidl.IdlModel();
	    	model.Types.should.be.an.instanceOf(Array);
	    });
	    it('should have a property "Enumerations"',function(){
	    	var model=new tidl.IdlModel();
	    	should.exist(model.Enumerations);
	    });
	    it('should have a property "Enumerations" of type Array',function(){
	    	var model=new tidl.IdlModel();
	    	model.Enumerations.should.be.an.instanceOf(Array);
	    });
	    it('should have a property "Exceptions"',function(){
	    	var model=new tidl.IdlModel();
	    	should.exist(model.Exceptions);
	    });
	    it('should have a property "Exceptions" of type Array',function(){
	    	var model=new tidl.IdlModel();
	    	model.Exceptions.should.be.an.instanceOf(Array);
	    });
	    it('should have a property "Events"',function(){
	    	var model=new tidl.IdlModel();
	    	should.exist(model.Events);
	    });
	    it('should have a property "Events" of type Array',function(){
	    	var model=new tidl.IdlModel();
	    	model.Events.should.be.an.instanceOf(Array);
	    });
	    it('should have a property "Interfaces"',function(){
	    	var model=new tidl.IdlModel();
	    	should.exist(model.Interfaces);
	    });
	    it('should have a property "Interfaces" of type object',function(){
	    	var model=new tidl.IdlModel();
	    	model.Interfaces.should.be.type('object');
	    });
	});

	describe('#IdlAttr',function(){
	    it('should exist', function() {
	        should.exist(tidl.IdlAttr)
	    });	
	    it('should be a function', function() {
	        tidl.IdlAttr.should.be.an.Function;
	    });
	});

	describe('#IdlIntf',function(){
	    it('should exist', function() {
	        should.exist(tidl.IdlIntf)
	    });	
	    it('should be a function', function() {
	        tidl.IdlIntf.should.be.an.Function;
	    });
	});

	describe('#IdlOps',function(){
	    it('should exist', function() {
	        should.exist(tidl.IdlOps)
	    });	
	    it('should be a function', function() {
	        tidl.IdlOps.should.be.an.Function;
	    });
	});


	describe('#IdlType',function(){
	    it('should exist', function() {
	        should.exist(tidl.IdlType)
	    });	
	    it('should be a function', function() {
	        tidl.IdlType.should.be.an.Function;
	    });
	});

	describe('#IdlParam',function(){
	    it('should exist', function() {
	        should.exist(tidl.IdlParam)
	    });	
	    it('should be a function', function() {
	        tidl.IdlParam.should.be.an.Function;
	    });
	});


	describe('#Messages',function(){
	    it('should exist', function() {
	        should.exist(tidl.Messages)
	    });	
	    it('should be an Object', function() {
	        tidl.Messages.should.be.an.Object;
	    });
	});
});