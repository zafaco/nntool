/*******************************************************************************
 * Copyright 2019 alladin-IT GmbH
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

import Foundation
import MeasurementAgentKit
import Speed
import nntool_shared_swift

///
class IASProgram: NSObject, ProgramProtocol {

    var programDelegate: ProgramDelegate?

    var delegate: IASProgramDelegate?

    var programConfiguration: ProgramConfiguration?

    let speed = Speed()

    let measurementFinishedSemaphore = DispatchSemaphore(value: 0)

    var measurementFailed = false

    var config: IasMeasurementConfiguration?

    var serverAddress: String?
    var serverPort: String?
    var encryption = false

    private var currentPhase = SpeedMeasurementPhase.rtt
    var authToken: String?
    var authTimestamp: String?
    var result: [AnyHashable: Any]?

    private var relativeStartTimeNs: UInt64?

    private var interfaceTrafficDownloadStart: InterfaceTraffic?
    private var interfaceTrafficUploadStart: InterfaceTraffic?
    private var interfaceTrafficUploadEnd: InterfaceTraffic?

    let encoder = JSONEncoder()

    enum IASError: Error {
        case measurementError
    }

    // swiftlint:disable cyclomatic_complexity
    func run(startTimeNs: UInt64, startTimeMs: UInt64) throws -> SubMeasurementResult {
        let relativeStartTimeNs = TimeHelper.currentTimeNs() - startTimeNs

        speed.speedDelegate = self

        if let addr = serverAddress, let port = serverPort {
            speed.targetTld = ""
            speed.targets = [addr]
            speed.targetPort = port
        } else {
            speed.targetTld = "net-neutrality.tools"
            speed.targets = ["peer-ias-de-01-ipv4"]
            speed.targetPort = "80"
        }

        speed.targetPortRtt = "80"
        speed.wss = encryption ? 1 : 0

        if authToken != nil && authTimestamp != nil {
            speed.authToken = authToken
            speed.authTimestamp = authTimestamp
        }

        speed.performRttUdpMeasurement   = programConfiguration?.enabledTasks.contains("rtt") ?? true
        speed.performDownloadMeasurement = programConfiguration?.enabledTasks.contains("download") ?? true
        speed.performUploadMeasurement   = programConfiguration?.enabledTasks.contains("upload") ?? true
        speed.performRouteToClientLookup = false
        speed.performGeolocationLookup   = false

        speed.measurementStart()
        delegate?.iasMeasurement(self, didStartPhase: .rtt)

        let semaphoreResult = measurementFinishedSemaphore.wait(timeout: DispatchTime.distantFuture)
        if semaphoreResult == .timedOut {
            cancel()
            // TODO: mark measurement as timed out
        }

        let relativeEndTimeNs = TimeHelper.currentTimeNs() - startTimeNs

        let res = IasMeasurementResult()

        if measurementFailed {
            // TODO: reason
            //res.status = .failed
            //return res
            throw IASError.measurementError
        }

        guard let r = result else {
            // TODO: reason

            //res.status = .failed // or .aborted
            //return res
            throw IASError.measurementError
        }

        res.relativeStartTimeNs = relativeStartTimeNs
        res.relativeEndTimeNs = relativeEndTimeNs

        res.status = .finished

        if let rttInfo = r["rtt_udp_info"] as? [AnyHashable: Any] {
            res.durationRttNs = UInt64((rttInfo["duration_ns"] as? String)!)

            res.rttInfo = RttInfoDto()

            res.rttInfo?.numError = (rttInfo["num_error"] as? NSString)?.integerValue
            res.rttInfo?.numMissing = (rttInfo["num_missing"] as? NSString)?.integerValue
            res.rttInfo?.numReceived = (rttInfo["num_received"] as? NSString)?.integerValue
            res.rttInfo?.numSent = (rttInfo["num_sent"] as? NSString)?.integerValue
            res.rttInfo?.packetSize = (rttInfo["packet_size"] as? NSString)?.integerValue

            res.rttInfo?.requestedNumPackets = Int(res.rttInfo?.numError ?? 0) + Int(res.rttInfo?.numMissing ?? 0) + Int(res.rttInfo?.numReceived ?? 0)

            // TODO: these values should be calculated on the collector.
            res.rttInfo?.averageNs = UInt64((rttInfo["average_ns"]  as? String)!)
            res.rttInfo?.maximumNs = UInt64((rttInfo["max_ns"] as? String)!)
            res.rttInfo?.medianNs = UInt64((rttInfo["median_ns"] as? String)!)
            res.rttInfo?.minimumNs = UInt64((rttInfo["min_ns"] as? String)!)
            res.rttInfo?.standardDeviationNs = UInt64((rttInfo["standard_deviation_ns"] as? String)!)
            //

            res.rttInfo?.rtts = (rttInfo["rtts"] as? [[AnyHashable: Any]])?.map {
                RttDto(rttNs: $0["rtt_ns"] as? UInt64, relativeTimeNs: UInt64(($0["relative_time_ns_measurement_start"] as? String)!) )
            }
        }

        res.connectionInfo = ConnectionInfoDto()

        if let lastDownloadInfo = (r["download_info"] as? [[AnyHashable: Any]])?.last {
            res.bytesDownload = UInt64((lastDownloadInfo["bytes"] as? String)!)
            res.bytesDownloadIncludingSlowStart = UInt64((lastDownloadInfo["bytes_including_slow_start"] as? String)!)
            res.durationDownloadNs = UInt64((lastDownloadInfo["duration_ns"] as? String)!)

            res.connectionInfo?.actualNumStreamsDownload = (lastDownloadInfo["num_streams_end"] as? NSString)?.integerValue
            res.connectionInfo?.requestedNumStreamsDownload = (lastDownloadInfo["num_streams_start"] as? NSString)?.integerValue
        }

        if let lastUploadInfo = (r["upload_info"] as? [[AnyHashable: Any]])?.last {
            res.bytesUpload = UInt64((lastUploadInfo["bytes"] as? String)!)
            res.bytesUploadIncludingSlowStart = UInt64((lastUploadInfo["bytes_including_slow_start"] as? String)!)
            res.durationUploadNs = UInt64((lastUploadInfo["duration_ns"] as? String)!)

            res.connectionInfo?.actualNumStreamsUpload = (lastUploadInfo["num_streams_end"] as? NSString)?.integerValue
            res.connectionInfo?.requestedNumStreamsUpload = (lastUploadInfo["num_streams_start"] as? NSString)?.integerValue
        }

        if let timeInfo = r["time_info"] as? [AnyHashable: Any] {
            if timeInfo["rtt_udp_start"] != nil {
                res.relativeStartTimeRttNs = UInt64((timeInfo["rtt_udp_start"] as? String)!)! - startTimeMs * NSEC_PER_MSEC // TODO: startTimeNs is not in unix timestamp
            }
            if timeInfo["download_start"] != nil {
                res.relativeStartTimeDownloadNs = UInt64((timeInfo["download_start"] as? String)!)! - startTimeMs * NSEC_PER_MSEC // TODO: startTimeNs is not in unix timestamp
            }
            if timeInfo["upload_start"] != nil {
                res.relativeStartTimeUploadNs = UInt64((timeInfo["upload_start"] as? String)!)! - startTimeMs * NSEC_PER_MSEC // TODO: startTimeNs is not in unix timestamp
            }
        }

        res.connectionInfo?.address = serverAddress
        res.connectionInfo?.encrypted = encryption

        if let serverPort = serverPort, let port = UInt16(serverPort) {
            res.connectionInfo?.port = port
        }

        if let dlStartTraffic = interfaceTrafficDownloadStart {
            if let ulStartTraffic = interfaceTrafficUploadStart {
                res.connectionInfo?.agentInterfaceDownloadMeasurementTraffic = TrafficDto.fromInterfaceTraffic(ulStartTraffic.differenceTo(dlStartTraffic))
            }
        }

        if let ulStartTraffic = interfaceTrafficUploadStart, let ulEndTraffic = interfaceTrafficUploadEnd {
            res.connectionInfo?.agentInterfaceUploadMeasurementTraffic = TrafficDto.fromInterfaceTraffic(ulEndTraffic.differenceTo(ulStartTraffic))
        }

        if let dlStartTraffic = interfaceTrafficDownloadStart, let ulEndTraffic = interfaceTrafficUploadEnd {
            res.connectionInfo?.agentInterfaceTotalTraffic = TrafficDto.fromInterfaceTraffic(ulEndTraffic.differenceTo(dlStartTraffic))
        }

        return res
    }
    // swiftlint:enable cyclomatic_complexity

    func cancel() {
        speed.measurementStop()
    }
}

extension IASProgram: SpeedDelegate {

    func showKpisFromResponse(response: [AnyHashable: Any]!) {
        //logger.debug(response.description)

        logger.debug("showKpisFromResponse (delegate: \(String(describing: delegate)))")

        logger.debug(response["cmd"])
        logger.debug(response["test_case"])
        /*logger.debug(response["msg"])
        logger.debug("-----")
        logger.debug(response)
        logger.debug("-----")*/

        if let cmd = response["cmd"] as? String {
            switch cmd {
            case "info": handleCmdInfo(response)
            case "report": handleCmdReport(response)
            case "finish":
                handleCmdReport(response)
                handleCmdFinish(response)
            case "error":
                logger.debug("MEASUREMENT ERROR -> aborting")
                measurementFailed = true
                speed.measurementStop()
            default: break
            }
        }
    }

    private func handleCmdInfo(_ response: [AnyHashable: Any]!) {
        let newPhase = SpeedMeasurementPhase(rawValue: response["test_case"] as? String ?? "init") ?? currentPhase
        if newPhase != currentPhase {
            currentPhase = newPhase

            switch newPhase {
            case .download: interfaceTrafficDownloadStart = InterfaceTrafficInfo.getWwanAndWifiNetworkInterfaceTraffic()
            case .upload: interfaceTrafficUploadStart = InterfaceTrafficInfo.getWwanAndWifiNetworkInterfaceTraffic()
            default: break
            }

            delegate?.iasMeasurement(self, didStartPhase: currentPhase)
        }
    }

    private func handleCmdReport(_ response: [AnyHashable: Any]!) {
        if let primaryValue: Double = {
            switch currentPhase {
            case .rtt: return Double(((response["rtt_udp_info"] as? [AnyHashable: Any])? ["average_ns"] as? String)!)
            case .download: return Double(((response["download_info"] as? [[AnyHashable: Any]])?.last?["throughput_avg_bps"] as? String)!)
            case .upload: return Double(((response["upload_info"] as? [[AnyHashable: Any]])?.last?["throughput_avg_bps"] as? String)!)
            default:
                return nil
            }
            }() {
            delegate?.iasMeasurement(self, didMeasurePrimaryValue: primaryValue, inPhase: currentPhase)
        }

        var phaseProgress: Double?

        switch currentPhase {
        case .initialize:
            break
        case .rtt:
            if let rttInfo = response["rtt_udp_info"] as? [String: Any] {

                phaseProgress = rttInfo["progress"] as? Double
                logger.debug("--!!-- RTT: \(String(describing: rttInfo["min_ns"])), \(String(describing: rttInfo["max_ns"])), \(String(describing: rttInfo["median_ns"]))")
            }
        case .download:
            if  let downloadInfo = response["download_info"] as? [[String: Any]],
                let lastDownloadInfo = downloadInfo.last {

                phaseProgress = lastDownloadInfo["progress"] as? Double
            }
        case .upload:
            if  let uploadInfo = response["upload_info"] as? [[String: Any]],
                let lastUploadInfo = uploadInfo.last {

                phaseProgress = lastUploadInfo["progress"] as? Double
            }
        }

        if let pp = phaseProgress {
            logger.debug("PHASE_PROGRESS: \(String(describing: phaseProgress))")
            delegate?.iasMeasurement(self, didUpdateProgress: pp, inPhase: currentPhase)
        }
    }

    private func handleCmdFinish(_ response: [AnyHashable: Any]!) {
        switch currentPhase {
        case .upload: interfaceTrafficUploadEnd = InterfaceTrafficInfo.getWwanAndWifiNetworkInterfaceTraffic()
        default: break
        }

        delegate?.iasMeasurement(self, didFinishPhase: currentPhase)
    }

    func measurementCallback(withResponse response: [AnyHashable: Any]!) {
        showKpisFromResponse(response: response)

        logger.debug("measurementCallback")
    }

    func measurementDidComplete(withResponse response: [AnyHashable: Any]!, withError error: Error!) {
        showKpisFromResponse(response: response)
        logger.debug(error)

        logger.debug("FIN")

        result = response

        logger.debugExec {
            let res = try? String(data: JSONSerialization.data(withJSONObject: result as Any, options: .prettyPrinted), encoding: .utf8)!
            logger.debug(res)
        }

        measurementFinishedSemaphore.signal()
    }

    func measurementDidStop() {
        logger.debug("STOP")

        measurementFinishedSemaphore.signal()
    }
}
