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
import UIKit
import MeasurementAgentKit
import QoSKit

///
class MeasurementViewController: CustomNavigationBarViewController {

    private var qosMeasurementViewController: QoSMeasurementViewController?
    @IBOutlet private var qosView: UIView?

    @IBOutlet private var progressInfoBar: ProgressInfoBar?
    @IBOutlet private var speedMeasurementGaugeView: SpeedMeasurementGaugeView?
    @IBOutlet private var speedMeasurementBasicResultView: SpeedMeasurementBasicResultView?

    @IBOutlet private var viewMeasurementResultButton: UIButton?

    @IBOutlet private var viewMeasurementResultButtonTopConstraint: NSLayoutConstraint?
    @IBOutlet private var viewMeasurementResultButtonBottomConstraint: NSLayoutConstraint?

    private var measurementRunner: MeasurementRunner?

    private var progressAlert: UIAlertController?

    private var overallProgress: Progress?
    private var overallProgressObservation: NSKeyValueObservation?

    private var qosProgress: Progress? // TODO: refactor to program progress array
    private var iasProgress: Progress? // TODO: only use the programs that are actually executed (only ias, only qos)

    private var iasPhaseProgress: [SpeedMeasurementPhase: Progress]?

    private var isRunning = false

    var preferredSpeedMeasurementPeer: SpeedMeasurementPeerResponse.SpeedMeasurementPeer?

    private var reachability: NetworkInfoReachability?

    private var measurementUuid: String?
    private var openDataUuid: String?

    // MARK: - UI Code

    ///
    override func viewDidLoad() {
        super.viewDidLoad()

        // Because the segue from HomeViewController to this view controller is not animated
        // the navigation button item appearance doesn't work as expected (very odd behaviour...).
        // As a workaround we change the title of this element after setting the appearance.
        navigationItem.rightBarButtonItem?.icon = .help

        // Shrink constraint constant if displaying on iPhone 5s or SE.
        if DeviceHelper.isSmalliPhone() {
            viewMeasurementResultButtonTopConstraint?.constant = 5
            viewMeasurementResultButtonBottomConstraint?.constant = 5
        }

        speedMeasurementGaugeView?.startButtonActionCallback = {
            guard MEASUREMENT_AGENT.isAtLeastOneMeasurementTaskEnabled() else {
                self.displayNoMeasurementTaskEnabledWarningAlert()
                return
            }

            if MEASUREMENT_TRAFFIC_WARNING_ENABLED {
                self.displayPreMeasurementWarningAlert()
            } else {
                self.startMeasurement()
            }
        }

        reachability = NetworkInfoReachability(whenReachable: { (type, details) in
            DispatchQueue.main.async {
                self.speedMeasurementGaugeView?.networkTypeLabel?.text = type
                self.speedMeasurementGaugeView?.networkDetailLabel?.text = details
            }
        }, whenUnreachable: {
            DispatchQueue.main.async {
                self.speedMeasurementGaugeView?.networkTypeLabel?.text = R.string.localizable.networkUnknown()
                self.speedMeasurementGaugeView?.networkDetailLabel?.text = R.string.localizable.networkNoConnection()
            }
        })
        reachability?.start()

        startMeasurement()
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)

