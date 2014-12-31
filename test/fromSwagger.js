var should = require('should');
var tidl = require('../coverage/lib/tidl');
var assert = require("assert");
var from = require('fromjs');
var fs = require('fs');
var path = require('path');

describe('tidl#fromSwagger', function () {
    it('tidl must contain fromSwagger function', function () {
        tidl.fromSwagger.should.be.an.Function;
    });
    
    it('should return a error message is the swagger object is undefined', function () {
        var res = tidl.fromSwagger();
        var msg = from(res.messages).where(function (m) {
            return m.code == '10000'
        }).firstOrDefault();
        msg.type.should.be.equal('error');
    });
    
    it('should return a error message is the swagger object is null', function () {
        var res = tidl.fromSwagger(null);
        var msg = from(res.messages).where(function (m) {
            return m.code == '10000'
        }).firstOrDefault();
        msg.type.should.be.equal('error');
    });
    
    it('should return a error message is the swagger object doesnot contain an property named swagger', function () {
        var res = tidl.fromSwagger({});
        var msg = from(res.messages).where(function (m) {
            return m.code == '10001'
        }).firstOrDefault();
        msg.type.should.be.equal('error');
    });
    
    it('should return a error message is the swagger property value is not 2.0', function () {
        var res = tidl.fromSwagger({ swagger: '1.0' });
        var msg = from(res.messages).where(function (m) {
            return m.code == '10002'
        }).firstOrDefault();
        msg.type.should.be.equal('error');
    });
    
    it('should return a error message is the info property value null or undefined', function () {
        var res = tidl.fromSwagger({ swagger: '2.0' });
        var msg = from(res.messages).where(function (m) {
            return m.code == '10003'
        }).firstOrDefault();
        msg.type.should.be.equal('error');
    });
    
    
    it('should return a error message is the info.title property value null or undefined or empty', function () {
        var info = {};
        var res = tidl.fromSwagger({ swagger: '2.0', info: info });
        var msg = from(res.messages).where(function (m) {
            return m.code == '10004'
        }).firstOrDefault();
        msg.type.should.be.equal('error');
    });
    it('should return an idl model with service set to first word the info.title', function () {
        var info = {title:'test service'};
        var res = tidl.fromSwagger({ swagger: '2.0', info: info });
        res.should.be.an.Object;
        res.model.should.be.an.instanceOf(tidl.IdlModel);
        res.messages.should.be.an.instanceOf(Array);
        var msg = from(res.messages).where(function (m) {
            return m.type == 'error'
        }).firstOrDefault();
        assert.equal(msg, null);

        res.model.Service.should.equal('test');
    });
    it('should return an idl model with service description set to the info.description', function () {
        var descText = '#overview\nthis a test service';
        var info = { title: 'test', description:descText};
        var res = tidl.fromSwagger({ swagger: '2.0', info: info });
        res.should.be.an.Object;
        res.model.should.be.an.instanceOf(tidl.IdlModel);
        res.messages.should.be.an.instanceOf(Array);
        var msg = from(res.messages).where(function (m) {
            return m.type == 'error'
        }).firstOrDefault();
        assert.equal(msg, null);
        
        res.model.getDescription().should.equal(descText);
    });
    
    it('should return an idl model with service owner set to the info.contact', function () {
        var contactInfo = { name: 'tester', email: 'tester@example.com', url: 'http://example.com' };
        var info = { title: 'test', contact:contactInfo };
        var res = tidl.fromSwagger({ swagger: '2.0', info: info });
        res.should.be.an.Object;
        res.model.should.be.an.instanceOf(tidl.IdlModel);
        res.messages.should.be.an.instanceOf(Array);
        var msg = from(res.messages).where(function (m) {
            return m.type == 'error'
        }).firstOrDefault();
        assert.equal(msg, null);
        var owner = res.model.getAttribute('owner');
        owner.Values[0].should.equal(contactInfo.name);
        owner.Values[1].should.equal(contactInfo.email);
        owner.Values[2].should.equal(contactInfo.url);
    });
    it('should return an idl model containing interface objects based on the path prefix', function () {
        var info = { title: 'test'};
        var getAllResources1 = { "get": { } };
        var getResource1ByName = { get: { operationId: "getResources1ByName" } };
        var getAllResources2 = { "get": { operationId: "getAllResources1" } };
        var paths = { "/resource1": getAllResources1, "/resource1/{name}": getResource1ByName, "/resource2": getAllResources2 };
        var res = tidl.fromSwagger({ swagger: '2.0', info: info, paths: paths });
        res.should.be.an.Object;
        res.model.should.be.an.instanceOf(tidl.IdlModel);
        res.messages.should.be.an.instanceOf(Array);
        var msg = from(res.messages).where(function (m) {
            return m.type == 'error'
        }).firstOrDefault();
        assert.equal(msg, null);
        
        res.model.getInterface('resource1').should.be.an.instanceOf(tidl.IdlIntf);
        res.model.getInterface('resource2').should.be.an.instanceOf(tidl.IdlIntf);
    });
    it('should parse a swagger 2.0 petstore example', function () {
        var stxt = fs.readFileSync(path.join(__dirname, 'petstore_swagger20.json'));
        var res = tidl.fromSwagger(JSON.parse(stxt));
       
        res.should.be.an.Object;
        res.model.should.be.an.instanceOf(tidl.IdlModel);
        res.messages.should.be.an.instanceOf(Array);
        var msg = from(res.messages).where(function (m) {
            return m.type == 'error'
        }).firstOrDefault();
        assert.equal(msg, null);

        console.log(res.model.toString());
        var pres = tidl.parse(res.model.toString());
        msg = from(pres.messages).where(function (m) {
            return m.type == 'error'
        }).firstOrDefault();
        assert.equal(msg, null) 
    });
});