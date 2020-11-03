/*!
    \file Speed.h
    \author zafaco GmbH <info@zafaco.de>
    \date Last update: 2020-11-03

    Copyright (C) 2016 - 2020 zafaco GmbH

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

#import <Foundation/Foundation.h>
#import <WebKit/WebKit.h>
#import "ios_connector.h"

@import CocoaLumberjack;
@import Common;

FOUNDATION_EXPORT double SpeedVersionNumber;

FOUNDATION_EXPORT const unsigned char SpeedVersionString[];




@protocol SpeedDelegate <NSObject>


/**************************** Required Delegate Functions ****************************/

@required

-(void)measurementCallbackWithResponse:(NSDictionary*)response;                                 /**< NSDictionary measurement callback */
-(void)measurementDidCompleteWithResponse:(NSDictionary*)response withError:(NSError*)error;    /**< NSDictionary callback on measurement complete */
-(void)measurementDidStop;                                                                      /**< Meaurement callback on measurement stop*/

@end




@interface Speed : NSObject


/**************************** Static Functions ****************************/

+(NSString*)version;




/**************************** Public Variables ****************************/

@property (nonatomic, strong) id speedDelegate;                         /**< speed Protocol Delegate */

@property (nonatomic, strong) NSArray *targets;                         /**< DL/UL: Measurement target servers */
@property (nonatomic, strong) NSString *targetTld;                      /**< TLD of measurement target servers */
@property (nonatomic, strong) NSString *targetPort;                     /**< Port of measurement target servers */
@property (nonatomic, strong) NSString *targetPortRtt;                  /**< Port of measurement target servers */
@property (nonatomic) NSInteger wss;                                    /**< WebSocket Secure */

@property (nonatomic) bool performRttUdpMeasurement;                    /**< Perform RTT Measurement */
@property (nonatomic) bool performDownloadMeasurement;                  /**< Perform Download Measurement */
@property (nonatomic) bool performUploadMeasurement;                    /**< Perform Upload Measurement */
@property (nonatomic) bool performRouteToClientLookup;                  /**< Perform Native RouteToClient Lookup */
@property (nonatomic) bool performGeolocationLookup;                    /**< Perform Geolocation Lookup */

@property (nonatomic) NSInteger routeToClientTargetPort;                /**< RouteToClient Target Port */

@property (nonatomic, strong) NSNumber *parallelStreamsDownload;        /**< DL: Number of parallel Measurement Streams */
@property (nonatomic, strong) NSNumber *parallelStreamsUpload;          /**< UL: Number of parallel Measurement Streams */




@property (nonatomic, strong) NSString *authToken;                      /**< Authentication Token */
@property (nonatomic, strong) NSString *authTimestamp;                  /**< Authentication Timestamp */

/**************************** Public Delegate Functions Speed ****************************/

-(void)measurementStart;                                                /**< Start Measurement */
-(void)measurementStop;                                                 /**< Stop Measurement */

@end