        reachability?.stop()
        reachability = nil
    }

    func displayNoMeasurementTaskEnabledWarningAlert() {
        present(MeasurementHelper.createNoMeasurementTaskEnabledWarningAlert({
            self.performSegue(withIdentifier: R.segue.measurementViewController.present_settings_from_again_no_measurement_task_enabled_alert, sender: self)
        }), animated: true, completion: nil)
    }

    func displayPreMeasurementWarningAlert() {
        present(MeasurementHelper.createPreMeasurementWarningAlert({
            self.startMeasurement()
        }), animated: true, completion: nil)
    }

    @IBAction func viewTapped() {
        if !isRunning {
            return
        }

        let alert = UIAlertController(
            title: R.string.localizable.measurementAbortAlertTitle(),
            message: R.string.localizable.measurementAbortAlertMessage(),
            preferredStyle: .alert
        )

        alert.addAction(UIAlertAction(title: R.string.localizable.measurementAbortAlertContinue(), style: .default, handler: nil))

        alert.addAction(UIAlertAction(title: R.string.localizable.measurementAbortAlertAbort(), style: .destructive) { _ in
            self.stopMeasurement()
        })

        present(alert, animated: true, completion: nil)
    }

    @IBAction func viewMeasurementResultButtonTapped() {
        performSegue(withIdentifier: R.segue.measurementViewController.show_measurement_result, sender: nil)
    }

    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        guard let identifier = segue.identifier else {
            return
        }

        switch identifier {
        case R.segue.measurementViewController.embed_qos_measurement_view_controller.identifier:
            qosMeasurementViewController = segue.destination as? QoSMeasurementViewController

        case R.segue.measurementViewController.show_measurement_result.identifier:
            if let measurementResultViewController = segue.destination as? MeasurementResultTableViewController {
                measurementResultViewController.measurementUuid = measurementUuid
            }

        default: break
        }
    }

    // MARK: - Measurement Code

    ///
    private func startMeasurement() {
        measurementUuid = nil
        openDataUuid = nil

        hideNavigationItems()

        speedMeasurementGaugeView?.isStartButtonEnabled = false

        progressInfoBar?.reset()

        speedMeasurementGaugeView?.reset()
        speedMeasurementBasicResultView?.reset()

        viewMeasurementResultButton?.isHidden = true

        measurementRunner = MEASUREMENT_AGENT.newMeasurementRunner()
        // TODO: fail measurement if runner is nil (could be because agent is not registered)

        overallProgress = Progress(totalUnitCount: Int64(MEASUREMENT_AGENT.enabledProgramsCount()) * 100)

        if MEASUREMENT_AGENT.isProgramTypeEnabled("SPEED") {
            iasProgress = Progress(totalUnitCount: 100, parent: overallProgress!, pendingUnitCount: 100)

            iasPhaseProgress = [SpeedMeasurementPhase: Progress]()
            iasPhaseProgress?[.initialize] = Progress(totalUnitCount: 25, parent: iasProgress!, pendingUnitCount: 25)
            iasPhaseProgress?[.rtt] = Progress(totalUnitCount: 25, parent: iasProgress!, pendingUnitCount: 25)
            iasPhaseProgress?[.download] = Progress(totalUnitCount: 25, parent: iasProgress!, pendingUnitCount: 25)
            iasPhaseProgress?[.upload] = Progress(totalUnitCount: 25, parent: iasProgress!, pendingUnitCount: 25)
        }

        if MEASUREMENT_AGENT.isProgramTypeEnabled("QOS") {
            qosProgress = Progress(totalUnitCount: 100, parent: overallProgress!, pendingUnitCount: 100)
        }

        DispatchQueue.main.async {
            self.progressInfoBar?.setLeftValue(value: "0%", newIcon: .hourglass)
        }

        overallProgressObservation = overallProgress?.observe(\.fractionCompleted, options: .new) { (p, _) in
            DispatchQueue.main.async {
                self.progressInfoBar?.setLeftValue(value: String(format: "%d%%", Int(p.fractionCompleted * 100)))
            }
        }

        measurementRunner?.delegate = self
        measurementRunner?.startMeasurement(preferredSpeedMeasurementPeer: preferredSpeedMeasurementPeer)
    }

    private func stopMeasurement() {
        measurementRunner?.stopMeasurement()
        returnToHomeScreen()
    }

    private func returnToHomeScreen() {
        showNavigationItems()
        navigationController?.popToRootViewController(animated: false)
    }

    private func stopProgress() {
        overallProgressObservation?.invalidate()
        overallProgressObservation = nil

        iasPhaseProgress?.removeAll()
    }

    private func showMeasurementFailureAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)

        // TODO: localization

        alert.addAction(UIAlertAction(title: R.string.localizable.measurementFailureAlertRetry(), style: .default) { _ in
            self.startMeasurement()
        })

        alert.addAction(UIAlertAction(title: R.string.localizable.measurementFailureAlertAbort(), style: .destructive) { _ in
            self.returnToHomeScreen()
        })

        present(alert, animated: true, completion: nil)
    }

    private func showViewMeasurementResultButton() {
        viewMeasurementResultButton?.isHidden = false
    }
}

