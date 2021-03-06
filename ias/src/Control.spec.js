/*!
    \file Control.spec.js
    \author zafaco GmbH <info@zafaco.de>
    \date Last update: 2019-11-13

    Copyright (C) 2016 - 2019 zafaco GmbH

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License version 3 
    as published by the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var wsControl;

describe('WSControl', function () {
    describe('class initialization', function(){
        it('has expected methods', function(){
            var controle = new WSControl();
            expect(typeof controle.measurementStart).toBe('function');
            expect(typeof controle.measurementStop).toBe('function');

        });
    });
    it('sets internal default properties', function(){
        var controle = new WSControl();
        expect(controle.callback).toBe('');
        expect(controle.wsMeasurement).toBe('');

    });

    describe('worker communication', function(){
        xit('handels cmd "info" callbacks from WSWorker', function(){
            var controle = new WSControl();
            spyOn(console, 'log');
            controle.workerCallback('{"cmd": "info"}');
            expect(console.log).toHaveBeenCalled();

        });
        xit('handels cmd "open" callback from WSWorker and starts ', function(){
            var controle = new WSControl();
            controle.wsWorkers = new Array(4)
            controle.wsWorkersStatus = new Array(4);
            controle.wsWorkersStatus[1]=1;
            console.log(controle);
            spyOn(controle, 'measurementStart');
            spyOn(window,'clearTimeout')
            controle.wsTestCase = 'upload';
            controle.workerCallback('{"cmd": "open","wsID": 1, "wsState":2}');
            expect(window.clearTimeout).toHaveBeenCalled();
        });

        xit('handels cmd "report" callback from WSWorker', function(){
            var controle = new WSControl();
            controle.wsTestCase = 'rtt';
            spyOn(Math, 'round');
            controle.workerCallback('{"cmd": "report","wsRttValues":true, "wsState":2}');
            expect(Math.round).toHaveBeenCalled();

        });
    });

    describe('measurment controlling', function(){
        it('starts measurement', function(){

            var config= '{"platform":"web","wsTargets":["peer-ias-de-01"],"wsTLD":"net-neutrality.tools","wsTargetPort":"80","wsWss":0,"wsAuthToken":"placeholderToken","wsAuthTimestamp":"placeholderTimestamp","performRouteToClientLookup":true,"routeToClientTargetPort":8080,"download":{"streams":4,"frameSize":32768,"classes":[{"default":false,"streams":4,"frameSize":2048,"bounds":{"lower":0.01,"upper":1.05}},{"default":true,"streams":4,"frameSize":32768,"bounds":{"lower":0.95,"upper":525}},{"default":false,"streams":4,"frameSize":524288,"bounds":{"lower":475,"upper":1050}},{"default":false,"streams":8,"frameSize":524288,"bounds":{"lower":950,"upper":9000}}],"performMeasurement":true},"upload":{"streams":4,"frameSize":65535,"framesPerCall":1,"classes":[{"default":false,"streams":4,"frameSize":2048,"bounds":{"lower":0.01,"upper":1.05},"framesPerCall":1},{"default":true,"streams":4,"frameSize":65535,"bounds":{"lower":0.95,"upper":525},"framesPerCall":1},{"default":false,"streams":4,"frameSize":65535,"bounds":{"lower":475,"upper":1050},"framesPerCall":4},{"default":false,"streams":8,"frameSize":65535,"bounds":{"lower":950,"upper":9000},"framesPerCall":20}],"performMeasurement":false},"rtt":{"performMeasurement":false},"testCase":"download"}';           

            wsControl = new WSControl();
            wsControl.callback = null;
            spyOn(wsControl,'callback');
            spyOn(wsControl,'workerCallback');
            spyOn(window,'setTimeout')
            wsControl.measurementStart(config);
            expect(window.setTimeout).toHaveBeenCalled();
        });
    });
    
});