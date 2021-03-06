// measurement-agent-swift: MeasurementAgentKitTests.swift, created on 28.03.19
/*******************************************************************************
 * Copyright 2019 Benjamin Pucher (alladin-IT GmbH)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/


import XCTest
@testable import MeasurementAgentKit

class MeasurementAgentKitTests: XCTestCase {

    override func setUp() {
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }

    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testExample() {
        // This is an example of a functional test case.
        // Use XCTAssert and related functions to verify your tests produce the correct results.
    }

    func testPerformanceExample() {
        // This is an example of a performance test case.
        self.measure {
            // Put the code you want to measure the time of here.
        }
    }

    /*func testCollector() {

        let expectation = XCTestExpectation(description: "Test")

        let collectorService = CollectorService()

        /*collectorService.getVersion(onSuccess: { v in
            print(v.collectorServiceVersion)
            
            expectation.fulfill()
        }) { err in
            print(err)
            
            expectation.fulfill()
        }*/

        let reportModel = LmapReportDto()
        reportModel.agentId = "2e0bad07-90f5-4b57-8b0e-d22d39c4d4bc"
        reportModel.groupId = "group_id"
        reportModel.measurementPoint = "measurement_point"
        reportModel.date = Date()

        reportModel.additionalRequestInfo = ApiRequestInfo()
        reportModel.additionalRequestInfo?.agentId = reportModel.agentId
        reportModel.additionalRequestInfo?.agentType = .mobile
        reportModel.additionalRequestInfo?.osName = "iOS"

        reportModel.timeBasedResult = TimeBasedResultDto()
        reportModel.timeBasedResult?.durationNs = 1000000
        reportModel.timeBasedResult?.startTime = reportModel.date
        reportModel.timeBasedResult?.endTime = Date()

        collectorService.storeMeasurement(reportDto: reportModel, onSuccess: { response in
            print(response.uuid)
            print(response.openDataUuid)

            expectation.fulfill()
        }, onFailure: { err in
            print(err)

            expectation.fulfill()
        })

        wait(for: [expectation], timeout: 10.0)
    }

    func testController() {
        let expectation = XCTestExpectation(description: "Test")

        let controlService = ControlService()

        /*controlService.getVersion(onSuccess: { v in
            print(v.controllerServiceVersion)
         
            expectation.fulfill()
        }) { err in
            print(err)
         
            expectation.fulfill()
        }*/

        /*controlService.getIp(onSuccess: { ipr in
            print(ipr.ipAddress)
            print(ipr.ipVersion)
         
            expectation.fulfill()
        }) { err in
            print(err)
         
            expectation.fulfill()
        }*/

        let registrationRequest = RegistrationRequest()
        registrationRequest.termsAndConditionsAccepted = true
        registrationRequest.termsAndConditionsAcceptedVersion = 1
        registrationRequest.groupName = "test_group_name"

        controlService.registerAgent(registrationRequest: registrationRequest, onSuccess: { r in
            print(r.agentUuid)
            print(r.settings)

            expectation.fulfill()
        }, onFailure: { err in
            print(err)

            expectation.fulfill()
        })

        /*let controlDto = LmapControlDto()
        controlDto.agent = LmapAgentDto()
        controlDto.agent?.agentId = "2e0bad07-90f5-4b57-8b0e-d22d39c4d4bc"

        controlDto.capabilities = LmapCapabilityDto()

        let speedTask = LmapCapabilityTaskDto()
        speedTask.taskName = MeasurementTypeDto.speed.rawValue
        speedTask.version = "1.0.0"
        speedTask.program = "ias"

        let qosTask = LmapCapabilityTaskDto()
        qosTask.taskName = MeasurementTypeDto.qos.rawValue
        qosTask.version = "1.0.0"
        speedTask.program = "qos"

        controlDto.capabilities?.tasks = [speedTask, qosTask]

        controlService.initiateMeasurement(controlDto: controlDto, onSuccess: { c in
            print(c.schedules)

            expectation.fulfill()
        }) { err in
            print(err)

            expectation.fulfill()
        }*/

        wait(for: [expectation], timeout: 10.0)
     }*/

    func testX() {

        let json = """
        {
        "measurement_configuration" : {
          "upload" : [ {
            "default" : true,
            "streams" : 4,
            "frameSize" : 2048,
            "bounds" : {
              "lower" : 1.05,
              "upper" : 0.01
            },
            "framesPerCall" : 1
          }, {
            "default" : null,
            "streams" : 4,
            "frameSize" : 65535,
            "bounds" : {
              "lower" : 525.0,
              "upper" : 0.95
            },
            "framesPerCall" : 1
          }, {
            "default" : null,
            "streams" : 4,
            "frameSize" : 65535,
            "bounds" : {
              "lower" : 1050.0,
              "upper" : 475.0
            },
            "framesPerCall" : 4
          }, {
            "default" : null,
            "streams" : 8,
            "frameSize" : 65535,
            "bounds" : {
              "lower" : 9000.0,
              "upper" : 950.0
            },
            "framesPerCall" : 20
          } ],
          "download" : [ {
            "default" : true,
            "streams" : 4,
            "frameSize" : 2048,
            "bounds" : {
              "lower" : 1.05,
              "upper" : 0.01
            },
            "framesPerCall" : null
          }, {
            "default" : null,
            "streams" : 4,
            "frameSize" : 32768,
            "bounds" : {
              "lower" : 525.0,
              "upper" : 0.95
            },
            "framesPerCall" : null
          }, {
            "default" : null,
            "streams" : 4,
            "frameSize" : 524288,
            "bounds" : {
              "lower" : 1050.0,
              "upper" : 475.0
            },
            "framesPerCall" : null
          }, {
            "default" : null,
            "streams" : 8,
            "frameSize" : 524288,
            "bounds" : {
              "lower" : 9000.0,
              "upper" : 950.0
            },
            "framesPerCall" : null
          } ]
        }
      }
    """

        let data = json.data(using: .utf8)!
        // swiftlint:disable all
        let x = try! JSONDecoder().decode(MeasurementTypeParametersWrapperDto.self, from: data)
        // swiftlint:enable all

        print(x.content)
        print((x.content as? IasMeasurementTypeParametersDto)?.measurementConfiguration)
    }
}