// MARK: - MeasurementRunnerDelegate

extension MeasurementViewController: MeasurementRunnerDelegate {

    func measurementWillStartRequestingControlModel(_ runner: MeasurementRunner) {
        logger.debug("!^! measurementWillStartRequestingControlModel")

        DispatchQueue.main.async {
            self.progressAlert = UIAlertController.createLoadingAlert(title: R.string.localizable.measurementInitiating())
            self.present(self.progressAlert!, animated: true, completion: nil)
        }
    }

    func measurementDidReceiveControlModel(_ runner: MeasurementRunner) {
        logger.debug("!^! measurementDidReceiveControlModel")

        DispatchQueue.main.async {
            self.progressAlert?.dismiss(animated: false) {
                self.progressAlert = nil
            }
        }
    }

    func measurementDidStart(_ runner: MeasurementRunner) {
        logger.debug("!^! did start")

        isRunning = true
    }

    func measurementDidStop(_ runner: MeasurementRunner) {
        isRunning = false

        stopProgress()

        DispatchQueue.main.async {
            self.showNavigationItems()
            self.speedMeasurementGaugeView?.isStartButtonEnabled = true

            self.progressInfoBar?.reset()
            self.speedMeasurementGaugeView?.reset()

            /*self.progressAlert?.dismiss(animated: true) {
                self.progressAlert = nil
                self.returnToHomeScreen()
            }*/
        }
    }

    func measurementDidFinish(_ runner: MeasurementRunner, measurementUuid: String?, openDataUuid: String?) {
        self.measurementUuid = measurementUuid
        self.openDataUuid = openDataUuid

        logger.debug("!^! did finish")

        isRunning = false

        DispatchQueue.main.async {
            //self.showNavigationItems()

            //self.progressInfoBar?.reset()
            //self.speedMeasurementGaugeView?.reset()

            self.showViewMeasurementResultButton()
        }
    }

    func measurementDidFail(_ runner: MeasurementRunner) {
        logger.debug("!^! did fail")

        isRunning = false

        let presentFailureAlert = {
            self.showMeasurementFailureAlert(
                title: R.string.localizable.measurementFailureAlertTitle(),
                message: R.string.localizable.measurementFailureAlertMessage()
            )
        }

        DispatchQueue.main.async {
            if self.progressAlert != nil {
                self.progressAlert?.dismiss(animated: false) {
                    self.progressAlert = nil
                    presentFailureAlert()
                }
            } else {
                presentFailureAlert()
            }
        }
    }

    func measurementRunner(_ runner: MeasurementRunner, willStartProgramWithName name: String, implementation: ProgramProtocol) {
        logger.debug("!^! willStart program \(name)")

        (implementation as? IASProgram)?.delegate = self
        (implementation as? QoSProgram)?.forwardDelegate = self

        if implementation is QoSProgram {
            DispatchQueue.main.async {
                self.qosView?.alpha = 0
                self.qosView?.isHidden = false
                UIView.transition(with: self.qosView!, duration: 0.3, options: .transitionCrossDissolve, animations: {
                    self.qosView?.alpha = 1
                    self.speedMeasurementGaugeView?.alpha = 0
                }, completion: { _ in
                    self.speedMeasurementGaugeView?.isHidden = true
                })
            }
        }
    }

    func measurementRunner(_ runner: MeasurementRunner, didFinishProgramWithName name: String, implementation: ProgramProtocol) {
        logger.debug("!^! didFinish program \(name)")

        (implementation as? IASProgram)?.delegate = nil
        (implementation as? QoSProgram)?.forwardDelegate = nil

        if implementation is IASProgram {
            DispatchQueue.main.async {
                self.speedMeasurementGaugeView?.reset()
            }
        }

        if implementation is QoSProgram {
            // view would switch too fast, user would not recognize the finished qos measurement
            DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(500)) {
                self.speedMeasurementGaugeView?.alpha = 0
                self.speedMeasurementGaugeView?.isHidden = false
                UIView.transition(with: self.qosView!, duration: 0.3, options: .transitionCrossDissolve, animations: {
                    self.qosView?.alpha = 0
                    self.speedMeasurementGaugeView?.alpha = 1
                }, completion: { self.qosView?.isHidden = $0 })
            }
        }
    }
}

