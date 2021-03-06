/*!
    \file Control.js
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

/* global logDebug, logReports, wsControl, __dirname */

var jsTool = new JSTool();




/*-------------------------class WSControl------------------------*/

/**
 * @class WSControl
 * @description WebSocket Control Class
 */
function WSControl()
{
    this.wsMeasurement  = '';
    this.callback       = '';

    var wsTestCase;
    var wsData;
    var wsDataTotal;
    var wsFrames;
    var wsFramesTotal;
    var wsSpeedAvgBitS;
    var wsOverhead;
    var wsOverheadTotal;
    var wsStartTime;
    var wsEndTime;
    var wsMeasurementTime;
    var wsMeasurementTimeTotal;
    var wsStartupStartTime;
    var wsOverheadPerFrame;
    var wsWorkers;
    var wsWorkersStatus;
    var wsWorkerTime;
    var wsInterval;
    var wsMeasurementRunningTime;
    var wsCompleted;
    var wsReportInterval;
    var wsTimeoutTimer;
    var wsTimeout;
    var wsStartupTimeout;
    var wsProtocol;
    var wsStreamsStart;
    var wsStreamsEnd;
    var wsFrameSize;
    var wsMeasurementError;


    var wsStateConnecting   = 0;
    var wsStateOpen         = 1;
    var wsStateClosing      = 2;
    var wsStateClosed       = 3;

    var wsAuthToken;
    var wsAuthTimestamp;


    var rttReportInterval           = 501;
    var rttProtocol                 = 'rtt';


    var dlReportInterval            = 501;
    var dlWsOverheadPerFrame        = 4;
    var dlData                      = {};
    var dlFrames                    = {};
    var dlStartupData               = {};
    var dlStartupFrames             = {};
    var dlProtocol                  = 'download';


    var ulReportInterval            = 501;
    var ulWsOverheadPerFrame        = 8;
    var ulReportDict                = {};
    var ulStartupData               = {};
    var ulStartupFrames             = {};
    var ulProtocol                  = 'upload';
    var ulSampleRate                = 500;
    var ulTailTime                  = 2000;

    var wsTarget;
    var wsTargetPort;
    var wsWss;
    var wsTLD;

    //default measurement parameters
    var rttRequests                 = 10;
    var rttRequestTimeout           = 2000;
    var rttRequestWait              = 500;
    var rttTimeout                  = (rttRequests * (rttRequestTimeout + rttRequestWait)) * 1.1;
    var rttPayloadSize              = 64;

    var dlStartupTime               = 3000;
    var dlMeasurementRunningTime    = 10000;
    var dlParallelStreams           = 4;
    var dlTimeout                   = 20000;
    var dlFrameSize                 = 32768;

    var ulStartupTime               = 3000;
    var ulMeasurementRunningTime    = 10000;
    var ulParallelStreams           = 4;
    var ulTimeout                   = 20000;
    var ulFrameSize                 = 65535;
    var uploadFramesPerCall         = 1;

    var wsParallelStreams;
    var wsStartupTime;

    var useWebWorkers               = true;

    var wsWorkerPath                = 'WebWorker.js';

    var classCheckFetchTimeout;
    var classCheckReportTimeout;
    var classCheckReportTime        = 501;
    var classCheckStartTime;
    var classCheckLimitReached      = false;
    var classCheckUlReportDict      = {};
    var classCheckData;
    var classCheckFrames;



    /*-------------------------KPIs------------------------*/

    var wsSystemAvailability;
    var wsServiceAvailability;
    var wsErrorCode;
    var wsErrorDescription;

    var wsRttValues =
    {
        duration:           undefined,
        avg:                undefined,
        med:                undefined,
        min:                undefined,
        max:                undefined,
        requests:           undefined,
        replies:            undefined,
        errors:             undefined,
        missing:            undefined,
        packetsize:         undefined,
        stDevPop:           undefined,
        server:             undefined,
        rtts:               undefined
    };

    var wsDownloadValues =
    {
        rateAvg:          undefined,
        data:             undefined,
        dataTotal:        undefined,
        duration:         undefined,
        durationTotal:    undefined,
        streamsStart:     undefined,
        streamsEnd:       undefined,
        frameSize:        undefined,
        frames:           undefined,
        framesTotal:      undefined,
        overheadPerFrame: undefined,
        overhead:         undefined,
        overheadTotal:    undefined
    };

    var wsUploadValues =
    {
        rateAvg:          undefined,
        data:             undefined,
        dataTotal:        undefined,
        duration:         undefined,
        durationTotal:    undefined,
        streamsStart:     undefined,
        streamsEnd:       undefined,
        frameSize:        undefined,
        frames:           undefined,
        framesTotal:      undefined,
        overheadPerFrame: undefined,
        overhead:         undefined,
        overheadTotal:    undefined,
        framePerCall:     undefined
    };

    var classCheckValues = 
    {
        rateAvg:          undefined,
        dataTotal:        undefined,
        durationTotal:    undefined,
        streamsStart:     undefined,
        frameSize:        undefined,
        framesTotal:      undefined,
        overheadPerFrame: undefined,
        overheadTotal:    undefined,
        classCheck:       true 
    };




    /*-------------------------public functions------------------------*/

    /**
     * @function measurementStart
     * @description Function to Start test cases
     * @public
     * @param {string} measurementParameters JSON coded measurement Parameters
     */
    this.measurementStart = function(measurementParameters)
    {
        resetValues();

        wsMeasurementError      = false;
        measurementParameters   = JSON.parse(measurementParameters);
        wsTestCase              = measurementParameters.testCase;

        if (typeof measurementParameters.download.streams !== 'undefined' && wsTestCase === 'download')
        {
            dlParallelStreams   = Number(measurementParameters.download.streams );
        }
        if (typeof measurementParameters.upload.streams !== 'undefined' && wsTestCase === 'upload')
        {
            ulParallelStreams   = Number(measurementParameters.upload.streams );
        }

        if (typeof measurementParameters.download.frameSize !== 'undefined' && wsTestCase === 'download')
        {
            dlFrameSize         = Number(measurementParameters.download.frameSize);
        }
        if (typeof measurementParameters.upload.frameSize !== 'undefined' && wsTestCase === 'upload')
        {
            ulFrameSize         = Number(measurementParameters.upload.frameSize);
        }
        if (typeof measurementParameters.upload.framesPerCall !== 'undefined' && wsTestCase === 'upload')
        {
            uploadFramesPerCall = Number(measurementParameters.upload.framesPerCall);
        }

        switch (wsTestCase)
        {
            case 'rtt':
            {
                if (typeof measurementParameters.rttRequests !== 'undefined')
                {
                    rttRequests         = Number(measurementParameters.rttRequests);
                }
                if (typeof measurementParameters.rttRequestTimeout !== 'undefined')
                {
                    rttRequestTimeout   = Number(measurementParameters.rttRequestTimeout);
                }
                if (typeof measurementParameters.rttRequestWait !== 'undefined')
                {
                    rttRequestWait      = Number(measurementParameters.rttRequestWait);
                }
                if (typeof measurementParameters.rttTimeout !== 'undefined')
                {
                    rttTimeout          = Number(measurementParameters.rttTimeout);
                }
                if (typeof measurementParameters.rttPayloadSize !== 'undefined')
                {
                    rttPayloadSize      = Number(measurementParameters.rttPayloadSize);
                }
                wsParallelStreams           = 1;
                wsMeasurementRunningTime    = rttTimeout;
                wsReportInterval            = rttReportInterval;
                wsProtocol                  = rttProtocol;
                wsTimeout                   = rttTimeout;

                break;
            }
            case 'download':
            {
                wsParallelStreams                   = dlParallelStreams;
                wsFrameSize                         = dlFrameSize;

                if (wsFrameSize >= 65536)
                {
                    dlWsOverheadPerFrame    = 8;
                }
                else if (wsFrameSize < 126)
                {
                    dlWsOverheadPerFrame    = 2;
                }

                wsOverheadPerFrame                  = dlWsOverheadPerFrame;
                wsDownloadValues.overheadPerFrame   = dlWsOverheadPerFrame;
                wsStartupTime                       = dlStartupTime;
                wsMeasurementRunningTime            = dlMeasurementRunningTime;
                wsReportInterval                    = dlReportInterval;
                wsTimeout                           = dlTimeout;
                wsProtocol                          = dlProtocol;

                break;
            }
            case 'upload':
            {
                wsParallelStreams               = ulParallelStreams;
                wsFrameSize                     = ulFrameSize;

                if (ulFrameSize >= 65536)
                {
                    ulWsOverheadPerFrame    = 12;
                }
                else if (ulFrameSize < 126)
                {
                    ulWsOverheadPerFrame    = 6;
                }

                wsOverheadPerFrame              = ulWsOverheadPerFrame;
                wsUploadValues.overheadPerFrame = ulWsOverheadPerFrame;
                wsStartupTime                   = ulStartupTime;
                wsMeasurementRunningTime        = ulMeasurementRunningTime;
                wsReportInterval                = ulReportInterval;
                wsTimeout                       = ulTimeout;
                wsProtocol                      = ulProtocol;

                break;
            }
        }

        if (typeof measurementParameters.wsTarget !== 'undefined')
        {
            wsTarget                    = measurementParameters.wsTarget;
        }
        if (typeof measurementParameters.wsTargetPort !== 'undefined')
        {
            wsTargetPort                = String(measurementParameters.wsTargetPort);
        }
        if (typeof measurementParameters.wsWss !== 'undefined')
        {
            wsWss                       = String(measurementParameters.wsWss);
        }
        if (typeof measurementParameters.wsTLD !== 'undefined')
        {
            wsTLD                       = String(measurementParameters.wsTLD);
        }
        if (typeof measurementParameters.wsStartupTime !== 'undefined')
        {
            wsStartupTime               = Number(measurementParameters.wsStartupTime);
        }
        if (typeof measurementParameters.wsTimeout !== 'undefined')
        {
            wsTimeout                   = Number(measurementParameters.wsTimeout);
        }
        if (typeof measurementParameters.wsMeasureTime      !== 'undefined' && (wsTestCase === 'download' || wsTestCase === 'upload'))
        {
            wsMeasurementRunningTime    = Number(measurementParameters.wsMeasureTime);
        }

        if (typeof measurementParameters.wsWorkerPath !== 'undefined')
        {
            wsWorkerPath               = String(measurementParameters.wsWorkerPath);
        }

        wsAuthToken         = String(measurementParameters.wsAuthToken);
        wsAuthTimestamp     = String(measurementParameters.wsAuthTimestamp);

        reportToMeasurement('info', 'starting measurement');

        console.log(wsTestCase + ': starting measurement using parameters:');
        var wsWssString                 = 'wss://';
        if (!Number(wsWss)) wsWssString = 'ws://';

        console.log('target:            ' + wsWssString + wsTarget + ':' + wsTargetPort);
        console.log('protocol:          ' + wsProtocol);

        if (wsTestCase === 'rtt')
        {
            console.log('requests:          ' + rttRequests);
            console.log('request timeout:   ' + rttRequestTimeout);
            console.log('request wait:      ' + rttRequestWait);
            console.log('timeout:           ' + rttTimeout);
        }
        else if (wsTestCase === 'download' || wsTestCase === 'upload')
        {
            console.log('startup time:      ' + wsStartupTime);
            console.log('measurement time:  ' + wsMeasurementRunningTime);
            console.log('parallel streams:  ' + wsParallelStreams);
            console.log('frame size:        ' + wsFrameSize);
            console.log('timeout:           ' + wsTimeout);
        }

        wsWorkers               = new Array(wsParallelStreams);
        wsWorkersStatus         = new Array(wsParallelStreams);
        classCheckData          = new Array(wsParallelStreams);
        classCheckFrames        = new Array(wsParallelStreams);

        for (var wsID = 0; wsID < wsWorkers.length; wsID++)
        {
            classCheckData[wsID]     = new Array();
            classCheckFrames[wsID]   = new Array();
        }

        for (var wsID = 0; wsID < wsWorkers.length; wsID++)
        {
            if (wsTestCase === 'download')
            {
                dlData[wsID]          = 0;
                dlFrames[wsID]        = 0;
                dlStartupData[wsID]   = 0;
                dlStartupFrames[wsID] = 0;
            }

            if (wsTestCase === 'upload')
            {
                ulReportDict[wsID]            = {};
                ulStartupData[wsID]           = 0;
                ulStartupFrames[wsID]         = 0;
                classCheckUlReportDict[wsID]  = {};
            }

            var workerData = prepareWorkerData('connect', wsID);

            if (measurementParameters.useWebWorkers === false)
            {
                useWebWorkers                   = false;
                
                delete(wsWorkers[wsID]);
                wsWorkers[wsID]                 = new WSWorker();
                wsWorkers[wsID].wsControl       = this;
                wsWorkers[wsID].wsID            = wsID;
                setTimeout(sendToWorker, 100, wsID, workerData);
            }
            else
            {
                if (typeof require !== 'undefined' && measurementParameters.platform === 'desktop')
                {
                    var WorkerNode              = require("tiny-worker");
                    var path                    = require('path');
                    var ipcRendererMeasurement  = require('electron').ipcRenderer;

                    wsWorkersStatus[wsID]       = wsStateClosed;

                    const { app } = require('electron').remote;
                    wsWorkers[wsID] = new WorkerNode(path.join(app.getAppPath(), 'modules/WebWorker.js'));

                    ipcRendererMeasurement.send('iasSetWorkerPID', wsWorkers[wsID].child.pid),

                    workerData = JSON.parse(workerData);
                    workerData.ndServerFamily = measurementParameters.ndServerFamily;
                    workerData = JSON.stringify(workerData);
                }
                else
                {
                    wsWorkersStatus[wsID]   = wsStateClosed;
                    wsWorkers[wsID]         = new Worker(wsWorkerPath);
                }

                wsWorkers[wsID].onmessage = function (event)
                {
                    workerCallback(JSON.parse(event.data));
                };

                sendToWorker(wsID, workerData);
            }
        }

        wsTimeoutTimer = setTimeout(measurementTimeout, wsTimeout);
    };

    /**
     * @function measurementStop
     * @description Function to Stop test cases
     * @public
     */
    this.measurementStop = function()
    {
        clearInterval(wsTimeoutTimer);
        clearInterval(wsInterval);
        clearTimeout(wsStartupTimeout);
        clearTimeout(classCheckReportTimeout);

        console.log(wsTestCase + ': stopping measurement');

        if (typeof wsWorkers !== 'undefined')
        {
            var workerData = prepareWorkerData('close');

            for (var wsID = 0; wsID < wsWorkers.length; wsID++)
            {
                sendToWorker(wsID, workerData);
            }
        }
    };

    /**
     * @function workerCallback
     * @description Function to receive callbacks from a worker
     * @public
     * @param {string} data JSON coded measurement Results
     */
    this.workerCallback = function(data)
    {
        workerCallback(JSON.parse(data));
    };




    /*-------------------------private functions------------------------*/

    /**
     * @function workerCallback
     * @description Function to receive callbacks from a worker
     * @private
     * @param {string} data measurement Results
     */
    function workerCallback(data)
    {
        switch (data.cmd)
        {
            case 'info':
            {
                wsWorkersStatus[data.wsID] = data.wsState;
                if (logDebug)
                {
                    console.log('wsWorker ' + data.wsID + ' command: \'' + data.cmd + '\' message: \'' + data.msg);
                }

                if (data.msg === 'counter' && wsMeasurementTime === 0)
                {
                    classCheckData[data.wsID].push(data.wsData);
                    classCheckFrames[data.wsID].push(data.wsFrames);

                    var ulStreamReportDict = classCheckUlReportDict[data.wsID];

                    for (var key in data.ulReportDict)
                    {
                        var ulValueDict = {};
                        ulValueDict.bRcv = Number(data.ulReportDict[key].bRcv);
                        ulValueDict.hRcv = Number(data.ulReportDict[key].hRcv);
                        if (typeof ulStreamReportDict !== 'undefined')
                        {
                            ulStreamReportDict[data.ulReportDict[key].time] = ulValueDict;
                        }
                    }
                    classCheckUlReportDict[data.wsID] = ulStreamReportDict;
                }

                break;
            }

            case 'open':
            {
                wsWorkersStatus[data.wsID] = data.wsState;
                var allOpen = true;

                for (var wsWorkersStatusID = 0; wsWorkersStatusID < wsWorkersStatus.length; wsWorkersStatusID++)
                {
                    if (wsWorkersStatus[wsWorkersStatusID] !== wsStateOpen)
                    {
                        allOpen = false;
                    }
                }

                if (logDebug)
                {
                    console.log('wsWorker ' + data.wsID + ' websocket open');
                }
                if (allOpen)
                {
                    if (logDebug)
                    {
                        console.log('all websockets open');
                    }

                    if (wsTestCase === 'upload')
                    {
                        var workerData = prepareWorkerData('uploadStart');

                        for (var wsID = 0; wsID < wsWorkers.length; wsID++)
                        {
                            sendToWorker(wsID, workerData);
                        }
                    }

                    clearTimeout(wsTimeoutTimer);

                    if (wsTestCase === 'rtt')
                    {
                        measurementStart(true);
                    }

                    if (wsTestCase === 'download')
                    {
                        wsStartupStartTime  = performance.now()+500;
                        classCheckStartTime = performance.now();
                        wsStartupTimeout    = setTimeout(measurementStart, wsStartupTime+500);
                    }

                    if (wsTestCase === 'upload')
                    {
                        wsStartupStartTime  = performance.now();
                        classCheckStartTime = performance.now();
                        wsStartupTimeout    = setTimeout(measurementStart, wsStartupTime);
                    }

                    if (wsTestCase === 'download' || wsTestCase === 'upload')
                    {
                        classCheckFetchTimeout  = setTimeout(classCheckFetch, 1000);
                        classCheckReportTimeout = setTimeout(classCheckReport, classCheckReportTime + 500);
                    }
                }
                break;
            }

            case 'close':
            {
                if (typeof wsWorkersStatus !== 'undefined') wsWorkersStatus[data.wsID] = data.wsState;
                break;
            }

            case 'report':
            {
                if (typeof wsWorkersStatus !== 'undefined') wsWorkersStatus[data.wsID] = data.wsState;

                if (wsTestCase === 'rtt')
                {
                    if (data.wsRttValues)
                    {
                        wsRttValues = data.wsRttValues;
                        wsRttValues.duration = Math.round(wsMeasurementTime * 1000 * 1000);
                    }

                    for (key in wsRttValues)
                    {
                        if (typeof wsRttValues[key] === 'undefined' ||  wsRttValues[key] === 'undefined' ||  wsRttValues[key] === null ||  wsRttValues[key] === 'null')
                        {
                            delete wsRttValues[key];
                        }
                    }

                    break;
                }

                if (data.msg === 'startupCompleted')
                {
                    wsFrameSize     = data.wsFrameSize;

                    if (wsTestCase === 'download')
                    {
                        dlStartupData[data.wsID]    += data.wsData;
                        dlStartupFrames[data.wsID]  += data.wsFrames;
                    }

                    if (wsTestCase === 'upload')
                    {
                        ulStartupData[data.wsID]    += data.wsData;
                        ulStartupFrames[data.wsID]  += data.wsFrames;
                    }

                    break;
                }
                else if (wsTestCase === 'download')
                {
                    dlData[data.wsID]    += data.wsData;
                    dlFrames[data.wsID]  += data.wsFrames;

                    if (data.wsTime > wsWorkerTime)
                    {
                        wsWorkerTime = data.wsTime;
                    }

                    break;
                }
                else if (wsTestCase === 'upload')
                {
                    var ulStreamReportDict = ulReportDict[data.wsID];

                    for (var key in data.ulReportDict)
                    {
                        var ulValueDict = {};
                        ulValueDict.bRcv = Number(data.ulReportDict[key].bRcv);
                        ulValueDict.hRcv = Number(data.ulReportDict[key].hRcv);
                        if (typeof ulStreamReportDict !== 'undefined')
                        {
                            ulStreamReportDict[data.ulReportDict[key].time] = ulValueDict;
                        }
                    }
                    ulReportDict[data.wsID] = ulStreamReportDict;

                    break;
                }

                break;
            }

            case 'error':
            {
                wsWorkersStatus[data.wsID] = data.wsState;
                if (data.msg === 'authorizationConnection' && !wsMeasurementError && this.wsTestCase !== 'rtt')
                {
                    wsMeasurementError = true;
                    measurementError('authorization unsuccessful or no connection to measurement peer', 4, 1, 0);
                }
                if (data.msg === 'overload' && !wsMeasurementError)
                {
                    wsMeasurementError = true;
                    measurementError('measurement peer overloaded', 6, 1, 0);
                }

                break;
            }

            default:
            {
                console.log('wsWorker ' + data.wsID + ' unknown command: ' + data.cmd + '\' message: \'' + data.msg);
                break;
            }
        }
    }

    /**
     * @function measurementError
     * @description Function to report errors and close active connections
     * @private
     * @param {string} errorDescription Description of the Error
     * @param {string} errorCode Error Code
     * @param {string} systemAvailability System Availability
     * @param {string} serviceAvailability Service Availability
     */
    function measurementError(errorDescription, errorCode, systemAvailability, serviceAvailability)
    {
        clearInterval(wsTimeoutTimer);
        clearTimeout(classCheckFetchTimeout);
        clearTimeout(classCheckReportTimeout);

        if ((errorCode === 2 || errorCode === 4) && wsTestCase === 'rtt')
        {
            wsMeasurementError = true;
            reportToMeasurement('info', 'no connection to measurement peer');
            measurementFinish();
            return;
        }

        console.log(wsTestCase + ': ' + errorDescription);
        wsErrorCode             = errorCode;
        wsErrorDescription      = errorDescription;
        wsSystemAvailability    = systemAvailability;
        wsServiceAvailability   = serviceAvailability;
        reportToMeasurement('error',  errorDescription);
        for (var wsID = 0; wsID < wsWorkers.length; wsID++)
        {
            var workerData = prepareWorkerData('close', wsID);

            sendToWorker(wsID, workerData);
        }
        resetValues();
    }

    /**
     * @function measurementTimeout
     * @description Function to report timeouts
     * @private
     */
    function measurementTimeout()
    {
        wsMeasurementError = true;
        measurementError('webSocket timeout error', 2, 1, 0);
    }

    function classCheckFetch()
    {
        classCheckValues.streamsStart = 0;

        for (var wsID = 0; wsID < wsWorkers.length; wsID++)
        {
            var workerData = prepareWorkerData('fetchCounter', wsID);
            sendToWorker(wsID, workerData);

            if (wsWorkersStatus[wsID] === wsStateOpen)
            {
                classCheckValues.streamsStart++;
            }
        }
    }

    function classCheckReport()
    {
        if (wsMeasurementTime === 0)
        {
            var currentTime   = performance.now();
            var reportMissing = false;

            //on upload, make sure that at least one report was received per stream to account for jitter
            if (wsTestCase === 'upload')
            {
                for (var wsID = 0; wsID < wsWorkersStatus.length; wsID++)
                {
                    var reportsReceived = 0;

                    for (var i = 0; i < classCheckData.length; i++)
                    {
                        if (typeof classCheckData[wsID][i] !== 'undefined')
                        {
                            reportsReceived++;
                        }
                    }
    
                    if (reportsReceived < 1)
                    {
                        console.log("Missing upload report on #" + wsID + "");
                        reportMissing = true;
                    }
                    else
                    {
                        console.log("At least one upload report received on #" + wsID);
                        if (reportMissing && reportsReceived >= 3)
                        {
                            //if one stream received at least 3 valid reports, continue
                            console.log(reportsReceived + " upload reports received on #" + wsID);
                            reportMissing = false;
                        }
                    }
                }
            }

            classCheckValues.dataTotal = 0;
            classCheckValues.durationTotal = 0;
            classCheckValues.frameSize = wsFrameSize;
            classCheckValues.framesTotal = 0;
            classCheckValues.overheadPerFrame = wsOverheadPerFrame;

            var keyCount = 0;

            for (var wsID = 0; wsID < wsWorkersStatus.length; wsID++)
            {
                classCheckValues.dataTotal     += classCheckData[wsID][classCheckData[wsID].length-1];
                classCheckValues.framesTotal   += classCheckFrames[wsID][classCheckFrames[wsID].length-1];

                if (classCheckValues.dataTotal === 0 || isNaN(classCheckValues.dataTotal))
                {
                    reportMissing = true;
                    break;
                }

                if (wsTestCase === 'upload')
                {
                    var keyCountStream = Object.keys(classCheckUlReportDict[wsID]).length;
                    keyCount = (keyCountStream > keyCount) ? keyCountStream : keyCount;
                }
            }

            if (reportMissing && ((currentTime - classCheckStartTime) + classCheckReportTime < wsStartupTime))
            {
                console.log("No data available and/or no upload reports, skipping calculation");
                
                classCheckFetchTimeout  = setTimeout(classCheckFetch, 500);
                classCheckReportTimeout = setTimeout(classCheckReport, classCheckReportTime);
                return;
            }

            if (reportMissing && !(currentTime - classCheckStartTime) + classCheckReportTime < wsStartupTime)
            {
                console.warn("Still no data available and/or no upload reports at final callback before measurement start, forcing class change");
            }

            if (wsTestCase === 'download')
            {
                classCheckValues.durationTotal = currentTime - classCheckStartTime;
            }
            else
            {
                classCheckValues.durationTotal = keyCount * ulSampleRate;
            }

            classCheckValues.overheadTotal = classCheckValues.framesTotal * wsOverheadPerFrame;
            classCheckValues.rateAvg = Math.round((((classCheckValues.dataTotal * 8) + (classCheckValues.overheadTotal * 8)) / (Math.round(classCheckValues.durationTotal) / 1000)));
            classCheckValues.durationTotal = Math.round(classCheckValues.durationTotal) * 1e6;
            classCheckValues.dataTotal = classCheckValues.dataTotal + classCheckValues.overheadTotal;

            if (isNaN(classCheckValues.rateAvg) || classCheckValues.rateAvg === null)
            {
                classCheckValues.rateAvg = 0;
            }

            reportToMeasurement('classCheck');

            if ((currentTime - classCheckStartTime) + classCheckReportTime < wsStartupTime)
            {
                classCheckFetchTimeout  = setTimeout(classCheckFetch, 500);
                classCheckReportTimeout = setTimeout(classCheckReport, classCheckReportTime);
            }
            else
            {
                clearTimeout(classCheckFetchTimeout);
                clearTimeout(classCheckReportTimeout);
            }
        }
        else
        {
            clearTimeout(classCheckFetchTimeout);
            clearTimeout(classCheckReportTimeout);
        }
    }

    /**
     * @function measurementStart
     * @description Function to start measurements
     * @private
     */
    function measurementStart()
    {
        wsStartTime = performance.now();
        clearTimeout(classCheckFetchTimeout);
        clearTimeout(classCheckReportTimeout);

        if (wsTestCase !== 'rtt')
        {
            for (var wsID = 0; wsID < wsWorkers.length; wsID++)
            {
                if (wsWorkersStatus[wsID] === wsStateOpen) wsStreamsStart++;
                var workerData = prepareWorkerData('resetCounter', wsID);

                sendToWorker(wsID, workerData);
            }
        }

        wsInterval = setInterval(measurementReport, wsReportInterval);

        console.log(wsTestCase + ': measurement started');
        reportToMeasurement('info', 'measurement started');
    }

    /**
     * @function measurementReport
     * @description Function to report measurement results
     * @private
     */
    function measurementReport()
    {
        wsEndTime = performance.now();
        if (
            ((wsRttValues.replies + wsRttValues.missing + wsRttValues.errors) === rttRequests && wsTestCase === 'rtt')
            || ((wsEndTime - wsStartTime) > wsMeasurementRunningTime && wsTestCase === 'download')
            || ((wsEndTime - wsStartTime - ulTailTime) > wsMeasurementRunningTime && wsTestCase === 'upload')
            )
        {
            clearInterval(wsInterval);
            wsCompleted = true;
            for (var wsID = 0; wsID < wsWorkers.length; wsID++)
            {
                if (wsWorkersStatus[wsID] === wsStateOpen) wsStreamsEnd++;
                var workerData = prepareWorkerData('close', wsID);

                sendToWorker(wsID, workerData);
            }
            wsEndTime = performance.now();
            setTimeout(measurementFinish, 100);
        }
        else if ((wsEndTime - wsStartTime) > 500)
        {
            for (var wsID = 0; wsID < wsWorkers.length; wsID++)
            {
                var workerData = prepareWorkerData('report', wsID);

                sendToWorker(wsID, workerData);
            }
            wsMeasurementTime       = performance.now() - wsStartTime;
            wsMeasurementTimeTotal  = performance.now() - wsStartupStartTime;

            if (!wsCompleted)
            {
                setTimeout(report, 100);
            }
        }
    }

    /**
     * @function measurementFinish
     * @description Function to finish measurements
     * @private
     */
    function measurementFinish()
    {
        console.log(wsTestCase + ': measurement finished');

        wsMeasurementTime       = wsEndTime - wsStartTime;
        wsMeasurementTimeTotal  = wsEndTime - wsStartupStartTime;
        report(true);
    }




    /*-------------------------helper------------------------*/

    /**
     * @function report
     * @description Function to report measurement results
     * @private
     * @param {bool} finish Indicates if the measurement is finished
     */
    function report(finish)
    {
        if ((wsWorkerTime - wsStartTime) > wsMeasurementTime)
        {
            wsMeasurementTime       = wsWorkerTime - wsStartTime;
            wsMeasurementTimeTotal  = wsWorkerTime - wsStartupStartTime;
        }

        var msg;

        wsData          = 0;
        wsFrames        = 0;
        wsDataTotal     = 0;
        wsFramesTotal   = 0;

        if (wsTestCase === 'download')
        {
            for (var wsID = 0; wsID < wsWorkers.length; wsID++)
            {
                wsData        += dlData[wsID];
                wsFrames      += dlFrames[wsID];
                wsDataTotal   += dlStartupData[wsID];
                wsFramesTotal += dlStartupFrames[wsID];
            }
            wsDataTotal   += wsData;
            wsFramesTotal += wsFrames;

            msg = 'ok';
        }

        if (wsTestCase === 'upload')
        {
            var ulData = 0;
            var ulFrames = 0;
            var ulTailData = 0;
            var ulTailFrames = 0;
            var keyCount = 0;
            
            for (var wsID = 0; wsID < wsWorkers.length; wsID++)
            {
                var ulStreamReportDict = ulReportDict[wsID];

                var keyCountStream = 0;
                for (var streamKey in ulStreamReportDict)
                {
                    if (keyCountStream >= wsMeasurementRunningTime / ulSampleRate)
                    {
                        ulTailData      += ulStreamReportDict[streamKey].bRcv;
                        ulTailFrames    += ulStreamReportDict[streamKey].hRcv;
                    }
                    else
                    {
                        ulData      += ulStreamReportDict[streamKey].bRcv;
                        ulFrames    += ulStreamReportDict[streamKey].hRcv;
                        keyCountStream++;
                    }
                }

                keyCount = (keyCountStream > keyCount) ? keyCountStream : keyCount;

                wsDataTotal   += ulStartupData[wsID];
                wsFramesTotal += ulStartupFrames[wsID];
            }

            wsData            = ulData;
            wsFrames          = ulFrames;
            wsDataTotal      += wsData   + ulTailData;
            wsFramesTotal    += wsFrames + ulTailFrames;
            wsMeasurementTime = keyCount * ulSampleRate;

            msg = 'ok';
        }

        if (wsTestCase !== 'rtt')
        {
            wsOverhead           = (wsFrames * wsOverheadPerFrame);
            wsOverheadTotal      = (wsFramesTotal * wsOverheadPerFrame);
            wsSpeedAvgBitS       = (((wsData * 8) + (wsOverhead * 8)) / (Math.round(wsMeasurementTime) / 1000));
            
            if (isNaN(wsSpeedAvgBitS))
            {
                wsSpeedAvgBitS = 0;
            }
        }

        var finishString     = '';
        var cmd              = 'report';

        if (finish)
        {
            cmd = 'finish';
            msg = 'measurement finished';
            finishString = 'Overall ';
            console.log('--------------------------------------------------------');
        }

        if (logReports && wsTestCase === 'rtt')
        {
            console.log(finishString + 'Time:                   ' + wsRttValues.duration + ' ns');
            console.log(finishString + 'RTT Average:            ' + wsRttValues.avg + ' ns');
            console.log(finishString + 'RTT Median:             ' + wsRttValues.med + ' ns');
            console.log(finishString + 'RTT Min:                ' + wsRttValues.min + ' ns');
            console.log(finishString + 'RTT Max:                ' + wsRttValues.max + ' ns');
            console.log(finishString + 'RTT Sent:               ' + wsRttValues.requests);
            console.log(finishString + 'RTT Received:           ' + wsRttValues.replies);
            console.log(finishString + 'RTT Errors:             ' + wsRttValues.errors);
            console.log(finishString + 'RTT Missing:            ' + wsRttValues.missing);
            console.log(finishString + 'RTT Packet Size:        ' + wsRttValues.packetsize);
            console.log(finishString + 'RTT Standard Deviation: ' + wsRttValues.stDevPop + ' ns');
            console.log(finishString + 'RTT single results:     ' + JSON.stringify(wsRttValues.rtts));
        }
        else if (logReports)
        {
            console.log(finishString + 'Time:                   ' + Math.round(wsMeasurementTime) * 1e6 + ' ns');
            console.log(finishString + 'Data:                   ' + (wsData + wsOverhead) + ' bytes');
            console.log(finishString + 'TCP Throughput:         ' + (wsSpeedAvgBitS / 1e6).toFixed(2) + ' MBit/s');
        }

        //set KPIs
        if (wsTestCase === 'download')
        {
            wsDownloadValues.rateAvg       = Math.round(wsSpeedAvgBitS);
            wsDownloadValues.data          = wsData + wsOverhead;
            wsDownloadValues.dataTotal     = wsDataTotal + wsOverheadTotal;
            wsDownloadValues.duration      = Math.round(wsMeasurementTime) * 1e6;
            wsDownloadValues.durationTotal = Math.round(wsMeasurementTimeTotal) * 1e6;
            wsDownloadValues.streamsStart  = wsStreamsStart;
            wsDownloadValues.streamsEnd    = wsStreamsEnd;
            wsDownloadValues.frameSize     = wsFrameSize;
            wsDownloadValues.frames        = wsFrames;
            wsDownloadValues.framesTotal   = wsFramesTotal;
            wsDownloadValues.overhead      = wsOverhead;
            wsDownloadValues.overheadTotal = wsOverheadTotal;
        }

        if (wsTestCase === 'upload')
        {
            wsUploadValues.rateAvg         = Math.round(wsSpeedAvgBitS);
            wsUploadValues.data            = wsData + wsOverhead;
            wsUploadValues.dataTotal       = wsDataTotal + wsOverheadTotal;
            wsUploadValues.duration        = Math.round(wsMeasurementTime) * 1e6;
            wsUploadValues.durationTotal   = Math.round(wsMeasurementTimeTotal) * 1e6;
            wsUploadValues.streamsStart    = wsStreamsStart;
            wsUploadValues.streamsEnd      = wsStreamsEnd;
            wsUploadValues.frameSize       = wsFrameSize;
            wsUploadValues.frames          = wsFrames;
            wsUploadValues.framesTotal     = wsFramesTotal;
            wsUploadValues.overhead        = wsOverhead;
            wsUploadValues.overheadTotal   = wsOverheadTotal;
            wsUploadValues.framePerCall    = uploadFramesPerCall;
        }

        reportToMeasurement(cmd, msg);
        if (finish) resetValues();
    }

    /**
     * @function reportToMeasurement
     * @description Function to report measurement results to the WSControl Callback class
     * @private
     * @param {string} cmd Callback Command
     * @param {string} msg Callback Message
     */
    function reportToMeasurement(cmd, msg)
    {
        var report          = {};
        report.cmd          = cmd;
        report.msg          = msg;
        report.test_case    = wsTestCase;

        if (cmd === 'classCheck')
        {
            report = getKPIsClassCheck(report);
        }
        else
        {
            if (wsTestCase === 'rtt')       report = getKPIsRtt(report);
            if (wsTestCase === 'download')  report = getKPIsDownload(report);
            if (wsTestCase === 'upload')    report = getKPIsUpload(report);
            report = getKPIsAvailability(report);
        }

        if (wsControl !== null && wsControl.callback !== null && wsControl.callback === 'wsMeasurement' && typeof this.wsMeasurement !== 'undefined')  this.wsMeasurement.controlCallback(JSON.stringify(report));
    }

    /**
     * @function getKPIsRtt
     * @description Function to collect RTT KPIs
     * @private
     * @param {string} report Object to add KPIs to
     */
    function getKPIsRtt(report)
    {
        report.duration_ns              = wsRttValues.duration;
        report.average_ns               = wsRttValues.avg;
        report.median_ns                = wsRttValues.med;
        report.min_ns                   = wsRttValues.min;
        report.max_ns                   = wsRttValues.max;
        report.num_sent                 = wsRttValues.requests;
        report.num_received             = wsRttValues.replies;
        report.num_error                = wsRttValues.errors;
        report.num_missing              = wsRttValues.missing;
        report.packet_size              = wsRttValues.packetsize;
        report.standard_deviation_ns    = wsRttValues.stDevPop;
        report.rtts                     = wsRttValues.rtts;

        return report;
    }

    /**
     * @function getKPIsDownload
     * @description Function to collect Download KPIs
     * @private
     * @param {string} report Object to add KPIs to
     */
    function getKPIsDownload(report)
    {
        report.downloadKPIs = {};
        report.downloadKPIs.throughput_avg_bps               = wsDownloadValues.rateAvg;
        report.downloadKPIs.bytes                            = wsDownloadValues.data;
        report.downloadKPIs.bytes_including_slow_start       = wsDownloadValues.dataTotal;
        report.downloadKPIs.duration_ns                      = wsDownloadValues.duration;
        report.downloadKPIs.duration_ns_total                = wsDownloadValues.durationTotal;
        report.downloadKPIs.num_streams_start                = wsDownloadValues.streamsStart;
        report.downloadKPIs.num_streams_end                  = wsDownloadValues.streamsEnd;
        report.downloadKPIs.frame_size                       = wsDownloadValues.frameSize;
        report.downloadKPIs.frame_count                      = wsDownloadValues.frames;
        report.downloadKPIs.frame_count_including_slow_start = wsDownloadValues.framesTotal;
        report.downloadKPIs.overhead                         = wsDownloadValues.overhead;
        report.downloadKPIs.overhead_including_slow_start    = wsDownloadValues.overheadTotal;
        report.downloadKPIs.overhead_per_frame               = wsDownloadValues.overheadPerFrame;

        report.downloadStreamKPIs = [];
        for (var wsID = 0; wsID < wsWorkers.length; wsID++)
        {
            var downloadStreamKPIs = {};
            downloadStreamKPIs.stream_id                        = wsID;
            downloadStreamKPIs.bytes                            = dlData[wsID] + (dlFrames[wsID] * wsOverheadPerFrame);
            downloadStreamKPIs.bytes_including_slow_start       = dlData[wsID] + dlStartupData[wsID] + ((dlFrames[wsID] + dlStartupFrames[wsID]) * wsOverheadPerFrame);
            downloadStreamKPIs.relative_time_ns                 = wsDownloadValues.duration;
            downloadStreamKPIs.relative_time_ns_total           = wsDownloadValues.durationTotal;
            downloadStreamKPIs.frame_count                      = dlFrames[wsID];
            downloadStreamKPIs.frame_count_including_slow_start = dlFrames[wsID] + dlStartupFrames[wsID];

            report.downloadStreamKPIs.push(downloadStreamKPIs);
        }

        return report;
    }

    /**
     * @function getKPIsUpload
     * @description Function to collect Upload KPIs
     * @private
     * @param {string} report Object to add KPIs to
     */
    function getKPIsUpload(report)
    {
        report.uploadKPIs = {};
        report.uploadKPIs.throughput_avg_bps               = wsUploadValues.rateAvg;
        report.uploadKPIs.bytes                            = wsUploadValues.data;
        report.uploadKPIs.bytes_including_slow_start       = wsUploadValues.dataTotal;
        report.uploadKPIs.duration_ns                      = wsUploadValues.duration;
        report.uploadKPIs.duration_ns_total                = wsUploadValues.durationTotal;
        report.uploadKPIs.num_streams_start                = wsUploadValues.streamsStart;
        report.uploadKPIs.num_streams_end                  = wsUploadValues.streamsEnd;
        report.uploadKPIs.frame_size                       = wsUploadValues.frameSize;
        report.uploadKPIs.frame_count                      = wsUploadValues.frames;
        report.uploadKPIs.frame_count_including_slow_start = wsUploadValues.framesTotal;
        report.uploadKPIs.overhead                         = wsUploadValues.overhead;
        report.uploadKPIs.overhead_including_slow_start    = wsUploadValues.overheadTotal;
        report.uploadKPIs.overhead_per_frame               = wsUploadValues.overheadPerFrame;
        report.uploadKPIs.frames_per_call                  = wsUploadValues.framePerCall;

        report.uploadStreamKPIs = [];
        for (var wsID = 0; wsID < wsWorkers.length; wsID++)
        {
            var uploadStreamKPIs = {};
            var data       = 0;
            var frames     = 0;
            var tailData   = 0;
            var tailFrames = 0;

            var ulStreamReportDict = ulReportDict[wsID];

            var keyCountStream = 0;
            for (var streamKey in ulStreamReportDict)
            {
                if (keyCountStream >= wsMeasurementRunningTime / ulSampleRate)
                {
                    tailData      += ulStreamReportDict[streamKey].bRcv;
                    tailFrames    += ulStreamReportDict[streamKey].hRcv;
                }
                else
                {
                    data   += ulStreamReportDict[streamKey].bRcv;
                    frames += ulStreamReportDict[streamKey].hRcv;
                    keyCountStream++;
                }
            }

            uploadStreamKPIs.stream_id                        = wsID;
            uploadStreamKPIs.bytes                            = data + (frames * wsOverheadPerFrame);
            uploadStreamKPIs.bytes_including_slow_start       = data + tailData + ulStartupData[wsID] + ((frames + tailFrames + ulStartupFrames[wsID]) * wsOverheadPerFrame);
            uploadStreamKPIs.relative_time_ns                 = wsUploadValues.duration;
            uploadStreamKPIs.relative_time_ns_total           = wsUploadValues.durationTotal;
            uploadStreamKPIs.frame_count                      = frames;
            uploadStreamKPIs.frame_count_including_slow_start = frames + tailFrames + ulStartupFrames[wsID];

            report.uploadStreamKPIs.push(uploadStreamKPIs);
        }

        return report;
    }

    function getKPIsClassCheck(report)
    {
        var key = (wsTestCase === 'download') ? 'downloadKPIs' : 'uploadKPIs';

        report[key] = {};
        report[key].throughput_avg_bps                       = classCheckValues.rateAvg;
        report[key].bytes_including_slow_start               = classCheckValues.dataTotal;
        report[key].duration_ns_total                        = Math.round(classCheckValues.durationTotal);
        report[key].num_streams_start                        = classCheckValues.streamsStart;
        report[key].frame_size                               = classCheckValues.frameSize;
        report[key].frame_count_including_slow_start         = classCheckValues.framesTotal;
        report[key].overhead_including_slow_start            = classCheckValues.overheadTotal;
        report[key].overhead_per_frame                       = classCheckValues.overheadPerFrame;
        report[key].classCheck                               = classCheckValues.classCheck;

        return report;
    }

    /**
     * @function getKPIsAvailability
     * @description Function to collect Availability KPIs
     * @private
     * @param {string} report Object to add KPIs to
     */
    function getKPIsAvailability(report)
    {
        report.error_code                   = wsErrorCode;
        report.error_description            = wsErrorDescription;

        return report;
    }

    /**
     * @function prepareWorkerData
     * @description Function to prepare the WSWorker control data
     * @private
     * @param {string} cmd Command to execute
     * @param {int} wsID ID of the worker
     */
    function prepareWorkerData(cmd, wsID)
    {
        var workerData                  = {};
        workerData.cmd                  = cmd;
        workerData.wsTestCase           = wsTestCase;
        workerData.wsID                 = wsID;
        workerData.wsTarget             = wsTarget;
        workerData.wsTargetPort         = wsTargetPort;
        workerData.wsWss                = wsWss;
        workerData.wsProtocol           = wsProtocol;
        workerData.wsFrameSize          = wsFrameSize;
        workerData.uploadFramesPerCall  = uploadFramesPerCall;
        workerData.wsAuthToken          = wsAuthToken;
        workerData.wsAuthTimestamp      = wsAuthTimestamp;
        workerData.wsTLD                = wsTLD;

        if (wsTestCase === 'rtt')
        {
            workerData.rttRequests              = rttRequests;
            workerData.rttRequestTimeout        = rttRequestTimeout;
            workerData.rttRequestWait           = rttRequestWait;
            workerData.rttTimeout               = rttTimeout;
            workerData.rttPayloadSize           = rttPayloadSize;
        }

        return JSON.stringify(workerData);
    }

    /**
     * @function sendToWorker
     * @description Function to send data to a worker
     * @private
     * @param {int} wsID ID of the worker
     * @param {string} workerData data to send
     */
    function sendToWorker(wsID, workerData)
    {
        if (useWebWorkers)
        {
            wsWorkers[wsID].postMessage(workerData);
        }
        else
        {
            wsWorkers[wsID].onmessageWorker(workerData);
        };
    }

    /**
     * @function resetValues
     * @description Initialize all variables with default values
     * @private
     */
    function resetValues()
    {
        clearInterval(wsInterval);
        clearTimeout(classCheckFetchTimeout);
        clearTimeout(classCheckReportTimeout);

        wsTestCase                  = '';
        wsData                      = 0;
        wsDataTotal                 = 0;
        wsFrames                    = 0;    
        wsFramesTotal               = 0;
        wsSpeedAvgBitS              = 0;
        wsOverhead                  = 0;
        wsOverheadTotal             = 0;
        wsStartTime                 = performance.now();
        wsEndTime                   = performance.now();
        wsMeasurementTime           = 0;
        wsMeasurementTimeTotal      = 0;
        wsStartupStartTime          = performance.now();
        wsOverheadPerFrame          = 0;
        wsWorkers                   = 0;
        wsWorkersStatus             = 0;
        wsWorkerTime                = 0;
        wsInterval                  = 0;
        wsMeasurementRunningTime    = 0;
        wsCompleted                 = false;
        wsReportInterval            = 0;
        wsTimeoutTimer              = 0;
        wsTimeout                   = 0;
        wsStartupTimeout            = 0;
        wsStreamsStart              = 0;
        wsStreamsEnd                = 0;
        wsFrameSize                 = 0;

        wsAuthToken                 = '-';
        wsAuthTimestamp             = '-';

        dlData                      = {};
        dlFrames                    = {};
        dlStartupData               = {};
        dlStartupFrames             = {};

        ulReportDict                = {};
        ulStartupData               = {};
        ulStartupFrames             = {};

        wsSystemAvailability        = 1;
        wsServiceAvailability       = 1;
    }
};
