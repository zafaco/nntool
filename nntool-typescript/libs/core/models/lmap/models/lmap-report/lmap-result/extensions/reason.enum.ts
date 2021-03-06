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

export enum Reason {
  /**
   * Use this if the connection to the measurement server couldn't be established.
   */
  UNABLE_TO_CONNECT = 'UNABLE_TO_CONNECT',

  /**
   * Use this if the connection was lost during a measurement.
   */
  CONNECTION_LOST = 'CONNECTION_LOST',

  /**
   * Use this if the network category changed (e.g. from MOBILE to WIFI).
   */
  NETWORK_CATEGORY_CHANGED = 'NETWORK_CATEGORY_CHANGED',

  /**
   * Use this if the App was put to background on mobile devices.
   */
  APP_BACKGROUNDED = 'APP_BACKGROUNDED',

  /**
   * Use this if the user aborted the measurement.
   */
  USER_ABORTED = 'USER_ABORTED'
}