// MARK: - IASProgramDelegate

extension MeasurementViewController: IASProgramDelegate {

    func iasMeasurement(_ ias: IASProgram, didStartPhase phase: SpeedMeasurementPhase) {
        logger.debug("did start phase: \(phase)")

        DispatchQueue.main.async {
            self.progressInfoBar?.setRightValue(value: "", newIcon: phase.icon)
            self.speedMeasurementGaugeView?.setActivePhase(phase: phase)

            self.speedMeasurementGaugeView?.speedMeasurementGauge?.value = 0
        }
    }

    func iasMeasurement(_ ias: IASProgram, didFinishPhase phase: SpeedMeasurementPhase) {
        if let p = self.iasPhaseProgress?[phase] {
            p.completedUnitCount = p.totalUnitCount
        }
        self.speedMeasurementGaugeView?.speedMeasurementGauge?.progress = 1
    }

    func iasMeasurement(_ ias: IASProgram, didMeasurePrimaryValue value: Double, inPhase phase: SpeedMeasurementPhase) {
        DispatchQueue.main.async {

            switch phase {
            case .rtt:
                let msValue = value / Double(NSEC_PER_MSEC)
                let msString = String(format: "%.2f", msValue)

                self.progressInfoBar?.setRightValue(value: "\(msString) \(R.string.localizable.generalUnitsMs())")
                self.speedMeasurementBasicResultView?.setText(msString, forPhase: phase)
            case .download, .upload:
                let mbpsValue = value / 1_000_000.0
                let mbpsString = String(format: "%.2f", mbpsValue)

                self.progressInfoBar?.setRightValue(value: "\(mbpsString) M\(R.string.localizable.generalUnitsBps())")
                self.speedMeasurementBasicResultView?.setText(mbpsString, forPhase: phase)

                let mbpsLog = SpeedHelper.throughputLogarithmMbps(bps: value)
                self.speedMeasurementGaugeView?.speedMeasurementGauge?.value = mbpsLog
            default: break//reset()
            }
        }
    }

    func iasMeasurement(_ ias: IASProgram, didUpdateProgress progress: Double, inPhase phase: SpeedMeasurementPhase) {
        if let p = self.iasPhaseProgress?[phase] {
            p.completedUnitCount = Int64(Double(p.totalUnitCount) * progress)
        }
        self.speedMeasurementGaugeView?.speedMeasurementGauge?.progress = progress
    }
}

// MARK: - QoSTaskExecutorDelegate

extension MeasurementViewController: QoSTaskExecutorDelegate {

    func taskExecutorDidStart(_ taskExecutor: QoSTaskExecutor, withTaskGroups groups: [QoSTaskGroup]) {
        DispatchQueue.main.async {
            self.progressInfoBar?.setRightValue(value: "0%", newIcon: .qos)
        }

        self.qosMeasurementViewController?.groups = groups
    }

    func taskExecutorDidFail(_ taskExecutor: QoSTaskExecutor, withError error: Error?) {

    }

    func taskExecutorDidStop(_ taskExecutor: QoSTaskExecutor) {

    }

    func taskExecutorDidUpdateProgress(_ progress: Double, ofGroup group: QoSTaskGroup, totalProgress: Double) {
        DispatchQueue.main.async {
            self.progressInfoBar?.setRightValue(value: String(format: "%d%%", Int(totalProgress * 100)))
        }

        qosProgress?.completedUnitCount = Int64(totalProgress * Double(qosProgress!.totalUnitCount)) // !
        self.qosMeasurementViewController?.updateProgress(progress: progress, forGroup: group)
    }

    func taskExecutorDidFinishWithResult(_ result: [QoSTaskResult]) {
        qosProgress?.completedUnitCount = qosProgress!.totalUnitCount // !
    }
}
