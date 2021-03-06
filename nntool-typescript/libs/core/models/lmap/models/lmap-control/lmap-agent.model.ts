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

export class LmapAgent {
  /**
   * The agent-id identifies a Measurement Agent with a very low probability of collision (i.e. a UUID v4).
   * In certain deployments, the agent-id may be considered sensitive, and hence this object is optional.
   */
  public 'agent-id'?: string;

  /**
   * The group-id identifies a group of Measurement Agents.
   * In certain deployments, the group-id may be considered less sensitive than the agent-id.
   */
  public 'group-id'?: string;

  /**
   * The measurement point indicating where the Measurement Agent is located on a path.
   */
  public 'measurement-point'?: string;

  /**
   * The 'report-agent-id' controls whether the 'agent-id' is reported to Collectors.
   * Set to true if anonymized results are desired.
   */
  public 'report-agent-id'?: boolean;

  /**
   * The 'report-group-id' controls whether the 'group-id' is reported to Collectors.
   */
  public 'report-group-id'?: boolean;

  /**
   * The 'report-measurement-point' controls whether the 'measurement-point' is reported to Collectors.
   */
  public 'report-measurement-point'?: boolean;

  /**
   * A timer is started after each successful contact with a Controller.
   * When the timer reaches the controller-timeout, an event (controller-lost)
   * is raised indicating that connectivity to the Controller has been lost.
   */
  public 'controller-timeout'?: number;

  /**
   * The date and time the Measurement Agent last started (i.e. the date to the previous
   * execution of the measurement agent before the current one).
   */
  public 'last-started': string; // TODO change to date
}
