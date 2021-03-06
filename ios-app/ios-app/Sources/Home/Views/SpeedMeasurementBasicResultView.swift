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

///
@IBDesignable class SpeedMeasurementBasicResultView: NibView {

    @IBOutlet private var rttValueLabel: UILabel?
    @IBOutlet private var downloadValueLabel: UILabel?
    @IBOutlet private var uploadValueLabel: UILabel?

    @IBOutlet private var rttTitleLabel: UILabel?
    @IBOutlet private var downloadTitleLabel: UILabel?
    @IBOutlet private var uploadTitleLabel: UILabel?

    override func awakeFromNib() {
        rttTitleLabel?.text = "\(R.string.localizable.measurementSpeedPhaseRtt()) (\(R.string.localizable.generalUnitsMs()))"
        downloadTitleLabel?.text = "\(R.string.localizable.measurementSpeedPhaseDownload()) (M\(R.string.localizable.generalUnitsBps()))"
        uploadTitleLabel?.text = "\(R.string.localizable.measurementSpeedPhaseUpload()) (M\(R.string.localizable.generalUnitsBps()))"
    }

    func setText(_ text: String, forPhase phase: SpeedMeasurementPhase) {
        switch phase {
        case .rtt: rttValueLabel?.text = text
        case .download: downloadValueLabel?.text = text
        case .upload: uploadValueLabel?.text = text
        default: break
        }
    }

    func reset() {
        rttValueLabel?.text = " " // empty string or nil causes stack view to collapse
        downloadValueLabel?.text = " "
        uploadValueLabel?.text = " "
    }
}
