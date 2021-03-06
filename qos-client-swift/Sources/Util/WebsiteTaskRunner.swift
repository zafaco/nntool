/***************************************************************************
 * Copyright 2017 appscape gmbh
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
 ***************************************************************************/

import Foundation
import WebKit
import nntool_shared_swift

///
class WebsiteTaskRunner: NSObject {

    ///
    private var status: QoSTaskStatus = .unknown

    ///
    private var webView: WKWebView?

    ///
    private var startedAt: UInt64 = 0

    ///
    private var duration: UInt64 = 0

    ///
    private var semaphore = DispatchSemaphore(value: 0)

    ///
    private var requestCount = 0

    ///
    private var uid: UInt?

    //

    ///
    init(uid: UInt) {
        super.init()

        self.uid = uid
    }

    ///
    func run(urlObj: URL, timeout: UInt64) -> (WebsiteTaskResultEntry?, UInt64?, QoSTaskStatus) {
        logger.debug("before sync")
        DispatchQueue.main.sync {
            // clear cache
            WKWebsiteDataStore.default().removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(),
                                                    modifiedSince: Date(timeIntervalSince1970: 0),
                                                    completionHandler: {})

            self.webView = WKWebView()
            self.webView?.navigationDelegate = self

            let request = NSMutableURLRequest(url: urlObj)
            self.tagRequest(request: request)

            self.webView?.load(request as URLRequest)

            logger.debug("AFTER LOAD REQUEST")
        }
        logger.debug("after sync")

        let semaphoneTimeout = DispatchTime.now() + DispatchTimeInterval.nanoseconds(Int(truncatingIfNeeded: timeout))

        status = semaphore.wait(timeout: semaphoneTimeout) == .timedOut ? .timeout : .ok

        duration = TimeHelper.currentTimeNs() - startedAt

        let protocolResult = WebsiteTaskUrlProtocol.queryResultWithTag(tag: "\(String(describing: uid))")

        DispatchQueue.main.sync {
            webView?.stopLoading()
            webView = nil
        }

        return (protocolResult, duration, status)
    }

    ///
    func tagRequest(request: NSMutableURLRequest) {
        WebsiteTaskUrlProtocol.tagRequest(request: request, withValue: "\(String(describing: uid))")
    }
}

// MARK: UIWebViewDelegate methods

extension WebsiteTaskRunner: WKNavigationDelegate {

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        assert(status == .unknown)

        if let r = navigationAction.request as? NSMutableURLRequest {
            tagRequest(request: r)
        }

        if startedAt == 0 {
            startedAt = TimeHelper.currentTimeNs()
        }

        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        requestCount += 1
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        maybeDone()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        status = .error
        maybeDone()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        status = .error
        maybeDone()
    }

    ///
    func maybeDone() {
        if status == .timeout || status == .error {
            return
        }

        assert(requestCount > 0)

        requestCount -= 1

        if requestCount == 0 {
            semaphore.signal()
        }
    }
}
