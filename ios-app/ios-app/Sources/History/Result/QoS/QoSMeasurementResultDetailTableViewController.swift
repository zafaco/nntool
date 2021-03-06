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

class QoSMeasurementResultDetailTableViewController: UITableViewController {

    var task: QoSTaskResultItem?

    override func viewDidLoad() {
        super.viewDidLoad()

        navigationItem.title = task?.title

        tableView.estimatedRowHeight = 80
        tableView.rowHeight = UITableView.automaticDimension
    }
}

// MARK: TableView

extension QoSMeasurementResultDetailTableViewController {

    ///
    override func numberOfSections(in tableView: UITableView) -> Int {
        return 3
    }

    ///
    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        switch section {
        case 1:
            return task?.evaluations?.count ?? 0
        default:
            return 1
        }
    }

    ///
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        var cell: UITableViewCell

        switch indexPath.section {
        case 0:
            cell = tableView.dequeueReusableCell(withIdentifier: R.reuseIdentifier.qos_task_summary_cell.identifier, for: indexPath)

            cell.textLabel?.text = task?.localizedSummary
        case 1:
            cell = tableView.dequeueReusableCell(withIdentifier: R.reuseIdentifier.qos_task_evaluation_cell.identifier, for: indexPath)

            if let evaluation = task?.evaluations?[indexPath.row] {
                cell.textLabel?.text = evaluation.text

                var accessoryLabel: UILabel?

                switch evaluation.outcome! {
                case .ok:
                    accessoryLabel = UILabel.createIconLabel(icon: .check, textColor: COLOR_CHECKMARK_GREEN)
                case .info:
                    accessoryLabel = UILabel.createIconLabel(icon: .about, textColor: COLOR_CHECKMARK_DARK_GRAY)
                case .fail:
                    accessoryLabel = UILabel.createIconLabel(icon: .cross, textColor: COLOR_CHECKMARK_RED)
                }

                accessoryLabel?.sizeToFit()
                accessoryLabel?.numberOfLines = 0
                accessoryLabel?.textAlignment = .center

                cell.accessoryView = accessoryLabel
            }
        case 2:
            cell = tableView.dequeueReusableCell(withIdentifier: R.reuseIdentifier.qos_task_description_cell.identifier, for: indexPath)

            cell.textLabel?.text = task?.localizedDescription
        default:
            cell = UITableViewCell()
        }

        return cell
    }

    ///
    override func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        switch section {
        case 0:
            return R.string.localizable.historyQosDetailDescription()
        case 1:
            return R.string.localizable.historyQosDetailResults()
        case 2:
            return R.string.localizable.historyQosDetailDetails()
        default:
            return nil
        }
    }
}
